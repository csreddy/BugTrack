'use strict';

var express = require('express');
var controller = require('./bug.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count)
router.get('/facets',  controller.facets);
router.get('/:id(\\d+)', controller.id);
router.put('/:id/subscribe', controller.subscribe);
router.put('/:id/unsubscribe', controller.unsubscribe);
router.post('/new', auth.ensureAuthenticated, controller.new);
router.put('/update', controller.update);
router.post('/clone', controller.clone);
module.exports = router; 