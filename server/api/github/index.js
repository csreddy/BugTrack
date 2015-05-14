'use strict';

var express = require('express');
var controller = require('./github.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/issues', controller.issues);
router.get('/issue', controller.issue);

module.exports = router;