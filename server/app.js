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

var routes = require('./routes/routes');
var user = require('./routes/user');
var bug = require('./routes/bug');
var search = require('./routes/search');
var login = require('./routes/login');


// Setup server
var app = express();
app.use(multer({
    dest: './uploads/'
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(session({
    name: 'test',
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
    var url = 'http://' + username + ':' + password + '@localhost:8003/v1/search';
    var userURI = 'http://localhost:8003/v1/documents?uri=/user/' + username + '.json';

	console.log('userURI', userURI);
    var options = {
        method: 'GET',
        url: userURI
    };
    request(options, function(error, response, body) {
        if (error) {
            return done(null, false, {
                status: 503,
                message: 'Database connection refused'
            });
        }

        body = JSON.parse(body);
        console.log('response = ', typeof body);
        if (response.statusCode === 404) {
            return done(null, false, {
                status: 404,
                message: 'User does not exist'
            });
        } else if (response.statusCode === 200) {
            console.log('body.password = ', body.password);
            console.log('password = ', password);
            if (body.password === password) {
                return done(null, {
                    status: 200,
                    username: username
                });
            } else {
                return done(null, false, {
                    status: 401,
                    message: 'Incorrect password.'
                });
            }
        } else {
            return done(error);
        }
    });

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
    // req.user = "admin";
    var url = 'http://localhost:8003/v1/documents?uri=/user/' + req.user + '.json';
    console.log('URL ==== ', url);
    request(url, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var bodyObj = JSON.parse(body);
            delete bodyObj.password;
            delete bodyObj.createdAt;
            delete bodyObj.modifiedAt;
            res.send(bodyObj);
        } else {
            res.send(401, {
                message: 'Please sign in'
            });
        }

    });
});

app.post('/login', function(req, res, next) {
	console.log("Login...", req.body);
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
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
        res.redirect('/#/login'); //Inside a callback… bulletproof!
    });
});


var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes/routes')(app);

// Start server
server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app; 