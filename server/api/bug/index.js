'use strict';

var express = require('express');
var controller = require('./bug.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count)
router.get('/facets',  controller.facets);
router.get('/:id(\\d+)', controller.id);
router.put('/:id/subscribe',auth.ensureAuthenticated, controller.subscribe);
router.put('/:id/unsubscribe', auth.ensureAuthenticated, controller.unsubscribe);
router.get('/:id/clones', controller.clones);
router.post('/new', auth.ensureAuthenticated, controller.new);
router.put('/update', auth.ensureAuthenticated, controller.update);
router.post('/clone', auth.ensureAuthenticated, controller.clone);

module.exports = router; 