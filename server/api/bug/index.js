'use strict';

var express = require('express');
var controller = require('./bug.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count)
router.get('/facets', controller.facets);
router.get('/:id(\\d+)', controller.id);
router.post('/new', controller.new);

module.exports = router; 