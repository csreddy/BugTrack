'use strict';

var fs = require('fs');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;

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
        .slice(1, 1)
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
        .slice(1, 20)
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
    var uri = '/bug/' + req.params.id + '/' + req.params.id + '.json';
    db.documents.probe(uri).result(function(document) {
        // console.log('document at ' + uri + ' exists: ' + document.exists);
        if (document.exists) {
            db.documents.read({
                uris: [uri]
            }).result(function(response) {
                //     console.log('from '+ uri, response);
                if (response.length === 1) {
                    res.status(200).json(response[0].content);
                }
            }, function(error) {
                res.status(error.statusCode).json({
                    error: 'error occured while retrieving ' + uri + '\n' + error
                })
            });

        } else {
            res.status(404).json({
                error: 'could not find bug ' + req.params.id
            });
        }
    }, function(error) {
        res.status(error.statusCode).json({
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
    } else {
        id = JSON.parse(req.body.bug).id;
        collections.push(JSON.parse(req.body.bug).submittedBy.username);
    }
    var uri = '/bug/' + id + '/' + id + '.json';
    var countDoc = 'count.json'
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
        var doc = {
            uri: '/bug/' + id + '/attachments/' + attachments[file].originalname,
            category: 'content',
            contentType: attachments[file].mimetype,
            content: fs.createReadStream(attachments[file].path)
        };

        db.documents.write(doc).result(function(response) {
            console.log('wrote:\n ', JSON.stringify(response.documents[0]));
            res.send(200);
        }, function(error) {
            errors = true;
            res.send(400, {
                message: 'file upload failed. Try again'
            });
        });
    }

    for (var file in attachments) {
        // delete file from uploads dir after successfull upload
        fs.unlink(attachments[file].path, function(err) {
            if (err) throw err;
        });
    }

};


exports.update = function(req, res) {
    console.log('Inside update....');
    console.log(req.body);
    // res.json(req.body);
    var from = JSON.parse(req.body.old);
    var to = JSON.parse(req.body.bug);
    var file = req.files;
    var uri = '/bug/' + from.id + '/' + from.id + '.json';
    var updates = []
    var updateTime = new Date();

    var changes = {
        time: updateTime,
        updatedBy: {
            name: to.updatedBy.name,
            email: to.updatedBy.email,
            username: to.updatedBy.username
        },
        change: {},
        files: []
    }

    console.log('FILES', req.files);

    for (var prop in to) {
        switch (prop) {
            case 'status':
                if (from.status !== to.status) {
                    updates.push(p.replace('/status', to.status));
                    changes.change.status = {
                        from: from.status,
                        to: to.status
                    };
                }
                break;
            case 'severity':
                if (from.severity !== to.severity) {
                    updates.push(p.replace('/severity', to.severity));
                    changes.change.severity = {
                        from: from.severity,
                        to: to.severity
                    };
                }
                break;
            case 'category':
                if (from.category !== to.category) {
                    updates.push(p.replace('/category', to.category));
                    changes.change.category = {
                        from: from.category,
                        to: to.category
                    };
                }
                break;
            case 'priority':
                if (from.priority.level !== to.priority.level) {
                    updates.push(p.replace('/priority/level', to.priority.level));
                    updates.push(p.replace('/priority/title', to.priority.title));
                    changes.change.priority = {
                        from: from.priority,
                        to: to.priority
                    };
                }
                break;
            case 'version':
                if (from.version !== to.version) {
                    updates.push(p.replace('/version', to.version));
                    changes.change.version = {
                        from: from.version,
                        to: to.version
                    };
                }
                break;
            case 'platform':
                if (from.platform !== to.platform) {
                    updates.push(p.replace('/platform', to.platform))
                    changes.change.platform = {
                        from: from.platform,
                        to: to.platform
                    };
                }
                break;
            case 'tofixin':
                if (from.tofixin !== to.tofixin) {
                    updates.push(p.replace('/tofixin', to.tofixin));
                }
                break;
            case 'fixedin':
                if (from.fixedin !== to.fixedin) {
                    updates.push(p.replace('/fixedin', to.fixedin));
                    changes.change.fixedin = {
                        from: from.fixedin,
                        to: to.fixedin
                    };
                }
                break;
            case 'assignTo':
                if (from.assignTo.username !== to.assignTo.username) {
                    updates.push(p.replace('/assignTo/username', to.assignTo.username));
                    updates.push(p.replace('/assignTo/email', to.assignTo.email));
                    updates.push(p.replace('/assignTo/name', to.assignTo.name));
                    for (var i = 0; i < to.subscribers.length; i++) {
                        // check if the user has already subscribed
                        if (to.subscribers[i].username === to.assignTo.username) {
                            break;
                        }
                        // if user has not subscribed then subscribe at the last iteration
                        if (i === to.subscribers.length - 1) {
                            updates.push(p.insert("array-node('subscribers')", 'last-child', to.assignTo));
                        }
                    }

                    changes.change.assignTo = {
                        from: from.assignTo,
                        to: to.assignTo
                    };

                }
                break;
            case 'comment':
                if (to.comment.length > 0) {
                    changes.comment = to.comment;
                }
                break;
            case 'subscribers':
                var userIndex = _.findIndex(from.subscribers, function(user) {
                    return user.username == changes.updatedBy.username;
                });
                if (userIndex === -1) {
                    updates.push(p.insert("array-node('subscribers')", 'last-child', changes.updatedBy))
                }
                break;
            case 'svninfo':
                if (true) {
                    // TODO
                }
                break;
            default:
                break;
                // do nothing
        }

    }

    if (Object.keys(req.files).length > 0) {
        for (var file in req.files) {
            var fileObj = {
                name: req.files[file].originalname,
                uri: '/bug/' + to.id + '/attachments/' + req.files[file].originalname
            }
            updates.push(p.insert("array-node('attachments')", 'last-child', fileObj));
            changes.files.push(fileObj);
        }
    }


    if (Object.keys(req.files).length > 0) {
        for (var file in req.files) {
            console.log(req.files[file]);
            var doc = {
                uri: '/bug/' + to.id + '/attachments/' + req.files[file].originalname,
                category: 'content',
                contentType: req.files[file].mimetype,
                content: fs.createReadStream(req.files[file].path)
            };

            db.documents.write(doc).result(function(response) {
                console.log('wrote:\n ', JSON.stringify(response.documents[0]));
                // res.send(200);
            }, function(error) {
                errors = true;
                res.send(400, {
                    message: 'file upload failed. Try again'
                });
            });
        }

        for (var i in req.files) {
            // delete file from uploads dir after successfull upload
            fs.unlink(req.files[i].path, function(err) {
                if (err) throw err;
            });
        }
    }

    updates.push(p.insert("array-node('changeHistory')", 'last-child', changes))

    db.documents.patch(uri, updates).result(function(response) {
        res.status(200).json({
            message: 'bug updated'
        })
    }, function(error) {
        console.log(error);
        res.status(500).json({
            message: 'bug update failed\n' + error
        })
    });

};


exports.subscribe = function(req, res) {
    console.log('subscribe', req.body);
    var uri = '/bug/' + req.body.id + '/' + req.body.id + '.json';
    db.documents.patch(uri, p.insert("array-node('subscribers')", 'last-child', req.body.user)).result(function(response) {
        res.status(200).json({
            message: 'Bug subscribed'
        })
    }, function(error) {
        res.status(error.statusCode).json(JSON.stringify(error));
    });
};


exports.unsubscribe = function(req, res) {
    console.log('unsubscribe', req.body);
    var uri = '/bug/' + req.body.id + '/' + req.body.id + '.json';
    db.documents.patch(uri, p.remove("subscribers[username eq '" + req.body.user.username + "']")).result(function(response) {
        res.status(200).json({
            message: 'Bug unsubscribed'
        })
    }, function(error) {
        res.status(400).json({
            message: error
        });
    });
};

exports.clone = function(req, res) {
    console.log('cloning ');
    console.log('parent', req.body.parent);
    console.log('clone', req.body.clone);
    var bugs = [{
        uri: '/bug/' + req.body.parent.id + '/' + req.body.parent.id + '.json',
        category: 'content',
        contentType: 'application/json',
        collections: ['bugs', req.body.parent.submittedBy.username],
        content: req.body.parent
    }, {
        uri: '/bug/' + req.body.clone.id + '/' + req.body.clone.id + '.json',
        category: 'content',
        contentType: 'application/json',
        collections: ['bugs', req.body.clone.submittedBy.username],
        content: req.body.clone
    }]
    db.documents.write(bugs).result(function(response) {
        res.status(200).json({
            message: 'Clone successfull'
        });
    }, function(error) {
        res.status(error.statusCode).json({
            message: 'Clone failed' + '\n' + JSON.stringify(error)
        })
    })

};

exports.newbugid = function(req, res) {
    db.documents.read('count.json').result(function(response) {
        console.log('count:', response);
        res.status(200).json(response)
    }, function(error) {
        console.log('error:', error);
        res.status(error.statusCode).json(JSON.stringify(error));
    })
};


exports.clones = function(req, res) {
    var uri = '/bug/' + req.params.id + '/' + req.params.id + '.json'
    console.log('URI', uri);
    db.documents.read({
        uris: [uri]
    }).result(function(document) {
        console.log('document', document);
        var clones = document[0].content.clones.sort();
        var cloneDocUris = [];
        if (clones.length > 0) {
            for (var i = 0; i < clones.length; i++) {
                cloneDocUris.push('/bug/' + clones[i] + '/' + clones[i] + '.json')
            }
        }

        if (cloneDocUris.length > 0) {
            db.documents.read({
                uris: cloneDocUris
            }).result(function(documents) {
                console.log('documents', documents);
                clones = [];
                if (documents.length > 0) {
                    for (var i = 0; i < documents.length; i++) {
                        clones.push({
                            id: documents[i].content.id,
                            title: documents[i].content.title,
                            status: documents[i].content.status,
                            category: documents[i].content.category,
                            severity: documents[i].content.severity,
                            priority: documents[i].content.priority,
                            version: documents[i].content.version,
                            tofixin: documents[i].content.tofixin,
                            fixedin: documents[i].content.fixedin,
                            assignTo: documents[i].content.assignTo
                        })
                    }
                }

                res.status(200).json(clones)
            }, function(error) {
                res.status(error.statusCode).json(error)
            })
        } else {
            res.status(200).json([])
        }

    }, function(error) {
        res.status(error.statusCode).json(error);
    })
};