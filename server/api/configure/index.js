'use strict';

var express = require('express');
var controller = require('./configure.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.ensureAuthenticated, controller.index);
router.put('/update', auth.ensureAuthenticated, controller.update);

module.exports = router;