'use strict';

var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var maxLimit = 99999999;
var _ = require('lodash');

// search endpoint
exports.search = function(req, res) {
    console.log('Called /api/search....');
    res.locals.errors = req.flash();
    var result = {};
    var criteria = req.body;
   // console.log('criteria:', criteria);
    var page = parseInt(req.body.page) || 1;
    var pageLength = parseInt(req.body.pageLength) || 20;
    var startIndex = (page - 1) * pageLength + 1;
    var searchCriteria = [];
    // when empty criteria is sent 
    if (Object.keys(criteria).length === 0) {
        // searchCriteria = [q.collection('bugs')];
    }

      // reformat criteria json to handle facet selections
    for (var key in criteria) {
        if (key.indexOf('f:') > -1) {
            key = key.replace(/f:/, '');
            var value = criteria[key];
            
            if(!value){
                criteria[key] = criteria['f:'+key]
            }

            if (typeof value === 'string' && value !== '') {
                if (value === '(empty)') value = '';
                value = [value];
               value.reduce(function(a, b) {
                    return a.concat(b);
                });
            }

            if (value instanceof Array) {
                for(var i=0; i< criteria['f:' + key].length; i++){
                    value.push(criteria['f:'+key][i]);
                }
                               
            }
              for(var i=0; i< criteria[key].length; i++){
                    if (criteria[key][i] === '(empty)'){                          criteria[key][i] = ''
                    
                    }
             }
        delete criteria['f:' + key];
        }

    }


    console.log('after formatting', criteria);

    for (var key in criteria) {
        var orQuery = [];
        var value = criteria[key];
        if (value === '(empty)') {
            value = '';
        }
        switch (key) {
            case 'q':
            // if null then make it empty string to avoid error
            if (!value) {
                value = '';
            }
                searchCriteria.push(q.parsedFrom(value));
                break;
            case 'kind':
            case 'f:kind':
                var collectionName;
                if (typeof value === 'string' && value !== '') {
                    collectionName = value.toLowerCase() + 's'; // pluralize
                    searchCriteria.push(q.collection(collectionName));
                }

                if (value instanceof Array) {
                    for (var index in value) {
                        if (value[index] !== '') {
                            collectionName = value[index].toLowerCase() + 's'; // pluralize
                            orQuery.push(q.collection(collectionName));
                        }
                    }
                    if (orQuery.length > 0) {
                        searchCriteria.push(q.or(orQuery));
                    }
                    orQuery = []; // empty array after pushing to search criteria
                }

                break;
            case 'status':
            case 'severity':
            case 'category':
            case 'version':
            case 'fixedin':
            case 'tofixin':
            case 'platform':
                parseSelectedItems(searchCriteria, key, 'string', '=', value);
                break;
            case 'priority':
                parsePathIndexItems(searchCriteria, '/priority/level', 'string', '=', value)
                break;
            case 'assignTo':
                parsePathIndexItems(searchCriteria, '/assignTo/username', 'string', '=', value)
                break;
            case 'submittedBy':
                parsePathIndexItems(searchCriteria, '/submittedBy/username', 'string', '=', value)
                break;
            default: // for any other selection do nothing
                break;
        }
    }



    // get results
    db.documents.query(
        q.where(
            searchCriteria
        )
        .orderBy(
            q.sort('id', 'ascending')
        )
        .calculate(
            //  q.facet('kind', 'kind'),
            q.facet('status', 'status', q.facetOptions('frequency-order')),
            q.facet('category', 'category'),
            q.facet('severity', 'severity'),
            q.facet('version', 'version', q.facetOptions('limit=10', 'frequency-order', 'descending')),
            q.facet('platform', 'platform', q.facetOptions('frequency-order', 'descending')),
            // q.facet('fixedin', 'fixedin', q.facetOptions('limit=10', 'frequency-order', 'descending')),
            // q.facet('tofixin', 'tofixin', q.facetOptions('limit=10', 'frequency-order', 'descending')),
            q.facet('submittedBy', q.pathIndex('/submittedBy/name')),
            q.facet('assignTo', q.pathIndex('/assignTo/username')),
            q.facet('priority', q.pathIndex('/priority/level'))
        )
        .slice(startIndex, pageLength)
        .withOptions({
            debug: true,
            queryPlan: true,
            metrics: true,
            category: 'contents',
            view: 'facets'
        })
    ).result(function(response) {
       // console.log('\n------------------------------------------');
       // console.log('searchCriteria', JSON.stringify(searchCriteria));
        // console.log('/search', req.body);
        result = response;
        res.status(200).json(result);
    }, function(error) {
        res.status(error.statusCode).json(error);
    });
};


function parseSelectedItems(searchCriteria, name, type, condition, value) {
    var orQuery = [];
    if (typeof value === 'string') {
        searchCriteria.push(q.value(name, value));
    }

    if (value instanceof Array) {
        for (var index in value) {
            if (value[index] !== 'n/v/f/e') {
                orQuery.push(q.range(name, q.datatype(type), condition, value[index]));
            }
        }
        if (orQuery.length > 0) {
            searchCriteria.push(q.or(orQuery));
        }
        orQuery = []; // empty array after pushing to search criteria 
    }
}


function parsePathIndexItems(searchCriteria, path, type, condition, value) {
    var orQuery = [];
    if (typeof value === 'string') {
        searchCriteria.push(q.range(q.pathIndex(path), q.datatype(type), condition, value));
    }

    if (value instanceof Array) {
        for (var index in value) {
                orQuery.push(q.range(q.pathIndex(path), q.datatype(type), condition, value[index]));
        }
        if (orQuery.length > 0) {
            searchCriteria.push(q.or(orQuery));
        }
        orQuery = []; // empty array after pushing to search criteria 
    }
}