'use strict';

var fs = require('fs');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;
var maxLimit = 99999999;
var _ = require('lodash');

// Get list of users
exports.index = function(req, res) {
    res.json([{
        message: 'list of users'
    }]);
};

exports.username = function(req, res) {
    res.locals.errors = req.flash();
    console.log(res.locals);
    res.send({
        username: req.user
    });
};


exports.saveDefaultQuery = function(req, res) {
    res.locals.errors = req.flash();
    var uri = '/users/' + req.user + '.json';
    db.documents.patch(uri,
        p.replace('/node("savedQueries")/node("default")', req.body)
    ).result(function(response) {
        res.status(204).json(response);
    });
};


exports.create = function(req, res) {
    res.locals.errors = req.flash();
    var uri = '/users/' + req.body.username + '.json'
    db.documents.write({
        uri: uri,
        contentType: 'application/json',
        content: req.body,
        collections: ['users']
    }).result(function(response) {
    	res.status(200).json({message: 'User ' + req.body.username + ' created'})
    }, function(error) {
    	res.status(500).json({message: 'User '+ req.body.username + ' could not be created\n'+ error})
    });
};