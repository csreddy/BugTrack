'use strict';

var passport = require('passport');
var config = require('../config/environment');

function ensureAuthenticated(req, res, next) {
    console.log('req.user = ', req.user);
    var username = req.originalUrl.replace('/users/', '');
    if (req.isAuthenticated()) {
        return next();
    } else {
    	 res.redirect('/login')
       /* res.send(401, {
            message: 'Please sign in'
        });*/
    }
}


exports.ensureAuthenticated = ensureAuthenticated; 