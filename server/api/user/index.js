'use strict';

var express = require('express');
var controller = require('./user.controller');

var router = express.Router();

router.get('/', ensureAuthenticated, controller.index);
router.get('/:username', ensureAuthenticated, controller.username);
router.put('/savedefaultquery', ensureAuthenticated, controller.saveDefaultQuery);


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