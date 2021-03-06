'use strict';

var express = require('express');
var passport = require('passport');
var router = express.Router();

// login
router.post('/login', function(req, res, next) {
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
router.get('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
        res.redirect('/login'); //Inside a callback… bulletproof!
    });
});

module.exports = router;