'use strict';

var express = require('express');
var controller = require('./common.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/nextId', controller.getNextId);
router.get('/document', controller.document);
router.get('/goto', controller.goto);

module.exports = router;