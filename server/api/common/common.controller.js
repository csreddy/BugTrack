'use strict';

var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
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
            res.status(200).json({
                nextId: parseInt(
                    response[0].results[0].uri.toString()
                    .replace(/\/\w*\/\d*\//, '')
                    .replace(/.json/, '')) + 1
            });
        }, function(error) {
            console.log(error);
            res.status(error.statusCode).json(error);
        })
};


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

exports.listTransformedGitHubBugs = function(req, res) {
    var _project = req.query.project || null;
    var _sort = req.query.sort || 'created';
    var _order = req.query.order || 'asc';
    var _page = req.query.page || 1;
    var _per_page = req.query.per_page || 25;
    var finalResult = []
        // url: 'https://api.github.com/repos/marklogic/' + req.query.project + '/issues?page=' + _page + '&per_page=' + _per_page,
    var options = {
        url: 'https://api.github.com/search/issues?q=repo:marklogic/' + _project + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page,
        headers: {
            'User-Agent': req.query.project
        },
        auth: githubAuth
    };

    request(options, function(error, response, body) {
            if (error) {
                console.log(error);
                return res.send(error);
            }

            if (!error && response.statusCode === 200) {
                var issues = JSON.parse(response.body)

                async.waterfall([
                            // get events and comments for all bugs and return the final processes list of bugs
                            function getEventsAndCommentsForAllBugs(callback) {
                                issues.forEach(function getEventsAndComments(issue, index) {
                                        // for each bug, get comments and events
                                        async.parallel([

                                                function getEvents(parallelCallback) {
                                                    var options = {
                                                        url: issue.events_url,
                                                        headers: {
                                                            'User-Agent': getProjectNameFromURL(issue.events_url)
                                                        },
                                                        auth: githubAuth
                                                    };
                                                    request(options, function(error, response, body) {
                                                        if (error) {
                                                            console.log('ERROR', error);
                                                            parallelCallback(error)
                                                        }
                                                        if (response.statusCode === 200) {
                                                            // console.log('events:', body);
                                                            parallelCallback(null, body)

                                                        }


                                                    })
                                                },
                                                function getComments(parallelCallback) {
                                                    var options = {
                                                        url: issue.comments_url,
                                                        headers: {
                                                            'User-Agent': getProjectNameFromURL(issue.comments_url)
                                                        },
                                                        auth: githubAuth
                                                    };
                                                    request(options, function(error, response, body) {
                                                        if (error) {
                                                            console.log('ERROR', error);
                                                            parallelCallback(error)
                                                        }
                                                        if (response.statusCode === 200) {
                                                            //  console.log('comments:', body);
                                                            parallelCallback(null, body)
                                                        }


                                                    })
                                                }
                                            ], function attachEventsAndComments(err, result) {
                                                if (err) {
                                                    console.log('ERROR:', err);
                                                    callback(err);
                                                }
                                                console.log('parallel process done');
                                                var bugtrackItem = _.cloneDeep(issue);
                                                issue.eventList = JSON.parse(result[0]);
                                                issue.commentList = JSON.parse(result[1]);

                                                bugtrackItem.changeHistory = processEventList(issue.eventList);
                                                var commentList = processCommentList(issue.commentList);
                                                commentList.forEach(function(comment) {
                                                    bugtrackItem.changeHistory.push(comment);
                                                })

                                                bugtrackItem.changeHistory = sortChangeHistory(bugtrackItem.changeHistory);

                                                var newBug = convertToBugtrackItem(bugtrackItem)
                                                finalResult.push(newBug);

                                                console.log('finalResult length = ', finalResult.length);
                                                if (finalResult.length === issues.length) {
                                                    callback(null, finalResult)
                                                }
                                            }) // parallel end
                                    }) // forEach end
                            }
                        ],
                        function processedBugs(err, result) {
                            if (err) {
                                res.send(err);
                            }
                            console.log('waterfall done');
                            console.log('LENGTH = ', result.length);
                            res.send(result);
                        }) // waterfall end

            } // if end
        }) // request end

}

exports.listGitHubBugs = function(req, res) {
    var _project = req.query.project || null;
    var _sort = req.query.sort || 'created';
    var _order = req.query.order || 'asc';
    var _page = req.query.page || 1;
    var _per_page = req.query.per_page || 25;

    var finalResult = []
        //console.log('url:', 'https://api.github.com/repos/marklogic/' + req.query.project + '/issues?page=' + _page + '&per_page=' + _per_page);
        // https://api.github.com/search/issues?q=repo:marklogic/java-client-api&sort=created&order=asc&page=1&per_page=10
    console.log('https://api.github.com/search/issues?q=repo:marklogic/' + _project + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page);
    var options = {
        url: 'https://api.github.com/search/issues?q=repo:marklogic/' + _project + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page,
        headers: {
            'User-Agent': req.query.project
        },
        auth: githubAuth
    };

    request(options, function(error, response, body) {
            if (error) {
                console.log(error);
                return res.send(error);
            }

            if (!error && response.statusCode === 200) {
                var issues = JSON.parse(body).items


                async.waterfall([
                            // get events and comments for all bugs and return the final processes list of bugs
                            function getEventsAndCommentsForAllBugs(callback) {
                                issues.forEach(function getEventsAndComments(issue, index) {
                                        // for each bug, get comments and events
                                        async.parallel([

                                                function getEvents(parallelCallback) {
                                                    var options = {
                                                        url: issue.events_url,
                                                        headers: {
                                                            'User-Agent': getProjectNameFromURL(issue.events_url)
                                                        },
                                                        auth: githubAuth
                                                    };
                                                    request(options, function(error, response, body) {
                                                        if (error) {
                                                            console.log('ERROR', error);
                                                            parallelCallback(error)
                                                        }
                                                        if (response.statusCode === 200) {
                                                            // console.log('events:', body);
                                                            parallelCallback(null, body)

                                                        }
                                                    })
                                                },
                                                function getComments(parallelCallback) {
                                                    var options = {
                                                        url: issue.comments_url,
                                                        headers: {
                                                            'User-Agent': getProjectNameFromURL(issue.comments_url)
                                                        },
                                                        auth: githubAuth
                                                    };
                                                    request(options, function(error, response, body) {
                                                        if (error) {
                                                            console.log('ERROR', error);
                                                            parallelCallback(error)
                                                        }
                                                        if (response.statusCode === 200) {
                                                            //  console.log('comments:', body);
                                                            parallelCallback(null, body)
                                                        }
                                                    })
                                                }
                                            ], function attachEventsAndComments(err, result) {
                                                if (err) {
                                                    console.log('ERROR:', err);
                                                    callback(err);
                                                }
                                                console.log('parallel process done');
                                                issue.eventList = JSON.parse(result[0]);
                                                issue.commentList = JSON.parse(result[1]);

                                                finalResult.push(issue);

                                                console.log('finalResult length = ', finalResult.length);
                                                if (finalResult.length === issues.length) {
                                                    callback(null, finalResult)
                                                }
                                            }) // parallel end
                                    }) // forEach end
                            }
                        ],
                        function guthubBugs(err, result) {
                            if (err) {
                                res.send(err);
                            }
                            console.log('waterfall done');
                            console.log('LENGTH = ', result.length);
                            // result = _.sortBy(result, 'number')
                            res.send(result);
                        }) // waterfall end

            } // if end
        }) // request end

}


exports.transformAndLoadGitHubBugs = function(req, res) {
    var _project = req.query.project || null;
    var _sort = req.query.sort || 'created';
    var _order = req.query.order || 'asc';
    var _page = req.query.page || 1;
    var _per_page = req.query.per_page || 25;
    var finalResult = []
        //console.log('url:', 'https://api.github.com/repos/marklogic/' + req.query.project + '/issues?page=' + _page + '&per_page=' + _per_page);
    var options = {
        url: 'https://api.github.com/search/issues?q=repo:marklogic/' + _project + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page,
        headers: {
            'User-Agent': req.query.project
        },
        auth: githubAuth
    };

    request(options, function(error, response, body) {
            if (error) {
                console.log(error);
                return res.send(error);
            }

            if (!error && response.statusCode === 200) {
                var issues = JSON.parse(response.body)

                async.waterfall([
                            // get events and comments for all bugs and return the final processes list of bugs
                            function getEventsAndCommentsForAllBugs(callback) {
                                issues.forEach(function getEventsAndComments(issue, index) {
                                        // for each bug, get comments and events
                                        async.parallel([

                                                function getEvents(parallelCallback) {
                                                    var options = {
                                                        url: issue.events_url,
                                                        headers: {
                                                            'User-Agent': getProjectNameFromURL(issue.events_url)
                                                        },
                                                        auth: githubAuth
                                                    };
                                                    request(options, function(error, response, body) {
                                                        if (error) {
                                                            console.log('ERROR', error);
                                                            parallelCallback(error)
                                                        }
                                                        if (response.statusCode === 200) {
                                                            // console.log('events:', body);
                                                            parallelCallback(null, body)

                                                        }


                                                    })
                                                },
                                                function getComments(parallelCallback) {
                                                    var options = {
                                                        url: issue.comments_url,
                                                        headers: {
                                                            'User-Agent': getProjectNameFromURL(issue.comments_url)
                                                        },
                                                        auth: githubAuth
                                                    };
                                                    request(options, function(error, response, body) {
                                                        if (error) {
                                                            console.log('ERROR', error);
                                                            parallelCallback(error)
                                                        }
                                                        if (response.statusCode === 200) {
                                                            //  console.log('comments:', body);
                                                            parallelCallback(null, body)
                                                        }


                                                    })
                                                }
                                            ], function attachEventsAndComments(err, result) {
                                                if (err) {
                                                    console.log('ERROR:', err);
                                                    callback(err);
                                                }
                                                console.log('parallel process done');
                                                var bugtrackItem = _.cloneDeep(issue);
                                                issue.eventList = JSON.parse(result[0]);
                                                issue.commentList = JSON.parse(result[1]);

                                                bugtrackItem.changeHistory = processEventList(issue.eventList);
                                                var commentList = processCommentList(issue.commentList);
                                                commentList.forEach(function(comment) {
                                                    bugtrackItem.changeHistory.push(comment);
                                                })

                                                bugtrackItem.changeHistory = sortChangeHistory(bugtrackItem.changeHistory);

                                                var newBug = convertToBugtrackItem(bugtrackItem)
                                                finalResult.push(newBug);

                                                console.log('finalResult length = ', finalResult.length);
                                                if (finalResult.length === issues.length) {
                                                    callback(null, finalResult)
                                                }
                                            }) // parallel end
                                    }) // forEach end
                            }
                        ],
                        function processedBugs(err, result) {
                            if (err) {
                                res.send(err);
                            }
                            console.log('waterfall done');
                            console.log('LENGTH = ', result.length);
                            request.get(req.protocol + '://' + req._remoteAddress + ':' + req.headers.host.replace(/(\S*:)(\d*)/, '$2') + '/api/common/nextId', function(err, response, body) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log('NEXT ID:', body);
                                var nextId = JSON.parse(body).nextId;
                                // result = _.sortBy(result, 'number')
                                result.forEach(function(bug, index) {
                                    // set bug id
                                    bug.id = nextId + index;
                                    result[index] = bug;
                                })

                                var cargo = async.cargo(function(bugs, callback) {
                                    for (var i = 0; i < bugs.length; i++) {
                                        switch (bugs[i].kind) {
                                            case 'Bug':
                                                createBug(bugs[i], req);
                                                break;
                                            case 'Task':
                                                createTask(bugs[i], req);
                                                break;
                                            case 'RFE':
                                                createRFE(bugs[i], req);
                                                break;
                                            default:
                                                console.log('Bug kind is empty ', bugs[i].id);
                                                break;
                                        }
                                    }
                                    callback();
                                }, 10)

                                result.forEach(function(bug) {
                                    cargo.push(bug, function(err) {
                                        if (err) console.log('error while loading to cargo', err);
                                        console.log('loaded bug to cargo');
                                    });
                                });
                                res.send(result);
                            })

                            //res.send(result);
                        }) // waterfall end

            } // if end
        }) // request end

}


exports.getGitHubIssue = function(req, res) {
    var _project = req.query.project || null
    var _issueId = req.query.id || null
    var _url = 'https://api.github.com/repos/marklogic/' + _project + '/issues/' + _issueId;
    var options = {
        url: _url,
        headers: {
            'User-Agent': _project
        },
        auth: githubAuth
    };
    async.waterfall([

        function getIssue(waterfallCallback) {
            request(options, function(err, response, body) {
                if (err) {
                    console.log(err);
                    waterfallCallback(err)
                }
                waterfallCallback(null, JSON.parse(body));
            });
        },
        function getEventsAndComments(issue, waterfallCallback) {
            async.parallel({
                eventList: function(parallelCallback) {
                    var options = {
                        url: issue.events_url,
                        headers: {
                            'User-Agent': _project
                        },
                        auth: githubAuth
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            console.log('ERROR', error);
                            parallelCallback(error)
                        }
                        if (response.statusCode === 200) {
                            // console.log('events:', body);
                            parallelCallback(null, body)

                        }
                    })
                },
                commentList: function(parallelCallback) {
                    var options = {
                        url: issue.comments_url,
                        headers: {
                            'User-Agent': _project
                        },
                        auth: githubAuth
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            console.log('ERROR', error);
                            parallelCallback(error)
                        }
                        if (response.statusCode === 200) {
                            //  console.log('comments:', body);
                            parallelCallback(null, body)
                        }
                    })
                }
            }, function attachEventsAndComments(err, result) {
                if (err) {
                    console.log(err);
                    waterfallCallback(err)
                }
                issue.eventList = JSON.parse(result.eventList);
                issue.commentList = JSON.parse(result.commentList);
                waterfallCallback(null, issue)

            })
        }

    ], function returnIssue(err, result) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        res.send(result)
    })
};

exports.transformGitHubIssue = function(req, res) {
    var _project = req.query.project || null
    var _issueId = req.query.id || null
    var _url = 'https://api.github.com/repos/marklogic/' + _project + '/issues/' + _issueId;
    var options = {
        url: _url,
        headers: {
            'User-Agent': _project
        },
        auth: githubAuth
    };
    async.waterfall([

        function getIssue(waterfallCallback) {
            request(options, function(err, response, body) {
                if (err) {
                    console.log(err);
                    waterfallCallback(err)
                }
                waterfallCallback(null, JSON.parse(body));
            });
        },
        function getEventsAndComments(issue, waterfallCallback) {
            async.parallel({
                eventList: function(parallelCallback) {
                    var options = {
                        url: issue.events_url,
                        headers: {
                            'User-Agent': _project
                        },
                        auth: githubAuth
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            console.log('ERROR', error);
                            parallelCallback(error)
                        }
                        if (response.statusCode === 200) {
                            // console.log('events:', body);
                            parallelCallback(null, body)

                        }
                    })
                },
                commentList: function(parallelCallback) {
                    var options = {
                        url: issue.comments_url,
                        headers: {
                            'User-Agent': _project
                        },
                        auth: githubAuth
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            console.log('ERROR', error);
                            parallelCallback(error)
                        }
                        if (response.statusCode === 200) {
                            //  console.log('comments:', body);
                            parallelCallback(null, body)
                        }
                    })
                }
            }, function attachEventsAndComments(err, result) {
                if (err) {
                    console.log(err);
                    waterfallCallback(err)
                }
                issue.eventList = JSON.parse(result.eventList);
                issue.commentList = JSON.parse(result.commentList);
                waterfallCallback(null, issue)

            })
        }

    ], function transform(err, result) {
        if (err) {
            console.log(err);
            res.send(err);
        }
        result.changeHistory = _.sortBy(_.flatten([processEventList(result.eventList), processCommentList(result.commentList)]), 'time');
        delete result.eventList;
        delete result.commentList;

        res.send(convertToBugtrackItem(result));
    })

};


exports.transformAndLoadGitHubIssue = function(req, res) {
    var _project = req.query.project || null
    var _issueId = req.query.id || null
    var _url = 'https://api.github.com/repos/marklogic/' + _project + '/issues/' + _issueId;
    var options = {
        url: _url,
        headers: {
            'User-Agent': _project
        },
        auth: githubAuth
    };
    async.waterfall([

        function getIssue(waterfallCallback) {
            request(options, function(err, response, body) {
                if (err) {
                    console.log(err);
                    waterfallCallback(err)
                }
                waterfallCallback(null, JSON.parse(body));
            });
        },
        function getEventsAndComments(issue, waterfallCallback) {
            async.parallel({
                eventList: function(parallelCallback) {
                    var options = {
                        url: issue.events_url,
                        headers: {
                            'User-Agent': _project
                        },
                        auth: githubAuth
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            console.log('ERROR', error);
                            parallelCallback(error)
                        }
                        if (response.statusCode === 200) {
                            // console.log('events:', body);
                            parallelCallback(null, body)

                        }
                    })
                },
                commentList: function(parallelCallback) {
                    var options = {
                        url: issue.comments_url,
                        headers: {
                            'User-Agent': _project
                        },
                        auth: githubAuth
                    };
                    request(options, function(error, response, body) {
                        if (error) {
                            console.log('ERROR', error);
                            parallelCallback(error)
                        }
                        if (response.statusCode === 200) {
                            //  console.log('comments:', body);
                            parallelCallback(null, body)
                        }
                    })
                }
            }, function attachEventsAndComments(err, result) {
                if (err) {
                    console.log(err);
                    waterfallCallback(err)
                }
                issue.eventList = JSON.parse(result.eventList);
                issue.commentList = JSON.parse(result.commentList);
                waterfallCallback(null, issue)

            })
        },
        function transform(issue, waterfallCallback) {
            issue.changeHistory = _.sortBy(_.flatten([processEventList(issue.eventList), processCommentList(issue.commentList)]), 'time');
            delete issue.eventList;
            delete issue.commentList;
            waterfallCallback(null, convertToBugtrackItem(issue))
        },
        function getId(transformedItem, waterfallCallback) {
            request.get(req.protocol + '://' + req._remoteAddress + ':' + req.headers.host.replace(/(\S*:)(\d*)/, '$2') + '/api/common/nextId', function(err, response, body) {
                if (err) {
                    waterfallCallback(err);
                }
                transformedItem.id = JSON.parse(body).nextId
                waterfallCallback(null, transformedItem);
            })
        }

    ], function insert(err, item) {
        var baseUri = req.protocol + '://' + req._remoteAddress + ':' + req.headers.host.replace(/(\S*:)(\d*)/, '$2')
        var key = null;
        var options = {};
        options.method = 'POST';
        switch (item.kind) {
            case 'Bug':
                options.uri = baseUri + '/api/bugs/new';
                options.json = {
                    bug: item
                };
                break;
            case 'Task':
                options.uri = baseUri + '/api/tasks/new';
                options.json = {
                    task: item
                };
                break;
            case 'RFE':
                options.uri = baseUri + '/api/rfes/new';
                options.json = {
                    rfe: item
                };
                break;
            default:
                console.log('kind is unknown');
                res.status(500).json({
                    error: item.id + ' kind is unknown'
                })
        }

        request(options, function(err, response, body) {
            if (err) {
                console.error('could not create item-' + item.id, err);
                res.status(500).json({
                    error: 'could not create item-' + item.id,
                    reason: err
                })

            }
            console.log(item.kind + '-' + item.id + ' created successfully');
            res.send({
                msg: item.kind + '-' + item.id + ' created successfully'
            })
        })
    })
};


function createBug(bug, req) {
    request({
        method: 'POST',
        uri: req.protocol + '://' + req._remoteAddress + ':' + req.headers.host.replace(/(\S*:)(\d*)/, '$2') + '/api/bugs/new',
        json: {
            'bug': bug
        }
    }, function(err, response, body) {
        if (err) {
            console.error('could not create bug-' + bug.id, err);

        }
        console.log('bug created successfully');

    })
}

function createTask(task, req) {
    request({
        method: 'POST',
        uri: req.protocol + '://' + req._remoteAddress + ':' + req.headers.host.replace(/(\S*:)(\d*)/, '$2') + '/api/tasks/new',
        json: {
            'task': task
        }
    }, function(err, response, body) {
        if (err) {
            console.error('could not create task-' + task.id, err);

        }
        console.log('task created successfully');

    })
}

function createRFE(rfe, req) {
    request({
        method: 'POST',
        uri: req.protocol + '://' + req._remoteAddress + ':' + req.headers.host.replace(/(\S*:)(\d*)/, '$2') + '/api/rfes/new',
        json: {
            'rfe': rfe
        }
    }, function(err, response, body) {
        if (err) {
            console.error('could not create rfe-' + rfe.id, err);

        }
        console.log('rfe created successfully');

    })
}


function getProjectNameFromURL(url) {
    return url.replace(/(https:\/\/api\.github\.com\/repos\/marklogic\/)(\S*)\/issues\/\S*/, '$2');
}




function processEventList(eventList) {
    var changeHistory = [];
    var change = {};
    eventList.forEach(function(eventItem) {
        switch (eventItem.event) {
            case 'labeled':
            case 'unlabeled':
                var changeName = null;
                if (githubLabels.kind.indexOf(eventItem.label.name) > -1) {
                    changeName = 'kind';
                }
                if (githubLabels.status.indexOf(eventItem.label.name) > -1) {
                    changeName = 'status';
                }
                if (githubLabels.severity.indexOf(eventItem.label.name) > -1) {
                    changeName = 'severity';
                }

                // enahncements are added as rfes
                if (eventItem.label.name === 'Enhancement') {
                    eventItem.label.name = 'RFE';
                }

                change = {
                    time: eventItem.created_at,
                    updatedBy: {
                        username: eventItem.actor.login,
                        name: eventItem.actor.login
                    }
                }
                change['change'] = {};
                change.change[changeName] = {
                    from: null,
                    to: eventItem.label.name
                }
                changeHistory.push(change);
                change = {}
                break;
            case 'assigned':
                change = {
                    time: eventItem.created_at,
                    updatedBy: {
                        username: eventItem.actor.login,
                        name: eventItem.actor.login
                    },
                    change: {
                        assignTo: {
                            from: null,
                            to: {
                                username: eventItem.assignee.login,
                                name: eventItem.assignee.login
                            }
                        }
                    }
                }
                changeHistory.push(change);
                change = {}
                break;
            case 'unassigned':
                change = {
                    time: eventItem.created_at,
                    updatedBy: {
                        username: eventItem.actor.login,
                        name: eventItem.actor.login
                    },
                    change: {
                        assignTo: {
                            from: {
                                username: eventItem.assignee.actor,
                                name: eventItem.assignee.actor,
                            },
                            to: {
                                "username": "nobody",
                                "email": "nobody@marklogic.com",
                                "name": "nobody nobody"
                            }
                        }
                    }

                }
                changeHistory.push(change);
                change = {}
                break;
            case 'milestoned':
                change = {
                    time: eventItem.created_at,
                    updatedBy: {
                        username: eventItem.actor.login,
                        name: eventItem.actor.login
                    },
                    change: {
                        tofixin: {
                            from: null,
                            to: eventItem.milestone.title
                        }
                    }

                }
                changeHistory.push(change);
                change = {}
                break;
            case 'referenced':
                change = {
                    time: eventItem.created_at,
                    updatedBy: {
                        username: eventItem.actor.login,
                        name: eventItem.actor.login
                    },
                    svn: {
                        revision: eventItem.commit_id
                    }
                }
                changeHistory.push(change);
                change = {}
                break;
            case 'renamed':
                change = {
                    time: eventItem.created_at,
                    updatedBy: {
                        username: eventItem.actor.login,
                        name: eventItem.actor.login
                    },
                    change: {
                        title: {
                            from: eventItem.rename.from,
                            to: eventItem.rename.to
                        }
                    }
                }
                changeHistory.push(change);
                change = {}
                break;
            case 'opened':
            case 'closed':
            case 'reopened':
                break;
            default:
                // do nothing
        }
    });
    return changeHistory;
}

function processCommentList(commentList) {
    commentList.forEach(function(commentItem, index) {
        commentList[index] = {
            time: commentItem.created_at,
            commentedBy: {
                username: commentItem.user.login,
                name: commentItem.user.login
            },
            files: [],
            comment: commentItem.body
        }
    });
    return commentList;
}


function sortChangeHistory(changeHistory) {
    return _.sortBy(changeHistory, 'time');
}


function convertToBugtrackItem(githubIssue) {
    var bugtrackItem = {
        id: null,
        title: githubIssue.title,
        kind: getKind(githubIssue.labels),
        status: getStatus(githubIssue.labels),
        createdAt: githubIssue.created_at,
        shippedAt: null,
        closedAt: githubIssue.closed_at,
        updatedAt: githubIssue.updated_at,
        category: getProjectNameFromURL(githubIssue.url),
        severity: setSeverity(getSeverity(githubIssue.labels)),
        priority: {
            level: null,
            title: null
        },
        submittedBy: {
            username: githubIssue.user.login,
            name: githubIssue.user.login
        },
        assignTo: (function() {
            try {
                return {
                    username: githubIssue.assignee.login,
                    name: githubIssue.assignee.login
                }
            } catch (e) {
                return {
                    "username": "nobody",
                    "email": "nobody@marklogic.com",
                    "name": "nobody nobody"
                }
            }
        })(),

        tofixin: (function() {
            try {
                return githubIssue.milestone.title;
            } catch (e) {
                return '';
            }
        })(),
        description: githubIssue.body,
        samplequery: '',
        sampledata: '',
        stacktrace: '',
        platfrom: 'all',
        processors: '',
        memory: '',
        note: '',
        attachments: [],
        tags: [getProjectNameFromURL(githubIssue.url), githubIssue.user.login],
        subscribers: [{
                username: githubIssue.user.login,
                name: githubIssue.user.login
            },
            /*{
            username: githubIssue.assignee.login,
            name: githubIssue.assignee.login
        }*/
        ],
        clones: [],
        cloneOf: null,
        changeHistory: githubIssue.changeHistory,
        github: {
            issueId: githubIssue.number,
            url: githubIssue.html_url,
            endpoint: githubIssue.url
        }
    }

    if (bugtrackItem.kind === 'Task' || bugtrackItem.kind === 'RFE') {
        delete bugtrackItem.clones;
        delete bugtrackItem.cloneOf;
        bugtrackItem.proceduralTasks = {
            'Requirements Task': [],
            'Functional Specification Task': [],
            'Test Specification Task': [],
            'Test Automation Task': [],
            'Documentation Task': []
        };
        bugtrackItem.subTasks = []

    }


    return bugtrackItem;
}


function getKind(labels) {
    var kind = null;
    labels.forEach(function(label) {
        if (label.name === 'Bug') {
            kind = 'Bug'
        }

        if (label.name === 'Enhancement') {
            kind = 'RFE'
        }
        if (label.name === 'Task') {
            kind = 'Task'
        }
    })
    return kind;
}


function getSeverity(labels) {
    var severity = null;
    labels.forEach(function(label) {
        switch (label.name) {
            case 'catastrophic':
            case 'critical':
            case 'major':
            case 'minor':
            case 'aesthetic':
            case 'performance':
                severity = capitalize(label.name)
                break;
        }
    })
    return severity;
}

function getStatus(labels) {
    var status = null;
    labels.forEach(function(label) {
        switch (label.name) {
            case 'new':
            case 'verify':
            case 'fix':
            case 'test':
            case 'ship':
            case 'closed':
            case 'will not fix':
            case 'external':
                status = capitalize(label.name)
                break;
        }
    })
    return status;
}

function setSeverity(label) {
    var severity = null;
    switch (label.toLowerCase()) {
        case 'catastrophic':
            severity = 'P1 - Catastrophic';
            break;
        case 'critical':
            severity = 'P2 - Critical';
            break;
        case 'major':
            severity = 'P3 - Major';
            break;
        case 'minor':
            severity = 'P4 -  Minor';
            break;
        case 'aesthetic':
            severity = 'P5 - Aesthetic';
            break;
        case 'performance':
            severity = 'Performance'
            break;
         default:
         severity = label;   
    }
    console.log('LABEL', label);
    console.log('SEV', severity);
    return severity;
}

// capitalises the first letter in a string
function capitalize(s) {
    try {
        s = s.toString();
        return s[0].toUpperCase() + s.slice(1);
    } catch (e) {
        return ''
    }
}
