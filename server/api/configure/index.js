'use strict';

var express = require('express');
var controller = require('./configure.controller');

var router = express.Router();

router.get('/', controller.index);
router.put('/update', controller.update);

module.exports = router;