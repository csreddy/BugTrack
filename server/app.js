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

// for logger
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'BugTrack',
    serializers: {
        req: bunyan.stdSerializers.req
    }
});


// Setup server
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser());

app.use(multer({
    dest: './uploads/'
}));

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


log.info('starting BugTrack.......');

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// authentication
passport.serializeUser(function(user, done) {
    log.info('serializeUser:', user);
    done(null, user.username);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


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
            req.pipe(request(url, {
                auth: {
                    user: 'admin',
                    pass: 'admin',
                    sendImmediately: false
                }
            }, function(error, response, body) {
                if (error) {
                    next(error);
                }
            })).pipe(res);
            break;
        default:
            log.info('nothing to do');
    }
});


app.get('/userinfo', function(req, res) {
    // log.info('===================== req.user', req.user);
    var uri = '/users/' + req.user + '.json';
    if (req.user) {
        db.documents.read(uri).result(function(document) {
            var bodyObj = document[0].content;
            delete bodyObj.password;
            delete bodyObj.createdAt;
            delete bodyObj.modifiedAt;
            res.send(bodyObj);
        }, function(error) {
            res.send(500, {
                message: 'Error occured.\n' + error
            })
        });
    } else {
        res.send(401, {
            message: 'Please sign in'
        })
    }

});



var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function() {
    log.info('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;