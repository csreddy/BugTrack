'use strict';

var express = require('express');
var controller = require('./search.controller');

var router = express.Router();

function ensureAuthenticated(req, res, next) {
    console.log('------------from search ----------------');
    console.log('req.user', req.user);
    var username = req.originalUrl.replace('/users/', '');
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.send(401, {
            message: 'Please sign in'
        });
    }
}

router.post('/', ensureAuthenticated, controller.search);




module.exports = router;