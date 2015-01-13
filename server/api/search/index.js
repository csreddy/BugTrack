'use strict';

var express = require('express');
var controller = require('./search.controller');

var router = express.Router();

console.log('==================controller', controller);
router.post('/', controller.search);

module.exports = router;