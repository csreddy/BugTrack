'use strict';

var express = require('express');
var controller = require('./task.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count);
router.post('/new', controller.new)
router.put('/update', controller.update);
router.get('/:id(\\d+)', controller.id);
router.put('/:id/subscribe', controller.subscribe);
router.put('/:id/unsubscribe', controller.unsubscribe);

module.exports = router;