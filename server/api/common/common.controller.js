'use strict';

var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;
var request = require('request');
var async = require('async');
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
            categories: 'none',
            debug: true
        })
    )
        .result(function(response) {
            if (response[0].results.length > 0) {
                res.status(200).json({
                    nextId: parseInt(
                        response[0].results[0].uri.toString()
                        .replace(/\/\w*\/\d*\//, '')
                        .replace(/.json/, '')) + 1
                });
            } else {
                // when db is empty
                res.status(200).json({
                    nextId: 1
                });
            }

        }, function(error) {
            console.log(error);
            res.status(error.statusCode).json(error);
        })
};


exports.goto = function(req, res) {
    if (!req.query.id) {
        return res.status(500).json({error: 'Id is null'})
    }
    db.documents.query(
        q.where(
            q.parsedFrom('id:' + req.query.id,
                q.parseBindings(
                    q.value('id', q.jsontype('number'), q.bind('id'))
                ))
        )).result(function(result) {
            if (result.length === 0) {
                return res.status(404).json({error: req.query.id + ' not found'})
            } else {
                return res.status(200).json({uri: result[0].uri.replace(/\/\d*.json/, '')})
            }
    }, function(error) {
        return res.send(error);
    })
}


// NEED TO FIX THIS FUNCTION
exports.document = function(req, res) {
    db.documents.read(req.query.uri).result(function(documents) {
        res.set('Content-type', documents[0].contentType)
        if (documents[0].contentType === 'application/pdf') {
            // res.setHeader('Content-disposition', 'inline; filename="' + 'sample.pdf' + '"');
            // console.log(JSON.stringify(documents));
            res.send(documents)
        } else {
            res.status(200).send(documents[0].content)
        }

    }, function(error) {
        res.status(error.statusCode).send('Document does not exist at ' + req.query.uri)
    })
};