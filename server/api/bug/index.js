'use strict';

var express = require('express');
var controller = require('./bug.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count)
router.get('/facets',  controller.facets);
router.get('/:id(\\d+)', controller.id);

router.post('/new', auth.ensureAuthenticated, controller.new);
router.put('/update', controller.update);

module.exports = router; 