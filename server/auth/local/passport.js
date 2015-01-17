var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);


exports.setup = function() {
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
                return done(null, false, {
                    status: 503,
                    message: 'Database connection refused'
                })
            } else {
                return done(null, false, {
                    status: 500,
                    message: error.code
                })
            }
        })

    }));
};