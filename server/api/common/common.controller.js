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
                categories: 'none',
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


function sortUris(docuris){
    var ids = []
    var sortedUris = []
    for(var i in docuris){
        var _uri = docuris[i].toString()
        var _id = docuris[i].toString()
            .replace(/\/\w*\/\d*\//, '')
            .replace(/.json/, '')
        if(!isNaN(_id)){
            ids.push({id: parseInt(_id), uri: docuris[i]})
        }
    }
    ids.sort(function(a, b){return a.id-b.id});
    for(var id in ids){
        sortedUris.push(ids[id].uri)
    }
    return sortedUris
}