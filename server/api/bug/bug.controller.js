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

// Get list of items
exports.index = function(req, res) {
    res.json([]);
};

// get bug count
exports.count = function(req, res) {
    res.locals.errors = req.flash();

    db.documents.query(
        q.where(
            q.collection('bugs')
        )
        .slice(1, maxLimit)
        .withOptions({
            debug: true,
            categories: 'metadata'
        })
    ).result(function(response) {
       // console.log(response);
        res.status(200).json({
            count: response[0].total
        });
    });
};

// get facet list from the search result
exports.facets = function(req, res) {
    res.locals.errors = req.flash();
    console.log(res.locals.errors);
    var facets = {};
    // get facets
    db.documents.query(
        q.where(
            q.collection('bugs')
        )
        .calculate(
            q.facet('Kind', 'kind'),
            q.facet('Status', 'status'),
            q.facet('Category', 'category'),
            q.facet('Severity', 'severity'),
            q.facet('Version', 'version'),
            q.facet('Platform', 'platform'),
            q.facet('Fixed_In', 'fixedin'),
            q.facet('Submitted_By', q.pathIndex('/submittedBy/name')),
            q.facet('Assigned_To', q.pathIndex('/assignTo/name')),
            q.facet('Priority', q.pathIndex('/priority/level'))
        )
        .slice(1, maxLimit)
        .withOptions({
            view: 'facets',
            debug: true
        })
    ).result(function(response) {
        // console.log(response);
        facets = response[0];
        res.status(200).json(facets);
    });
};

// get bug details by id
exports.id = function(req, res) {
    res.locals.errors = req.flash();
    console.log(res.locals.errors);
    var uri = req.params.id + '.json';
    db.documents.probe(uri).result(function(document) {
        console.log('document at ' + uri + ' exists: ' + document.exists);
        if (document.exists) {
            db.read(uri).result(function(response) {
                if (response.length === 1) {
                    res.status(200).json(response[0]);
                }
            }, function(error) {
                res.status(500).json({
                    error: 'error occured while retrieving ' + uri + '\n' + error
                })
            });

        } else {
            res.status(404).json({
                error: 'could not find bug ' + req.params.id
            });
        }
    }, function(error) {
        res.status(404).json({
            error: 'could not find bug ' + req.params.id
        });
    })


};

exports.new = function(req, res) {
     'use strict';
    console.log('inside NEW.........');
    //console.log('BODY', req.body);
    //console.log('FILES', req.files);
    var attachments = req.files;
    var errors = false;
     var id;
     var collections = ['bugs'];
    if (typeof req.body.bug === 'object') {
         id = req.body.bug.id;
         collections.push(req.body.bug.submittedBy.username);
    } else{
          id = JSON.parse(req.body.bug).id;
          collections.push(JSON.parse(req.body.bug).submittedBy.username);
    }
    var uri = id + '.json';  
    db.documents.write([{
        uri: uri,
        category: 'content',
        contentType: 'application/json',
        collections: collections,
        content: req.body.bug
    }]).result(function(response) {
        console.log('wrote:\n    ' +
            response.documents.map(function(document) {
                return document.uri;
            }).join(', ')
        );
        console.log('done\n');
        res.send(200);
    });

     for (var file in attachments) {
        console.log(attachments[file]);
        if (attachments[file].mimetype === "image/svg+xml") {
             errors = true;
            break;
        }
        var doc = {
            uri: '/'+ id +'/' + attachments[file].originalname,
            category: 'content',
            contentType: attachments[file].mimetype
        };

        var writableStream = db.documents.createWriteStream(doc);
        writableStream.result(function(response) {
            console.log('wrote:\n ' + response.documents[0].uri);
        }, function(error) {
            console.log('file upload failed');
            errors = true;
            res.send(400, {
                message: 'file upload failed. Try again'
            });
        });
        fs.createReadStream(attachments[file].path).pipe(writableStream);
    }
};


exports.update = function(req, res) {
    console.log('Inside update....');


};