'use strict';

var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;
var request = require('request');
var async = require('async');
var _ = require('lodash');

var githubAuth = {
    user: 'marklogic-builder',
    pass: 'rhUrnQ1AewawZ61K'
}
var githubLabels = {
    all: ['Bug', 'Enhancement', 'Task', 'RFE', 'new', 'verify', 'test', 'fix', 'ship', 'closed', 'external', 'will not fix', 'catastrophic', 'critical', 'major', 'minor', 'aesthetic', 'performance'],
    kind: ['Bug', 'Enhancement', 'Task', 'RFE'],
    status: ['new', 'verify', 'test', 'fix', 'ship', 'closed', 'external', 'will not fix'],
    severity: ['catastrophic', 'critical', 'major', 'minor', 'aesthetic', 'performance']
}

// Get list of githubs
exports.index = function(req, res) {
    db.documents.read('github_issues.json').result(function(response) {
        return res.status(200).json(response[0].content)
    }, function(error) {
        return res.status(500).json({
            error: 'Could not retrive un-imported github issues'
        })
    })
};



exports.issues = function(req, res) {
    var _project = req.query.project || null;
    var _sort = req.query.sort || 'updated';
    var _order = req.query.order || 'asc';
    var _page = req.query.page || 1;
    var _per_page = req.query.per_page || 100;
    var _transform = req.query.transform || false;
    var _import = req.query.import || false;
    var _interval = req.query.interval || null;
    var t1 = null;
    var t2 = null;
    var period = null;
    var _url = null;

    if (!_project) {
        return res.send({
            msg: 'You must specify project'
        })
    }


    try {
        _transform = JSON.parse(_transform)
    } catch (e) {
        _transform = false;
    }


    if (_interval instanceof Array || _project instanceof Array || _transform instanceof Array || _import instanceof Array || _sort instanceof Array || _order instanceof Array || _page instanceof Array || _per_page instanceof Array) {
        return res.send({
            msg: 'Pass only one value to interval. You may be passing multiple query parameter values for project|interval|transform|import|sort|order|page|per_page'
        })
    }
    // when load=true, then set transform=true
    try {
        _import = JSON.parse(_import);
        if (_import) {
            _transform = true;
        }
    } catch (e) {
        _import = false;
    }

    // when interval=false then remove time constraint from the url
    if (_interval === 'false' || !_interval) {
        _url = encodeURI('https://api.github.com/search/issues?q=repo:marklogic/' + _project + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page);
    } else {
        t1 = new Date();
        t2 = new Date(t1.getTime() - (_interval * 60 * 1000));
        period = ' updated:"' + t2.toISOString() + ' .. ' + t1.toISOString() + '"';
        _url = encodeURI('https://api.github.com/search/issues?q=repo:marklogic/' + _project + period + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page);
    }

    // _url = encodeURI('https://api.github.com/search/issues?q=repo:marklogic/' + _project + ' updated:"' + t2 + ' .. ' + t1 + '"' + '&sort=' + _sort + '&order=' + _order + '&page=' + _page + '&per_page=' + _per_page + '&transform=' + _transform);

    console.log('url:', _url)

    var finalResult = [];
    var unImportedIssues = [];
    var options = {
        url: _url,
        headers: {
            'User-Agent': req.query.project
        },
        auth: githubAuth
    };

    if (_import) {
        request(options, function(error, response, body) {
                if (error) {
                    console.log(error);
                    return res.send(error);
                }

                if (!error && response.statusCode === 200) {
                    var issues = JSON.parse(body).items
                    if (issues.length === 0) {
                        return res.send({
                            url: _url,
                            //  time_range: t2.toLocaleString() + ' - ' + t1.toLocaleString(),
                            count: issues.length,
                            issues: issues
                        })
                    }
                    var transformedIssues = [];
                    async.times(issues.length, function(n, next) {
                        getEventsAndComments(issues[n], function(err, issue) {
                            transformedIssues.push(convertToBugtrackItem(issue));
                            next(err, issue);
                        })
                    }, function(err, issues) {
                        if (err) {
                            res.send(err)
                        }


                        var cargo = async.cargo(function(tasks, callback) {
                            for (var i = 0; i < tasks.length; i++) {

                                var validationResult = checkImportRules(tasks[i]);
                                if (validationResult.msg.substring(0, 5) === 'Error') {
                                    unImportedIssues.push(validationResult);
                                    finalResult.push(validationResult);
                                    if (finalResult.length === transformedIssues.length) {
                                        updateDB(finalResult, unImportedIssues, _url, function(err, response) {
                                            if (err) {
                                                return res.status(500).json(err)
                                            }
                                            return res.send(response)
                                        })
                                    }
                                    callback();
                                } else {
                                    insertIssueIntoBugtrack(tasks[i], req, res, function(err, result) {
                                        if (err) {
                                            return res.send(err)
                                        }
                                        //  console.log('result:', result);
                                        finalResult.push(result)

                                        // push unimported issues into an array
                                        if (result.msg.substring(0, 5) === 'Error') {
                                            delete result.bugtrackId;
                                            unImportedIssues.push(result);
                                        }

                                        // console.log('finalResult:' + finalResult.length + 'transformedIssues.length:' + transformedIssues.length);
                                        if (finalResult.length === transformedIssues.length) {
                                            console.log('responding from callback2');
                                            console.log('unImportedIssues:', unImportedIssues);
                                            updateDB(finalResult, unImportedIssues, _url, function(err, response) {
                                                if (err) {
                                                    return res.status(500).json(err)
                                                }
                                                return res.send(response)
                                            })

                                            // return res.send(updateDB(finalResult, unImportedIssues, _url))
                                        }
                                        callback();
                                    });
                                }
                            }

                        }, 1);
                        transformedIssues.forEach(function(issue) {
                            cargo.push(issue);
                        })
                    })
                } // if end
            }) // request end
    } else {
        request(options, function(error, response, body) {
                if (error) {
                    console.log(error);
                    return res.send(error);
                }

                if (!error && response.statusCode === 200) {
                    var issues = JSON.parse(body).items
                    var finalResult = [];
                    async.times(issues.length, function(n, next) {
                        getEventsAndComments(issues[n], function(err, issue) {
                            if (_transform) {
                                finalResult.push(convertToBugtrackItem(issue));
                            } else {
                                finalResult.push(issue);
                            }
                            next(err, issue);
                        })
                    }, function(err, issues) {
                        if (err) {
                            return res.status(500).json(err);
                        }

                        return res.send({
                            url: _url,
                            //  time_range: t2.toLocaleString() + ' - ' + t1.toLocaleString(),
                            count: finalResult.length,
                            issues: finalResult
                        })
                    })
                } // if end
            }) // request end
    }



}


exports.issue = function(req, res) {
    var _project = req.query.project || null;
    var _issueId = req.query.id || null;
    var _transform = req.query.transform || false;
    var _import = req.query.import || false;
    var _issueKind = req.query.kind || null;

    try {
        _transform = JSON.parse(_transform);
    } catch (e) {
        _transform = false;
    }
    // when load=true, then set transform=true
    try {
        _import = JSON.parse(_import);
        if (_import) {
            _transform = true;
        }
    } catch (e) {
        _import = false;
    }

    var _url = 'https://api.github.com/repos/marklogic/' + _project + '/issues/' + _issueId + '&transform=' + _transform
    var options = {
        url: _url,
        headers: {
            'User-Agent': _project
        },
        auth: githubAuth
    };
    if (_import) {
        async.waterfall([

            function(waterfallCallback) {
                getIssue(options, waterfallCallback);
            },
            function(issue, waterfallCallback) {
                getEventsAndComments(issue, waterfallCallback)
            },
            function(issue, waterfallCallback) {
                convertToBugtrackItem(issue, waterfallCallback)
            },
            function(transformedItem, waterfallCallback) {
                attachNewBugtrackId(transformedItem, req, waterfallCallback);
            }

        ], function end(err, item) {
            if (err) {
                return res.status(404).json({
                    error: 'Issue not found'
                })
            }

            if (_issueKind) {
                item.kind = _issueKind;
                if (item.kind.toLowerCase() === 'task' || item.kind.toLowerCase() === 'rfe') {
                    delete item.clones;
                    delete item.cloneOf;
                    item.proceduralTasks = {
                        'Requirements Task': [],
                        'Functional Specification Task': [],
                        'Test Specification Task': [],
                        'Test Automation Task': [],
                        'Documentation Task': []
                    };
                    item.subTasks = []
                }
            } else {
                var validationResult = checkImportRules(item);
                if (validationResult.msg.substring(0, 5) === 'Error') {
                    return res.send(validationResult);
                }
            }

            insertIssueIntoBugtrack(item, req, res, function(err, result) {
                if (err) {
                    return res.send(err);
                }
                console.log('result', result);

                db.documents.patch('github_issues.json', [p.remove('/array-node("github_issues")//*[githubId eq ' + result.githubId + ' and project = "' + result.project + '" ]')])
                    .result(function(response) {
                        console.log('github_issues.json updated');
                        return res.send(result);
                    }, function(error) {
                        console.log('error updating github_issues.json', error);
                        return res.send(error)
                    })

                //return res.send(result);
            });
        })

    } else {
        async.waterfall([

            function(waterfallCallback) {
                getIssue(options, waterfallCallback);
            },
            function(issue, waterfallCallback) {
                getEventsAndComments(issue, waterfallCallback)
            }
        ], function end(err, item) {
            if (err) {
                return res.status(404).json({
                    error: 'Not Found'
                })
            }
            if (_transform) {
                return res.send(convertToBugtrackItem(item));
            } else {
                return res.send(item);
            }
        })
    }


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

        function(waterfallCallback) {
            getIssue(options, waterfallCallback);
        },
        function(issue, waterfallCallback) {
            getEventsAndComments(issue, waterfallCallback)
        },
        function(issue, waterfallCallback) {
            convertToBugtrackItem(issue, waterfallCallback)
        },
        function(transformedItem, waterfallCallback) {
            attachNewBugtrackId(transformedItem, req, waterfallCallback);
        }

    ], function end(err, item) {
        if (err) {
            return res.status(404).json({
                error: 'Not Found'
            })
        }
        res.send(item);
    })
};

// updates db with un-imported issues
function updateDB(finalResult, unImportedIssues, url, callback) {
    // update databse with un-imported issues for record keeping
    var updates = [];
    _.forEach(unImportedIssues, function(issue) {
        updates.push(p.insert('/array-node("github_issues")', 'last-child', issue));
        //var xpath = '/array-node("github_issues")//*[githubId eq ' + issue.githubId + ' and project = "' + issue.project + '" ]'
        updates.push(p.remove('/array-node("github_issues")//*[githubId eq ' + issue.githubId + ' and project = "' + issue.project + '" ]'))
    })
    if (updates.length > 0) {
        db.documents.patch('github_issues.json', updates)
            .result(function(response) {
                console.log('github_issues.json updated');
                return callback(null, {
                    url: url,
                    //    time_range: t2.toLocaleString() + ' - ' + t1.toLocaleString(),
                    count: finalResult.length,
                    issues: finalResult
                })
            }, function(error) {
                return callback({
                    error: 'Could not save un-imported issues in the database.' + error
                })
            })
    } else {
        return callback(null, {
            url: url,
            //    time_range: t2.toLocaleString() + ' - ' + t1.toLocaleString(),
            count: finalResult.length,
            issues: finalResult
        })
    }

}


function getGitHubUserInfo(username, callback) {
    var _url = 'https://api.github.com/users/' + username;
    var options = {
        url: _url,
        /*headers: {
            'User-Agent': _project
        },*/
        auth: githubAuth
    };
    request(options, function(err, response, body) {
        if (err) {
            if (callback) {
                callback(err)
            } else {
                return err;
            }
        }
        if (response.statusCode === 200) {
            var _body = JSON.parse(body)
            var userInfo = {
                username: username,
                name: _body.name,
                email: _body.email
            }
            if (callback) {
                callback(null, userInfo)
            } else {
                return userInfo;
            }
        } else {
            if (callback) {
                callback({
                    error: 'could not get user info'
                })
            } else {
                return {
                    error: 'could not get user info'
                };
            }
        }
    })
}

function insertIssueIntoBugtrack(item, req, res, callback) {
    // console.log('called insertIssueIntoBugtrack');
    var action = {
        project: item.github.project,
        githubId: item.github.issueId,
        issue_url: item.github.url,
        bugtrackId: item.id,
        msg: null
    }
    async.waterfall([

        function checkIfBugExists(callback) {
            isBugExistsInBugtrack(item, callback);
        },
        function insertOrUpdate(bug, callback) {
            var baseUri = req.protocol + '://' + req.headers.host;
            var key = null;
            var options = {};
            options.method = 'POST';


            if (bug) {
                // update existing bug & also preserve any changes that were made in bugtrack
                action.bugtrackId = bug.id
                bug = preserveBugtrackUpdates(bug, item);
                createBugtrackIssue(bug, req, function(err, result) {
                    if (err) callback(err)
                    callback(null, result)
                })

            } else {
                createNewBugtrackIssue(item, req, function(err, result) {
                    if (err) callback(err)
                    callback(null, result);
                });
            }

        }
    ], function done(err, result) {
        if (err) {
            console.log(err);
            return res.send(err)
        }
        if (!result.error) {
            action.bugtrackId = result.id;
            action.bugtrack_url = '/' + item.kind.toLowerCase() + '/' + item.id
        }
        if (result.bug) {
            action.bug = result.bug;
        }
        action.msg = result.msg;
        return callback(null, action);
    })
}

// preserve any changes made on bugtrack when re-importing from github
function preserveBugtrackUpdates(btIssue, ghIssue) {
    var combinedIssue = ghIssue || null;
    //'assignTo'
    var btProps = ['id', 'version', 'platfrom', 'priority', 'fixedin', 'note', 'days', 'period', 'attachments', 'proceduralTasks', 'subTasks', 'tags', 'clones', 'cloneOf', 'parent']
    _.forEach(btProps, function(prop) {
        if (btIssue.hasOwnProperty(prop)) {
            combinedIssue[prop] = btIssue[prop];
        }
    });

    combinedIssue.changeHistory = _.uniq(_.flatten([btIssue.changeHistory, ghIssue.changeHistory]), 'time');
    combinedIssue.changeHistory = _.sortBy(combinedIssue.changeHistory, 'time');
    //  console.log('Combined', combinedIssue);
    return combinedIssue;
}



function attachNewBugtrackId(issue, req, callback) {
    request.get(req.protocol + '://' + req.headers.host + '/api/common/nextId', function(err, response, body) {
        if (callback) {
            if (err) {
                return callback(err);
            }
            issue.id = JSON.parse(body).nextId

            return callback(null, issue);
        } else {
            if (err) {
                return err;
            }
            issue.id = JSON.parse(body).nextId
            return issue;
        }
    })
}


function getIssue(options, callback) {
    request(options, function(err, response, body) {
        if (err) {
            console.log(err);
            return callback(err)
        }

        if (JSON.parse(body).message === 'Not Found') {
            return callback(JSON.parse(body).message, null)
        } else {
            return callback(null, JSON.parse(body));
        }
    });
}


function getEventsAndComments(issue, callback) {
    //  console.log('issue', issue);
    async.parallel({
        eventList: function(parallelCallback) {
            var options = {
                url: issue.events_url,
                headers: {
                    'User-Agent': getProjectNameFromURL(issue.events_url)
                },
                auth: githubAuth
            };
            request(options, function(error, response, body) {
                if (error) {
                    console.log('ERROR from eventList', error);
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
                    'User-Agent': getProjectNameFromURL(issue.comments_url)
                },
                auth: githubAuth
            };
            request(options, function(error, response, body) {
                if (error) {
                    console.log('ERROR from commentList', error);
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
            console.log('ERROR from attachEventsAndComments', err);
            if (callback) {
                return callback(err)
            }
            return err
        }
        issue.eventList = JSON.parse(result.eventList);
        issue.commentList = JSON.parse(result.commentList);

        // console.log('Issue:', issue);
        if (callback) return callback(null, issue)
        return issue;

    })
}


function isBugExistsInBugtrack(bug, callback) {
    db.documents.query(
            q.where(
                q.parsedFrom('gh:' + bug.github.issueId + ' AND ' + 'ghp:' + bug.github.project,
                    q.parseBindings(
                        q.range(q.pathIndex('/github/issueId'), q.bind('gh')),
                        q.range(q.pathIndex('/github/project'), q.bind('ghp'))
                    ))
            ))
        .result(function(result) {
            //console.log('result', result);

            if (result.length === 0) {
                return callback(null, null)
            } else {
                //var _uri = result[0].uri
                var existingUris = _.pluck(result, 'uri')|| [ ];
                console.log('existing uris:', existingUris);
                if (existingUris.length > 0) {
                    console.log('bug exists');
                    db.documents.remove({uri: existingUris}).result(
                        function(response) {
                        console.log(JSON.stringify(response));
                          return callback(null, result[0].content)
                    }, function(error) {
                        console.log('error while deleting existing docs:', error);
                    }
                    );
                    //return callback(null, result[0].content)
                } else {
                    console.log('bug does not exist');
                    return callback(null, null);
                }
            }
        }, function(err) {
            return callback(err)
        })
}


function getNextId(req, callback) {
    request.get(req.protocol + '://' + req.headers.host + '/api/common/nextId', function(err, response, body) {
        if (callback) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            return callback(null, JSON.parse(body).nextId)
        } else {
            if (err) {
                console.log(err);
                return err;
            }
            return JSON.parse(body).nextId;
        }


    })
}

function createNewBug(bug, req, callback) {
    // insert new bug
    async.waterfall([

        function getId(waterfallCallback) {
            getNextId(req, waterfallCallback)
        },
        function insert(id, waterfallCallback) {
            bug.id = parseInt(id);
            createBug(bug, req, waterfallCallback);
        }
    ], function end(err, result) {
        if (err) {
            return callback(err)
        }
        return callback(null, result)
    })
}

// insert new task
function createNewTask(task, req, callback) {
        async.waterfall([

            function getId(waterfallCallback) {
                getNextId(req, waterfallCallback)
            },
            function insert(id, waterfallCallback) {
                task.id = parseInt(id);
                createTask(task, req, waterfallCallback);
            }
        ], function end(err, result) {
            if (err) {
                return callback(err)
            }
            console.log('create new Task', result);
            return callback(null, result)
        })
    }
    // insert new rfe
function createNewRFE(rfe, req, callback) {
    async.waterfall([

        function getId(waterfallCallback) {
            getNextId(req, waterfallCallback)
        },
        function insert(id, waterfallCallback) {
            rfe.id = parseInt(id);
            createRFE(rfe, req, waterfallCallback);
        }
    ], function end(err, result) {
        if (err) {
            return callback(err)
        }
        return callback(null, result)
    })
}


function checkImportRules(issue) {

    // when issue kind is not set or set invalid label
    if ((typeof issue.kind) === 'undefined' && issue.kind.toLowerCase() !== 'bug' && issue.kind.toLowerCase() !== 'task' && issue.kind.toLowerCase() !== 'rfe') {
        return {
            project: issue.github.project,
            githubId: issue.github.issueId,
            issue_url: issue.github.url,
            msg: 'Error: invalid kind. kind is ' + issue.kind
        }
    }

    // when milestone is not set
    if (!issue.tofixin && issue.status !== 'Closed') {
        return {
            project: issue.github.project,
            githubId: issue.github.issueId,
            issue_url: issue.github.url,
            msg: 'Error: no milestone'
        }
    }

    return {
        msg: 'ok'
    };
}


// generatea a new id and inserts into database
function createNewBugtrackIssue(issue, req, callback) {

    /*   var validationResult = checkImportRules(issue);
    if (validationResult.msg.substring(0, 5) === 'Error') {
        if (callback) {
            return callback(null, validationResult)
        } else {
            return validationResult;
        }
    }*/

    async.waterfall([

        function getId(waterfallCallback) {
            getNextId(req, waterfallCallback)
        },
        function insert(id, waterfallCallback) {
            issue.id = parseInt(id);
            createBugtrackIssue(issue, req, waterfallCallback);
        }
    ], function end(err, result) {
        if (err) {
            return callback(err)
        }
        return callback(null, result)
    })
}

// inserts the given issues into datatabase (does not generate new id)
// use this function to update existing issues
function createBugtrackIssue(issue, req, callback) {
    // console.log('request', req);
    /*   var validationResult = checkImportRules(issue);
    if (validationResult.msg.substring(0, 5) === 'Error') {
        if (callback) {
            return callback(null, validationResult)
        } else {
            return validationResult;
        }
    }
*/

    var baseUri = req.protocol + '://' + req.headers.host;
    var kind = issue.kind;
    var options = {};
    options.method = 'POST';
    options.headers = req.headers;
    switch (kind.toLowerCase()) {
        case 'bug':
            issue.kind = 'Bug';
            options.uri = baseUri + '/api/bugs/new';
            options.json = {
                'bug': issue
            };
            break;
        case 'task':
            issue.kind = 'Task';
            options.uri = baseUri + '/api/tasks/new';
            options.json = {
                'task': issue
            };
            break;
        case 'rfe':
            issue.kind = 'RFE';
            options.uri = baseUri + '/api/rfes/new';
            options.json = {
                'rfe': issue
            };
            break;
        default:
            return callback(null, {
                githubId: issue.github.issueId,
                msg: 'Error: invalid kind. kind is ' + kind
            })
    }



    request(options, function(err, response, body) {
        if (callback) {
            if (err) {
                console.error('could not import issue #' + issue.github.issueId, err);
                return callback(null, {
                    error: true,
                    msg: 'Error: could not import issue #' + issue.github.issueId + '. ' + err.toString()
                });
            }

            if (response.statusCode !== 200) {
                return callback({
                    error: true,
                    msg: 'Error: could not import issue #' + issue.github.issueId + JSON.stringify(response)
                })
            }

            console.log(issue.id + ' created successfully');
            return callback(null, {
                id: issue.id,
                msg: 'imported'
            });
        } else {

            if (err) {
                console.error('Error: could not import issue #' + issue.github.issueId, err);
                return err;
            }

            if (response.statusCode !== 200) {
                return {
                    error: true,
                    msg: 'Error: could not import issue #' + issue.github.issueId
                }
            }
            console.log(issue.id + ' created successfully');
            return {
                id: issue.id,
                msg: 'imported'
            };
        }
    })


}



function createBug(bug, req, callback) {
    request({
        method: 'POST',
        headers: req.headers,
        uri: req.protocol + '://' + req.headers.host + '/api/bugs/new',
        json: {
            'bug': bug
        }
    }, function(err, response, body) {
        if (callback) {
            if (err) {
                console.error('could not create bug-' + bug.id, err);
                return callback(err);
            }

            if (response.statusCode !== 200) {
                return callback({
                    error: 'could not create bug-' + bug.id
                })
            }

            console.log('bug created successfully');
            return callback(null, bug.id);
        } else {

            if (err) {
                console.error('could not create bug-' + bug.id, err);
                return err;
            }

            if (response.statusCode !== 200) {
                return {
                    error: 'could not create bug-' + bug.id
                }
            }
            console.log('bug created successfully');
            return bug.id
        }

    })
}

function createTask(task, req, callback) {
    request({
        method: 'POST',
        headers: req.headers,
        uri: req.protocol + '://' + req.headers.host + '/api/tasks/new',
        json: {
            'task': task
        }
    }, function(err, response, body) {
        if (callback) {
            if (err) {
                console.error('could not create task-' + task.id, err);
                return callback(err);
            }

            if (response.statusCode !== 200) {
                return callback({
                    error: 'could not create task-' + task.id
                })
            }

            console.log('task created successfully');
            return callback(null, task.id);
        } else {

            if (err) {
                console.error('could not create task-' + task.id, err);
                return err;
            }

            if (response.statusCode !== 200) {
                return {
                    error: 'could not create task-' + task.id
                }
            }
            console.log('task created successfully');
            return task.id
        }

    })
}

function createRFE(rfe, req, callback) {
    request({
        method: 'POST',
        headers: req.headers,
        uri: req.protocol + '://' + req.headers.host + '/api/rfes/new',
        json: {
            'rfe': rfe
        }
    }, function(err, response, body) {
        if (callback) {
            if (err) {
                console.error('could not create rfe-' + rfe.id, err);
                return callback(err);
            }

            if (response.statusCode !== 200) {
                return callback({
                    error: 'could not create rfe-' + rfe.id
                })
            }

            console.log('rfe created successfully');
            return callback(null, rfe.id);
        } else {

            if (err) {
                console.error('could not create rfe-' + rfe.id, err);
                return err;
            }

            if (response.statusCode !== 200) {
                return {
                    error: 'could not create rfe-' + rfe.id
                }
            }
            console.log('rfe created successfully');
            return rfe.id
        }

    })
}

function getProjectNameFromURL(url) {

    return url.replace(/(https:\/\/api\.github\.com\/repos\/marklogic\/)(\S*)\/issues\/\S*/, '$2');
}

function processEventList(eventList) {
    var changeHistory = [];
    var change = {};

    var groupedByTime = _.groupBy(eventList, function(t) {
        return t.created_at;
    })

    _.forEach(groupedByTime, function(item, time) {
        var changedSelections = {};
        var updatedBy = null;
        var svn = null;

        if (item.actor) {
            _.forEach(item, function(eventItem) {
                updatedBy = {
                    username: eventItem.actor.login,
                    name: eventItem.actor.login
                }

                switch (eventItem.event) {
                    case 'labeled':
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
                        // if (eventItem.label.name === 'Enhancement') {
                        //     eventItem.label.name = 'RFE';
                        // }

                        changedSelections[changeName] = {
                            from: null,
                            to: eventItem.label.name
                        }
                        break;
                    case 'assigned':
                        changedSelections['assignTo'] = {
                            from: null,
                            to: {
                                username: eventItem.assignee.login,
                                name: eventItem.assignee.login
                            }
                        }
                        break;
                    case 'milestoned':
                        changedSelections['tofixin'] = {
                            from: null,
                            to: eventItem.milestone.title
                        }
                        break;
                    case 'referenced':
                        svn = {
                            repository: getProjectNameFromURL(eventItem.url),
                            revision: eventItem.commit_id
                        }
                        break;
                    case 'renamed':
                        changedSelections['title'] = {
                            from: eventItem.rename.from,
                            to: eventItem.rename.to
                        }

                        break;
                    case 'opened':
                        changedSelections['status'] = {
                            from: null,
                            to: 'New'
                        }
                        break;
                    case 'closed':
                        changedSelections['status'] = {
                            from: null,
                            to: 'Closed'
                        }
                        break;
                    case 'reopened':
                        changedSelections['status'] = {
                            from: 'Closed',
                            to: 'Fix'
                        }
                        break;
                    default:
                        // do nothing
                }
                if (eventItem.commit_id) {
                    svn = {
                        repository: getProjectNameFromURL(eventItem.url),
                        revision: eventItem.commit_id
                    }
                }
            });


            var changes = {
                time: time,
                updatedBy: updatedBy,
                change: changedSelections,
                files: [],
                comment: ''
            }
            if (svn) {
                changes.svn = svn;
            }

            if (_.keys(changes.change).length > 0) {
                changeHistory.push(changes);
            }
        }
    })


    return changeHistory;
}

function processCommentList(commentList) {
    commentList.forEach(function(commentItem, index) {
        commentList[index] = {
            time: commentItem.created_at,
            updatedBy: {
                username: commentItem.user.login,
                name: commentItem.user.login
            },
            files: [],
            comment: "<p><pre id='description'>" + commentItem.body + "</pre></p>"
        }
    });
    return commentList;
}


function sortChangeHistory(changeHistory) {
    return _.sortBy(changeHistory, 'time');
}


function convertToBugtrackItem(githubIssue, callback) {
    console.log('converting ', githubIssue.number);
    githubIssue.changeHistory = _.sortBy(_.flatten([processEventList(githubIssue.eventList), processCommentList(githubIssue.commentList)]), 'time');
    delete githubIssue.eventList;
    delete githubIssue.commentList;
    var bugtrackItem = {
        id: null,
        title: githubIssue.title,
        kind: getKind(githubIssue.labels),
        status: getStatus(githubIssue.labels),
        version: '',
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
        fixedin: '',
        description: "<p><pre id='description'>" + githubIssue.body + "</pre></p>",
        samplequery: '',
        sampledata: '',
        stacktrace: '',
        platfrom: '',
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
        support: {
            headline: '',
            supportDescription: '',
            workaround: '',
            publishStatus: 'never',
            tickets: [],
            customerImpact: 'N/A'
        },
        changeHistory: githubIssue.changeHistory,
        github: {
            project: getProjectNameFromURL(githubIssue.url),
            issueId: githubIssue.number,
            url: githubIssue.html_url,
            endpoint: githubIssue.url
        }
    }
    if (githubIssue.milestone) {
        bugtrackItem.version = githubIssue.milestone.title;
    }

    if (bugtrackItem.status && bugtrackItem.status.toLowerCase() === 'ship') {
        bugtrackItem.fixedin = bugtrackItem.tofixin;
        bugtrackItem.assignTo = {
                    "username": "nobody",
                    "email": "nobody@marklogic.com",
                    "name": "nobody nobody"
                }
    }

    if (bugtrackItem.kind && (bugtrackItem.kind.toLowerCase() === 'task' || bugtrackItem.kind.toLowerCase() === 'rfe')) {
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
    if (callback) {
        return callback(null, bugtrackItem);
    } else {
        return bugtrackItem;
    }
}


function getKind(labels) {
    if (labels.length === 0) return ''
    var kind = null;
    labels.forEach(function(label) {
        if (label.name.toLowerCase() === 'bug') {
            kind = 'Bug'
        }

        if (label.name.toLowerCase() === 'rfe') {
            kind = 'RFE'
        }

        if (label.name.toLowerCase() === 'enhancement') {
            kind = 'Enhancement'
        }

        if (label.name.toLowerCase() === 'task') {
            kind = 'Task'
        }
    })
    return kind;
}


function getSeverity(labels) {
    if (labels.length === 0) return ''
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
    if (labels.length === 0) return ''
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
    if (!label) return ''
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
