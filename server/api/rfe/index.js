'use strict';

var express = require('express');
var controller = require('./rfe.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', controller.index);
router.get('/count', controller.count);
router.post('/new', auth.ensureAuthenticated, controller.new)
router.put('/update', auth.ensureAuthenticated, controller.update);
router.get('/:id(\\d+)', auth.ensureAuthenticated, controller.id);
router.get('/:id(\\d+)/subtasks', auth.ensureAuthenticated, controller.subtasks);
router.put('/:id(\\d+)/subscribe', auth.ensureAuthenticated, controller.subscribe);
router.put('/:id(\\d+)/unsubscribe', auth.ensureAuthenticated, controller.unsubscribe);
router.get('/:version/parentAndSubTasks', auth.ensureAuthenticated, controller.getParentAndSubTasks)
router.put('/insertProceduralTask', auth.ensureAuthenticated, controller.insertProceduralTask);
router.put('/insertSubTask', auth.ensureAuthenticated, controller.insertSubTask);
module.exports = router;