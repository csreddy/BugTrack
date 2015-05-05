'use strict';

var fs = require('fs');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'User',
    serializers: {
        req: bunyan.stdSerializers.req
    }
});
var _ = require('lodash');

// Get list of users
exports.index = function(req, res) {
    res.json([{
        message: 'list of users'
    }]);
};

exports.username = function(req, res) {
    res.locals.errors = req.flash();
    log.info(res.locals);
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

exports.saveQuery = function(req, res) {
    var uri = '/users/' + req.user + '.json';
    console.log('saveQuery', req.body);
    
    var update = [];
    var queryObj = new Object();
    if (req.body.name === 'default') {
        queryObj['default'] = {
            description: 'This is the default query',
            query: req.body.query
        }
        queryObj['default'].query.page = 1 // always set to 1 
        update.push(p.replace('/node("savedQueries")/node("default")', queryObj.default))
    } else{
        queryObj[req.body.name] = {
                description: req.body.description,
                query: req.body.query
            }
        queryObj[req.body.name].query.page = 1 // always set to 1 
         update.push(p.insert('/node("savedQueries")', 'last-child', queryObj));   
    }

    db.documents.patch(uri,update).result(function(response) {
        res.status(204).json(response);
    }, function(error) {
        res.status(error.statusCode).json(error);
    });
};


exports.deleteQuery = function(req, res) {
     var uri = '/users/' + req.user + '.json';
      db.documents.patch(uri, p.remove('/node("savedQueries")/node("'+req.body.name+'")')).result(function(response) {
        res.status(204).json(response);
    }, function(error) {
        res.status(error.statusCode).json(error);
    });
};

exports.create = function(req, res) {
    res.locals.errors = req.flash();
    var uri = '/users/' + req.body.username + '.json'
    var user = {
        username: req.body.username,
        email: req.body.email,
        name: req.body.name
    };
    var transactionId = null;
    db.transactions.open().result().then(function(response) {
        transactionId = response.txid
    }).then(function() {
        return db.documents.write({
            uri: uri,
            contentType: 'application/json',
            content: req.body,
            collections: ['users'],
            txid: transactionId
        }).result();
    }).then(function() {
        return db.documents.patch({
            uri: 'config.json',
            operations: [p.insert("array-node('users')", 'last-child', user)],
            txid: transactionId
        }).result()
    }).then(function() {
        return db.transactions.commit(transactionId).result(function() {
            res.status(202).json({
                message: 'Created user'
            });
        }, function(error) {
            res.status(error.statusCode).json(error.body.errorResponse)
        });
    }).catch(function(error) {
        db.transactions.rollback(transactionId);
        log.info(JSON.stringify(error));
        res.send(error.statusCode).json(error);
    });
};
