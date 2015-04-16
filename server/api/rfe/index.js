'use strict';

var express = require('express');
var controller = require('./rfe.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count);
router.post('/new', controller.new)
router.put('/update', controller.update);
router.get('/:id(\\d+)', controller.id);
router.get('/:id(\\d+)/subtasks', controller.subtasks);
router.put('/:id(\\d+)/subscribe', controller.subscribe);
router.put('/:id(\\d+)/unsubscribe', controller.unsubscribe);
router.get('/:version/parentAndSubTasks', controller.getParentAndSubTasks)
router.put('/insertProceduralTask', controller.insertProceduralTask);
router.put('/insertSubTask', controller.insertSubTask);
module.exports = router;