'use strict';

var fs = require('fs');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;
var maxLimit = 99999999;
var uri = 'config.json'
var _ = require('lodash');

// Get list of configureable items
exports.index = function(req, res) {
    db.documents.read('config.json').result(function(document) {
        if (document[0]) {
            console.log(Object.keys(document[0].content));
            res.status(200).json(document[0].content)
        } else {
            res.status(404).json({
                message: uri + ' not found'
            })
        }
    }, function(error) {
        res.json({
            message: error
        })
    })

};

// update configure options
exports.update = function(req, res) {
   // console.log('config req.body', req.body);
    var keys = ['users', 'severity', 'status', 'version', 'kind', 'platform', 'tofixin', 'category', 'priority', 'publishStatus', 'customerImpact'];
    // check that content is not corrupted before update
    if (Object.keys(req.body).length === keys.length) {
        db.documents.write([{
            uri: uri,
            contentType: 'application/json',
            content: req.body
        }]).result(function(response) {
            res.status(200).json({
                message: 'config.json updated'
            })
        }, function(error) {
            res.status(500).json({
                message: 'config.json update failed.\n' + error
            })
        });

    } else {
        res.status(404).json({
            message: 'BAD REQUEST: Either form content was empty or submitted form was corrupt'
        });
    }

};