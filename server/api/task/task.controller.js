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
    name: 'Task',
    serializers: {
        req: bunyan.stdSerializers.req
    }
});
var _ = require('lodash');

// Get list of tasks
exports.index = function(req, res) {
    res.json([]);
};

// get task count
// get bug count
exports.count = function(req, res) {
    res.locals.errors = req.flash();

    db.documents.query(
        q.where(
            q.collection('tasks')
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

// get task details by id
exports.id = function(req, res) {
    res.locals.errors = req.flash();
    console.log(res.locals.errors);
    var uri = '/task/' + req.params.id + '/' + req.params.id + '.json';
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
                error: 'could not find task ' + req.params.id
            });
        }
    }, function(error) {
        res.status(error.statusCode).json({
            error: 'could not find task ' + req.params.id
        });
    })

};

exports.new = function(req, res) {
    'use strict';
    console.log('inside NEW TASK');
    console.log('BODY', req.body);
    //console.log('FILES', req.files);
    var attachments = req.files;
    var errors = false;
    var id;
    var collections = ['tasks'];
    if (typeof req.body.task === 'object') {
        id = req.body.task.id;
        collections.push(req.body.task.submittedBy.username);
    } else {
        id = JSON.parse(req.body.task).id;
        collections.push(JSON.parse(req.body.task).submittedBy.username);
    }
    var uri = '/task/' + id + '/' + id + '.json';
    db.documents.write([{
        uri: uri,
        category: 'content',
        contentType: 'application/json',
        collections: collections,
        content: req.body.task
    }]).result(function(response) {
        console.log('wrote:\n    ' +
            response.documents.map(function(document) {
                return document.uri;
            }).join(', ')
        );
        res.send(200);
    }, function(error) {
        res.status(error.statusCode).json(error);
    });

    for (var file in attachments) {
        console.log(attachments[file]);
        var doc = {
            uri: '/task/' + id + '/attachments/' + attachments[file].originalname,
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
    var to = JSON.parse(req.body.task);
    var file = req.files;
    var uri = '/task/' + from.id + '/' + from.id + '.json';
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
                if (from.status && from.status !== to.status) {
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
            case 'days':
                if (from.days !== to.days) {
                    updates.push(p.replace('/days', to.days));
                    changes.change.days = {
                        from: from.days,
                        to: to.days
                    };
                }
                break;
                case 'period':
                if (from.period.startDate !== to.period.startDate) {
                    updates.push(p.replace('/period/startDate', to.period.startDate));
                     changes.change.startDate = {
                        from: from.period.startDate,
                        to: to.period.startDate
                    };
                }
                if (from.period.endDate !== to.period.endDate) {
                    updates.push(p.replace('/period/endDate', to.period.endDate));
                     changes.change.endDate = {
                        from: from.period.endDate,
                        to: to.period.endDate
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
                uri: '/task/' + to.id + '/attachments/' + req.files[file].originalname
            }
            updates.push(p.insert("array-node('attachments')", 'last-child', fileObj));
            changes.files.push(fileObj);
        }
    }


    if (Object.keys(req.files).length > 0) {
        for (var file in req.files) {
            console.log(req.files[file]);
            var doc = {
                uri: '/task/' + to.id + '/attachments/' + req.files[file].originalname,
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
            message: 'task updated'
        })
    }, function(error) {
        console.log(error);
        res.status(500).json({
            message: 'task update failed\n' + error
        })
    });

};

exports.insertProceduralTask = function(req, res) {
    var uri = '/task/' + req.body.parentTaskId + '/' + req.body.parentTaskId + '.json';
    db.documents.probe(uri).result(function(response) {
        if (response.exists) {
            db.documents.patch(uri, p.insert("proceduralTasks/array-node(\"" + req.body.proceduralTaskType + "\")", 'last-child', parseInt(req.body.proceduralTaskId))).result(function(response) {
                res.status(200).json({
                    message: 'Procedural Task inserted'
                })
            }, function(error) {
                res.status(error.statusCode).json(error);
            });
        } else {
            res.status(404).json({
                message: 'Parent task ' + req.body.parentTaskId + ' does not exist'
            })
        }
    });


};


exports.insertSubTask = function(req, res) {
    var uri = '/task/' + req.body.parentTaskId + '/' + req.body.parentTaskId + '.json';
    db.documents.probe(uri).result(function(response) {
        if (response.exists) {
            db.documents.patch(uri, p.insert("array-node('subTasks')", 'last-child', parseInt(req.body.subTaskId))).result(function(response) {
                res.status(200).json({
                    message: 'Sub Task inserted'
                })
            }, function(error) {
                res.status(error.statusCode).json(error);
            });
        } else {
            res.status(404).json({
                message: 'Parent task ' + req.body.parentTaskId + ' does not exist'
            })
        }
    });



};

exports.createSubTask = function(req, res) {
    var parentTaskUri = '/task/' + req.body.parentTaskId + '/' + req.body.parentTaskId + '.json';
    var subTaskUri = '/task/' + req.body.subTask.id + '/' + req.body.subTask.id + '.json';
    db.documents.probe(parentTaskUri).result(function(response) {
        if (response.exists) {
            var transactionId = null;
            db.transactions.open().result().then(function(response) {
                transactionId = response.txid;
            }).then(function() {
                console.log('write ' + subTaskUri);
                return db.documents.write({
                    uri: subTaskUri,
                    contentType: 'application/json',
                    content: req.body.subTask,
                    collections: [req.body.subTask.submittedBy.username, 'tasks'],
                    txid: transactionId
                }).result();
            }).then(function() {
                console.log('write ' + parentTaskUri);
                return db.documents.patch({
                    uri: parentTaskUri,
                    operations: [p.insert("array-node('subTasks')", 'last-child', parseInt(req.body.subTask.id))],
                    txid: transactionId
                }).result();
            }).then(function() {
                return db.transactions.commit(transactionId).result(function() {
                    res.status(200).json({
                        message: 'Created Sub Task'
                    });
                }, function(error) {
                    res.status(error.statusCode).json(error.body.errorResponse)
                });
            }).catch(function(error) {
                db.transactions.rollback(transactionId);
                log.info(JSON.stringify(error));
                res.send(error.statusCode).json(error);
            })
        } else {
            res.status(404).json({
                message: 'Parent task ' + req.body.parentTaskId + ' does not exist'
            })
        }
    });
};

exports.subtasks = function(req, res) {
    var uri = '/task/' + req.params.id + '/' + req.params.id + '.json'
    console.log('URI', uri);
    db.documents.read({
        uris: [uri]
    }).result(function(document) {
        console.log('document', document);
        var subTasks = document[0].content.subTasks.sort();
        var subTaskDocUris = [];
        if (subTasks.length > 0) {
            for (var i = 0; i < subTasks.length; i++) {
                subTaskDocUris.push('/task/' + subTasks[i] + '/' + subTasks[i] + '.json')
            }
        }

        if (subTaskDocUris.length > 0) {
            db.documents.read({
                uris: subTaskDocUris
            }).result(function(documents) {
                subTasks = [];
                if (documents.length > 0) {
                    for (var i = 0; i < documents.length; i++) {
                        subTasks.push({
                            id: documents[i].content.id,
                            title: documents[i].content.title
                        })
                    }
                }

                res.status(200).json(subTasks)
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

exports.subscribe = function(req, res) {
    var uri = '/task/' + req.body.id + '/' + req.body.id + '.json';
    db.documents.patch(uri, p.insert("array-node('subscribers')", 'last-child', req.body.user)).result(function(response) {
        res.status(200).json({
            message: 'Task subscribed'
        })
    }, function(error) {
        res.status(error.statusCode).json(JSON.stringify(error));
    });
};


exports.unsubscribe = function(req, res) {
    console.log('unsubscribe', req.body);
    var uri = '/task/' + req.body.id + '/' + req.body.id + '.json';
    db.documents.patch(uri, p.remove("subscribers[username eq '" + req.body.user.username + "']")).result(function(response) {
        res.status(200).json({
            message: 'Task unsubscribed'
        })
    }, function(error) {
        res.status(400).json({
            message: error
        });
    });
};


exports.getAllParentTasks = function(req, res) {
    var version = req.params.version;
    db.documents.query(
        q.where(
            [q.collection('tasks'), q.value('tofixin', version), q.scope('parent', q.value('taskId', ''))]
        )
        .orderBy(
            q.sort('id', 'ascending')
        )
        .slice(1, 100)
        .withOptions({
            debug: true,
            queryPlan: true,
            metrics: true,
            category: 'content'
        })
    ).result(function(result) {
        res.status(200).json(result)
    }, function(error) {
        res.status(error.statusCode).json(error);
    })
};