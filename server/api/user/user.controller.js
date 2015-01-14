'use strict';

var fs = require('fs');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var maxLimit = 99999999;
var _ = require('lodash');

// Get list of users
exports.index = function(req, res) {
  res.json([{message: 'list of users'}]);
};

exports.username = function(req, res) {
  res.locals.errors = req.flash();
    console.log('request----', req.user);
    console.log(res.locals);
    res.send({
        username: req.user
    });
};


exports.saveDefaultQuery = function(req, res) {
	res.locals.errors = req.flash();
    var p = marklogic.patchBuilder;
    db.documents.patch('/users/'+req.user+'.json', 
        p.replace('/node("savedQueries")/node("default")',  req.body)
        ).result(function(response) {
           res.status(204).json(response);
        });
};
