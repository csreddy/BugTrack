var express = require('express');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var router = express.Router();



/* GET user profile. */
router.get('/:username', ensureAuthenticated, function(req, res) {
    res.locals.errors = req.flash();
    console.log('request----', req.user);
    // console.log(req);
    console.log(res.locals);
    //  console.log('----------', req.user.username);
    // res.render('users', {
    //     errors: res.locals.errors
    // });
    res.send({
        username: req.user
    });
});

// save default user query
router.put('/savedefaultquery', ensureAuthenticated, function(req, res) {
    res.locals.errors = req.flash();
    var p = marklogic.patchBuilder;
    db.documents.patch('/user/'+req.user+'.json', 
        p.replace('/node("savedQueries")/node("default")',  req.body)
        ).result(function(response) {
           res.status(204).json(response);
        });

});



// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    console.log('------------from user.js ----------------');
    console.log('req.user', req.user);
    var username = req.originalUrl.replace('/user/', '');
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.send(401, {
            message: 'Please sign in'
        });
    }



}

module.exports = router;