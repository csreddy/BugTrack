'use strict';

var passport = require('passport');
var config = require('../config/environment');

function ensureAuthenticated(req, res, next) {
    console.log('req.user = ', req.user);
    if (req.isAuthenticated()) {
        return next();
    } else {
    	 //res.redirect('/login')
        return res.send(401, {
            message: 'Please sign in'
        });
    }
}


exports.ensureAuthenticated = ensureAuthenticated; 