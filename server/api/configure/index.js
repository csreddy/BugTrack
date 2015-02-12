'use strict';

var express = require('express');
var controller = require('./configure.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.put('/update', controller.update);
router.put('/adduserstogroup', controller.adduserstogroup);
router.put('/removeusersfromgroup', controller.removeusersfromgroup);

module.exports = router;