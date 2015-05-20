var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);

exports.setup = function() {
    passport.use(new LocalStrategy(function(username, password, done) {
        var authenticate = {
                source: "var auth = xdmp.login(username, password); \
                    if (auth) { \
                        xdmp.getCurrentUser(); \
                    } else{ \
                       'auth failed';           \
                    }; \
                    ",
                variables: {
                    username: username,
                    password: password
                }
            }
            //  code = "'hello!'"
        db.eval(authenticate).result(function(user) {
            console.log('USER', user);
            if (user[0].value === 'auth failed') {
                return done(null, false, {
                    status: 401,
                    message: 'Authentication failed.'
                });
            }

            db.documents.read('/users/' + user[0].value + '.json').result(function(document) {
                if (document.length === 0) {
                    return done(null, false, {
                        status: 404,
                        message: 'User does not exist in the database.'
                    });
                } else {
                    return done(null, {
                        username: username
                    }, {
                        message: 'authentication succeeded'
                    });
                }

            }, function(error) {
                console.log(error);
                return done(null, false, {
                    status: 500,
                    message: 'ERROR: ' + error
                })
            })
        }, function(error) {
            console.log(JSON.stringify(error, null, 2))
            if (error.code === 'ECONNREFUSED') {
                return done(null, false, {
                    status: 503,
                    message: 'Database connection refused'
                })
            } else {
                return done(null, false, {
                    status: 500,
                    message: 'ERROR: ' + error
                })
            }

        })




    }));
};