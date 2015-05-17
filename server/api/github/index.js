'use strict';

var express = require('express');
var controller = require('./github.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/issues', auth.ensureAuthenticated, controller.issues);
router.get('/issue', auth.ensureAuthenticated, controller.issue);

module.exports = router;