'use strict';

var express = require('express');
var controller = require('./user.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.ensureAuthenticated, controller.index);
router.get('/:username', controller.username);
router.put('/savedefaultquery', auth.ensureAuthenticated, controller.saveDefaultQuery);
router.put('/saveQuery', auth.ensureAuthenticated, controller.saveQuery);
router.put('/deleteQuery', auth.ensureAuthenticated, controller.deleteQuery)
router.post('/create', controller.create);

module.exports = router;