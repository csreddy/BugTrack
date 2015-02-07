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
            //  console.log(Object.keys(document[0].content));
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
    if (req.body.items) {
        var operations = [];
        if (req.body.operation === 'add') {
            //  you can add only one item at once, items array will always contains only one item, hence always accesses first item 
            operations = [p.insert("array-node('" + req.body.category + "')", 'last-child', req.body.items[0])]
        }
        if (req.body.operation === 'delete') {
            for (var i = 0; i < req.body.items.length; i++) {
                operations.push(p.remove(req.body.category + "[. eq '" + req.body.items[i] + "']"))
            }
        }

        db.documents.patch({
            uri: uri,
            operations: operations
        }).result(function() {
            res.status(200).json({
                message: 'config updated'
            })
        }, function(error) {
            res.status(error.statusCode).json(error)
        })
    } else {
        res.status(304).json({
            message: 'cannot update config with empty value'
        });
    }

};