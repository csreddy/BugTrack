'use strict';

var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var _ = require('lodash');

// Get list of commons
exports.index = function(req, res) {
    res.json([]);
};

// get the id for next bug/task/rfe
exports.getNextId = function(req, res) {
    db.documents.query(
            q.where(
                q.or(
                    q.collection('bugs'),
                    q.collection('tasks'),
                    q.collection('rfes')
                )
            )
            .orderBy(
                q.sort('id', 'descending')
            )
            .slice(1, 1)
            .withOptions({
                categories: 'metadata',
                debug: true
            })
        )
        .result(function(response) {
            res.status(200).json({
                nextId:
                    parseInt(
                    	response[0].results[0].uri.toString()
                    	.replace(/\/\w*\/\d*\//, '')
                    	.replace(/.json/, '')) 
                    	+ 1
            });
        }, function(error) {
            console.log(error);
            res.status(error.statusCode).json(error);
        })
};
