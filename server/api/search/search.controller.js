'use strict';

var flash = require('connect-flash');
var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'Search',
    serializers: {
        req: bunyan.stdSerializers.req
    }
});
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var _ = require('lodash');

// search endpoint
exports.search = function(req, res) {
    log.info('Called /api/search....');
    res.locals.errors = req.flash();
    var result = {};
    var pageLength = 50;
    var criteria = req.body;
    // log.info('criteria:', criteria);
    var page = parseInt(req.body.page) || 1;
    if (req.body.pageLength) {
           if (req.body.pageLength === 'All') {
            pageLength = 99999;
           } else {
            pageLength = parseInt(req.body.pageLength);
           }
    }
    
    var startIndex = (page - 1) * pageLength + 1;
    var searchCriteria = [];
    // when empty criteria is sent 
    if (Object.keys(criteria).length === 0) {
        searchCriteria = [q.collection('bugs'), q.collection('tasks'), q.collection('rfes')];
    }

    // date buckets
    var date = new Date();
    var today = stringify(date);
    var yesterday = stringify(new Date(date.setDate(date.getDate() - 1)));
    var last12MonthsDate = new Date();
    last12MonthsDate.setMonth(-11);
    var last12Months = stringify(last12MonthsDate);

    // reformat criteria json to handle facet selections
    for (var key in criteria) {
        if (key.indexOf('f:') > -1) {
            key = key.replace(/f:/, '');
            var value = criteria[key];

            // if key does not exist then create the key and assign f:key 
            // value to it
            if (!value) {
                if (typeof criteria['f:' + key] === 'string') {
                    criteria[key] = [criteria['f:' + key]];
                } else {
                    criteria[key] = criteria['f:' + key];
                }

            }
            // if key exists, then make an array from its value and
            // assign to key
            if (typeof value === 'string' && value !== '') {
                if (value === '(empty)') value = '';
                criteria[key] = [value];
            }

            // if key exists and value is an array then push its values
            // to key
            if (value instanceof Array) {
                for (var i = 0; i < criteria['f:' + key].length; i++) {
                    value.push(criteria['f:' + key][i]);
                }

            }
            // if any of the value is (empty), then convert it into empty string
            for (var i = 0; i < criteria[key].length; i++) {
                if (criteria[key][i] === '(empty)') {
                    criteria[key][i] = ''

                }
            }
            // after maninpulation on its values, delete the f:key
            delete criteria['f:' + key];
        }
    }

    // put from and to keys as object for making it east add to search criteria
    if (criteria.from || criteria.to) criteria.range = {};
    if (criteria.from) {
        criteria.range.from = criteria.from;
        delete criteria.from;
    }

    if (criteria.to) {
        criteria.range.to = criteria.to;
        delete criteria.to;
    }



    log.info('after formatting', criteria);

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
                var collectionName;
                if (typeof value === 'string' && value !== '') {
                    collectionName = value.toLowerCase() + 's'; // pluralize
                    searchCriteria.push(q.collection(collectionName));
                }

                if (value instanceof Array) {
                    // when array length > 1
                    if (value.length > 1) {
                        for (var index in value) {
                            if (value[index] !== '') {
                                collectionName = value[index].toLowerCase() + 's'; // pluralize
                                orQuery.push(q.collection(collectionName));
                            }
                        }
                        if (orQuery.length > 0) searchCriteria.push(q.or(orQuery));
                    } else {
                        // when array contains only one item
                        collectionName = value[0].toLowerCase() + 's'; // pluralize
                        searchCriteria.push(q.collection(collectionName))
                    }
                }
                orQuery = []; // empty array after pushing to search criteria
                break;
            case 'status':
            case 'severity':
            case 'category':
            case 'version':
            case 'fixedin':
            case 'tofixin':
            case 'platform':
            case 'publishStatus':
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
            case 'createdAt':
                log.info('yesterday: ', yesterday);
                orQuery = [];
                for (var i = 0; i < value.length; i++) {
                    if (value[i] === 'today') {
                        // value[i] = today + 'T23:59:59';
                        orQuery.push(q.and(
                            q.range('createdAt', q.datatype('dateTime'), '>', today + 'T00:00:00'),
                            q.range('createdAt', q.datatype('dateTime'), '<', today + 'T23:59:59')
                        ))
                    }
                    if (value[i] === 'yesterday') {
                        log.info('got into yesterday');
                        // value[i] = yesterday + 'T23:59:59';
                        orQuery.push(q.and(
                            q.range('createdAt', q.datatype('dateTime'), '>', yesterday + 'T00:00:00'),
                            q.range('createdAt', q.datatype('dateTime'), '<', yesterday + 'T23:59:59')
                        ))
                    }

                    if (value[i] === 'last 12 Months') {
                        // value[i] = yesterday + 'T23:59:59';
                        orQuery.push(q.and(
                            q.range('createdAt', q.datatype('dateTime'), '>', last12Months + 'T00:00:00'),
                            q.range('createdAt', q.datatype('dateTime'), '<', today + 'T23:59:59')
                        ))
                    }

                    if (value[i] === 'older') {
                        // value[i] = yesterday + 'T23:59:59';
                        searchCriteria.push(
                            q.range('createdAt', q.datatype('dateTime'), '<', '2014-01-01T00:00:00')
                        )
                    }

                    var year = parseInt(value[i]);
                    if (year) {
                        var start = year + '-01-01T00:00:00';
                        var end = year + '-12-31T23:59:59';
                        orQuery.push(q.and(
                            q.range('createdAt', q.datatype('dateTime'), '>', start),
                            q.range('createdAt', q.datatype('dateTime'), '<', end)
                        ))
                    }

                }

                if (orQuery.length > 0) searchCriteria.push(q.or(orQuery))
                break;
            case 'range':
                searchCriteria.push(q.and(
                    q.range('createdAt', q.datatype('dateTime'), '>', value.from + 'T00:00:00'),
                    q.range('createdAt', q.datatype('dateTime'), '<', value.to + 'T23:59:59')
                ));
                break;
            case 'groupUsers':
                log.info('groupCriteria', criteria.groupCriteria);
                parsePathIndexItems(searchCriteria, '/' + criteria.groupCriteria + '/username', 'string', '=', value)
                break;
            default: // for any other selection do nothing
                break;
        }
    }

    var facetOptions = [ //  q.facet('kind', 'kind'),
        q.facet('status', 'status', q.facetOptions('frequency-order')),
        q.facet('category', 'category'),
        q.facet('severity', 'severity'),
        q.facet('version', 'version', q.facetOptions('limit=10', 'frequency-order', 'descending')),
        q.facet('platform', 'platform', q.facetOptions('frequency-order', 'descending')),
        // q.facet('fixedin', 'fixedin', q.facetOptions('limit=10', 'frequency-order', 'descending')),
        // q.facet('tofixin', 'tofixin', q.facetOptions('limit=10', 'frequency-order', 'descending')),
        q.facet('submittedBy', q.pathIndex('/submittedBy/username')),
        q.facet('assignTo', q.pathIndex('/assignTo/username')),
        q.facet('priority', q.pathIndex('/priority/level')),
        q.facet('publishStatus', 'publishStatus', q.facetOptions('frequency-order', 'descending')),
        q.facet('createdAt', q.datatype('xs:dateTime'),
            q.bucket('today', today + 'T00:00:00', '<', today + 'T23:59:59'),
            q.bucket('yesterday', yesterday + 'T00:00:00', '<', yesterday + 'T23:59:59'),
            q.bucket('last 12 Months', last12Months + 'T00:00:00', '<', today + 'T23:59:59'),
            q.bucket('2015', '2015-01-01T00:00:00', '<', '2015-12-31T23:59:59'),
            q.bucket('2014', '2014-01-01T00:00:00', '<', '2014-12-31T23:59:59'),
            q.bucket('older', null, '<', '2014-01-01T00:00:00')
            // q.facetOptions('item-order','descending')
        )
    ]

    // get results
    db.documents.query(
        q.where(
            searchCriteria
        )
        .orderBy(
            q.sort('id', 'ascending')
        )
        .calculate(
            facetOptions
        )
        .slice(startIndex, pageLength, q.snippet())
        .withOptions({
            debug: true,
            queryPlan: true,
            metrics: true,
            category: 'metadata',
            view: 'facets'
        })
    ).result(function(result) {
        // log.info('\n------------------------------------------');
        // log.info('searchCriteria', JSON.stringify(searchCriteria));
        // log.info('/search', req.body);
        res.status(200).json(result);
    }, function(error) {
        res.status(error.statusCode).json(error);
    });
};


function parseSelectedItems(searchCriteria, name, type, condition, value) {
    var orQuery = [];
    if (typeof value === 'string') {
        if (value[0] === '-') {
            searchCriteria.push(q.not(q.value(name, value)));
        } else {
            searchCriteria.push(q.value(name, value));
        }

    }

    if (value instanceof Array) {
        if (value.length > 1) {
            for (var index in value) {
                if (value[index] !== 'n/v/f/e') {
                    if (value[index][0] !== '-') {
                        orQuery.push(
                            q.range(name, q.datatype(type), condition, value[index]));
                    }
                    if (value[index][0] === '-') {
                        searchCriteria.push(
                            q.not(
                                q.range(name, q.datatype(type), condition, value[index].substring(1, value[index].length))))
                    }
                }
            }

            if (orQuery.length > 0) searchCriteria.push(q.or(orQuery));
        } else { // when array contains only one item
            if (value[0][0] === '-') {
                searchCriteria.push(
                    q.not(
                        q.range(name, q.datatype(type), condition, value[0][0].substring(1, value[0].length)))
                )
            } else {
                searchCriteria.push(q.range(name, q.datatype(type), condition, value[0]))
            }

        }
    }
    orQuery = []; // empty array after pushing to search criteria 
}


function parsePathIndexItems(searchCriteria, path, type, condition, value) {
    var orQuery = [];
    if (typeof value === 'string') {
        if (value[0] === '-') {
            searchCriteria.push(
                q.not(
                    q.range(q.pathIndex(path), q.datatype(type), condition, value)));
        } else {
            searchCriteria.push(
                q.range(
                    q.pathIndex(path), q.datatype(type), condition, value));
        }

    }

    if (value instanceof Array) {
        if (value.length > 1) {
            for (var index in value) {
                if (value[index][0] === '-') {
                    searchCriteria.push(
                        q.not(
                            q.range(
                                q.pathIndex(path), q.datatype(type), condition, value[index].substring(1, value[index].length))));
                } else {
                    orQuery.push(
                        q.range(
                            q.pathIndex(path), q.datatype(type), condition, value[index]));
                }

            }
            if (orQuery.length > 0) searchCriteria.push(q.or(orQuery));
        } else {
            if (value[0][0] === '-') {
                searchCriteria.push(
                    q.not(
                        q.range(
                            q.pathIndex(path), q.datatype(type), condition, value[0].substring(1, value[0].length))))
            } else {
                searchCriteria.push(
                    q.range(
                        q.pathIndex(path), q.datatype(type), condition, value[0]))
            }

        }
    }
    orQuery = []; // empty array after pushing to search criteria 
}



function stringify(d) {
    var dateStr = d.getFullYear() + '-'
    var month = d.getMonth() + 1;
    dateStr = (month < 10) ? dateStr + '0' + month + '-' : dateStr + month + '-';
    dateStr = (d.getDate() < 10) ? dateStr + '0' + d.getDate() : dateStr + d.getDate();
    // log.info(dateStr)
    return dateStr;
}