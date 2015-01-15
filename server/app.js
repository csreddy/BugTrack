/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var session = require('express-session');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var multer = require('multer');
var marklogic = require('marklogic');
var conn = require('./config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var fs = require('fs');

//var routes = require('routes');
//var user = require('./routes/user');
//var bug = require('./routes/bug');
//var search = require('./routes/search');
//var login = require('./routes/login');

// Setup server
var app = express();
app.use(multer({
    dest: './uploads/'
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(session({
    name: 'bugtrack',
    secret: 'mysecret',
    saveUninitialized: true,
    resave: true,
    cookie: {
        maxAge: 3600000
    },
    rolling: true
}));

console.log('starting BugTrack.......');

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// app.use('/', routes);
// app.use('/user', user);
// app.use('/login', login);
// app.use('/bug', bug);
// app.use('/search', search);


// authentication
passport.serializeUser(function(user, done) {
    console.log('serializeUser:', user);
    done(null, user.username);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new LocalStrategy(function(username, password, done) {
    db.documents.read('/users/' + username + '.json').result(function(document) {
        console.log('document', document);
        if (document.length === 0) {
            return done(null, false, {
                status: 404,
                message: 'User does not exist'
            });
        }

        if (document[0].content.password === password) {
            return done(null, {
                status: 200,
                username: document[0].content.username
            })
        } else {
            return done(null, false, {
                status: 401,
                message: 'Incorrect password'
            })
        }
        done();
    }, function(error) {
        console.log(error);
        if (error.code === 'ECONNREFUSED') {
            return done(null, false, {status: 503, message: 'Database connection refused'})
        } else{
            return done(null, false, {status: 500, message: error.code})
        }
    })

}));

process.on('uncaughtException', function(err) {
    console.error('uncaughtException: ' + err.message);
    console.error('ERROR', err.stack);
    process.exit(1); // exit with error
});


// api calls
app.use('/v1/', function(req, res, next) {
    'use strict';

    function handleConnRefused(err, resp, body) {
        if (err.code === 'ECONNREFUSED') {
            console.error('Refused connection');
            next(err);
        } else {
            throw err;
        }
    }
    var url = 'http://localhost:8003/v1' + req.url;

    switch (req.method) {
        case 'GET':
            req.pipe(request(url, function(error, response, body) {
                if (error) {
                    next(error);
                }
            })).pipe(res);
            break;
        case 'PUT':
            var options = {
                method: 'PUT',
                url: url,
                body: req.body,
                json: true
            };

            req.pipe(request(options, function(error, response, body) {
                if (error) {
                    next(error);
                }
            })).pipe(res);
            break;
        case 'POST':
            console.log('its a POST');
            var url = 'http://localhost:8003/v1/documents?extension=json';
            var options = {
                method: 'POST',
                headers: req.headers,
                url: url,
                body: JSON.stringify(req.body)
            };

            req.pipe(request(options, function(error, response, body) {
                if (error) {
                    next(error);
                }
            })).pipe(res);
            break;
        default:
            console.log('nothing to do');
    }

});

app.get('/userinfo', function(req, res) {
    console.log('===================== req.user', req.user);
    var uri = '/users/'+ req.user + '.json';
    if (req.user) {
    db.documents.read(uri).result(function(document) {
            var bodyObj = document[0].content;
            delete bodyObj.password;
            delete bodyObj.createdAt;
            delete bodyObj.modifiedAt;
            res.send(bodyObj);
    }, function(error) {
        res.send(500, {message: 'Error occured.\n' + error})
    });
    } else{
       res.send(401, {message: 'Please sign in'}) 
    }

});

app.post('/login', function(req, res, next) {
    console.log("Login...", req.body);
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            //console.log('info', info);
            req.session.messages = [info.message];
            return res.send(401, info);
        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            console.log('from /login post', req.user);
            return res.send(req.user);
        });
    })(req, res, next);
});


// logout
app.get('/logout', function(req, res, next) {
    /*  this is not working
   http://stackoverflow.com/questions/13758207/why-is-passportjs-in-node-not-removing-session-on-logout
   req.logout();
    console.log('logged out');
    res.redirect('/#/login');
    */

    req.session.destroy(function(err) {
        res.redirect('/login'); //Inside a callback… bulletproof!
    });
});


var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
