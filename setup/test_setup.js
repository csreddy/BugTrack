'use strict';

var fs = require('fs');
var path = require("path");
var marklogic = require('marklogic');
var conn1 = require('../server/config/db-config.js').connection;
var conn2 = JSON.parse(JSON.stringify(conn1));
var db1 = marklogic.createDatabaseClient(conn1);
var db2 = marklogic.createDatabaseClient(conn2);


// load config.json
exports.loadConfig = function() {
    fs.readFile(path.resolve(__dirname,'config.json'), 'utf8', function(err, data) {
        if (err) throw err;

        db1.documents.write([{
            uri: 'config.json',
            contentType: 'application/json',
            content: data
        }]).result(function() {
            console.log('loaded config.json into ' + conn1.database + ' database\n\t uri: config.json');
        }, function(error) {
            console.log(error);
        });
    });
};


// load users
exports.loadUsers = function() {
    fs.readFile(path.resolve(__dirname,'users.json'), 'utf8', function(err, data) {
        if (err) throw err;
        var users = JSON.parse(data);

        for (var i = 0; i < users.length; i++) {
            var uri = '/users/' + users[i].username + '.json';
            users[i] = {
                uri: uri,
                contentType: 'application/json',
                content: users[i],
                collections: ['users']
            };
        }

        db1.documents.write(users).result(function(response) {
            console.log('users loaded at');
            for (var i = 0; i < response.documents.length; i++) {
                console.log('\t' + response.documents[i].uri);
            }
        }, function(error) {
            console.log('oops! ', JSON.stringify(error));
        });
    });

};


// load search options
exports.loadSearchOptions = function() {
    fs.readFile(path.resolve(__dirname,'searchoptions.xml'), 'utf8', function(err, data) {
        if (err) throw err;
        var searchOptions = data;
        conn2.database = conn2.modules;
        db2 = marklogic.createDatabaseClient(conn2);
        var optionsURI = '/Default/' + conn2.database.replace(/-modules/, '') + '/rest-api/options/default.xml';
        db2.documents.write([{
            uri: optionsURI,
            category: 'content',
            contentType: 'application/xml',
            content: searchOptions
        }]).result(function() {
            console.log('loaded searchoptions into ' + conn2.database + '\n\t uri:' + optionsURI);
        }, function(error) {
            console.log(error);
        });
    });
};