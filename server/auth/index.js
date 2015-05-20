'use strict';

var express = require('express');
var passport = require('passport');
var controller = require('./auth.service');
var config = require('../config/environment');
var router = express.Router();


/*// Passport Configuration
require('./local/passport').setup();
router.use('/local', require('./local'));*/


// Passport Configuration
require('./ml_ldap/passport').setup();
router.use('/ml_ldap', require('./ml_ldap'));

module.exports = router; 