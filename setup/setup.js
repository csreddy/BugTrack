var fs = require('fs');
var marklogic = require('marklogic');
var conn1 = require('../server/config/db-config.js').connection;
var conn2 = JSON.parse(JSON.stringify(conn1));
var db1 = marklogic.createDatabaseClient(conn1);
var db2 = marklogic.createDatabaseClient(conn1);
//var q = marklogic.queryBuilder;


// load config.json
fs.readFile('config.json', 'utf8', function(err, data) {
    if (err) throw err;
    conn1.database = 'bugtrack';

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

// load users
fs.readFile('users.json', 'utf8', function(err, data) {
    if (err) throw err;
    conn1.database = 'bugtrack';
    var users = JSON.parse(data);

    for (var i = 0; i < users.length; i++) {
        var uri = '/users/'+users[i].username + '.json';
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
        	console.log('\t'+response.documents[i].uri);
        }
    }, function(error) {
        console.log('oops! ', JSON.stringify(error));
    });
});



// load search options
fs.readFile('searchoptions.xml', 'utf8', function(err, data) {
    if (err) throw err;
    var searchOptions = data;
    conn2.database = 'bugtrack-modules';
    db2 = marklogic.createDatabaseClient(conn2);
    db2.documents.write([{
        uri: '/Default/bugtrack/rest-api/options/default.xml',
        category: 'content',
        contentType: 'application/xml',
        content: searchOptions
    }]).result(function() {
        console.log('loaded searchoptions into ' + conn2.database + '\n\t uri: /Default/bugtrack/rest-api/options/default.xml');
    }, function(error) {
        console.log(error);
    });
});