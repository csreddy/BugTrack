'use strict';

var express = require('express');
var controller = require('./user.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.ensureAuthenticated, controller.index);
router.get('/:username', auth.ensureAuthenticated, controller.username);
router.put('/savedefaultquery', auth.ensureAuthenticated, controller.saveDefaultQuery);
router.post('/create', auth.ensureAuthenticated, controller.create);

module.exports = router;