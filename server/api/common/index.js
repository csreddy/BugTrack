'use strict';

var express = require('express');
var controller = require('./common.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/nextId', controller.getNextId);
router.get('/document', controller.document);
router.get('/listGitHubBugs', controller.listGitHubBugs);
router.get('/listTransformedGitHubBugs', controller.listTransformedGitHubBugs);
router.get('/transformAndLoadGitHubBugs', controller.transformAndLoadGitHubBugs);
router.get('/getGitHubIssue', controller.getGitHubIssue);
router.get('/transformGitHubIssue', controller.transformGitHubIssue);
router.get('/transformAndLoadGitHubIssue', controller.transformAndLoadGitHubIssue);

module.exports = router;