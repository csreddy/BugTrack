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


// Setup server
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
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

console.log('starting BugTrack.......');

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// authentication
passport.serializeUser(function(user, done) {
    console.log('serializeUser:', user);
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


app.get('/doc/:a/:b', function(req, res) {
console.log('URL', req.params);
var data = {a: req.params.a, b: req.params.b}
res.json(data);

    /*db.documents.read(req.url).result(function(response) {
        res.status(200).json(response.documents[0])
    }, function(error) {
        res.status(404).json({message: 'error'})
    })*/
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
