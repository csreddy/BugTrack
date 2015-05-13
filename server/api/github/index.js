'use strict';

var express = require('express');
var controller = require('./github.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/listGitHubBugs', controller.listGitHubBugs);
router.get('/listTransformedGitHubBugs', controller.listTransformedGitHubBugs);
router.get('/transformAndLoadGitHubBugs', controller.transformAndLoadGitHubBugs);
router.get('/getGitHubIssue', controller.getGitHubIssue);
router.get('/transformGitHubIssue', controller.transformGitHubIssue);
router.get('/loadGitHubIssue', controller.loadGitHubIssue);

module.exports = router;