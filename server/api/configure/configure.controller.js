'use strict';

var fs = require('fs');
var flash = require('connect-flash');
var marklogic = require('marklogic');
var conn = require('../../config/db-config.js').connection;
var db = marklogic.createDatabaseClient(conn);
var q = marklogic.queryBuilder;
var p = marklogic.patchBuilder;
var maxLimit = 99999999;
var uri = 'config.json'
var _ = require('lodash');

// Get list of configureable items
exports.index = function(req, res) {
    db.documents.read('config.json').result(function(document) {
        if (document[0]) {
            //  console.log(Object.keys(document[0].content));
            res.status(200).json(document[0].content)
        } else {
            res.status(404).json({
                message: uri + ' not found'
            })
        }
    }, function(error) {
        res.json({
            message: error
        })
    })

};


// update configure options
exports.update = function(req, res) {
    console.log('config req.body', req.body);
    if (req.body.items) {
        var operations = [];
        if (req.body.operation === 'add') {
            //  you can add only one item at once, items array will always contains only one item, 
            //  hence always accesses first item 
            var option = (req.body.category === 'groups') ? {
                label: req.body.items,
                value: req.body.items,
                children: []
            } : req.body.items;
            operations = [p.insert("array-node('" + req.body.category + "')", 'last-child', option)];
        }
        if (req.body.operation === 'delete') {
            for (var i = 0; i < req.body.items.length; i++) {
                (req.body.category === 'groups') ? operations.push(p.remove(req.body.category + "[ value eq '" + JSON.parse(req.body.items[i]).value + "']")) :
                    operations.push(p.remove(req.body.category + "[. eq '" + req.body.items[i] + "']"));
            }
        }

        db.documents.patch({
            uri: uri,
            operations: operations
        }).result(function() {
            res.status(200).json({
                message: 'config updated'
            })
        }, function(error) {
            res.status(error.statusCode).json(error)
        })
    } else {
        res.status(304).json({
            message: 'cannot update config with empty value'
        });
    }

};



exports.adduserstogroup = function(req, res) {
    console.log('body: ', req.body);
    if (req.body.users.length > 0 && req.body.group) {
        db.documents.read(uri).result(function(document) {
            var operations = [];
        var children = []
        for (var i = 0; i < req.body.users.length; i++) {
            try {
                //when users are added to the group
                var userInfo = JSON.parse(req.body.users[i]);
                var user = {
                    label: userInfo.name,
                    value: userInfo,
                    parent: req.body.group
                }
                console.log('user:', user);
                operations.push(p.insert("groups[value ='" + req.body.group + "']/array-node('children')", 'last-child', user))
                // when a user is add to a  group, update all groups that contain this group as child
                operations.push(p.insert("children[label eq '" + req.body.group + "']/array-node('children')", 'last-child', user));
            } catch (e) {
                // when group is added to another group
                var groupName = req.body.users[i];
                console.log('groups:', groupName);
                    var groups = document[0].content.groups;
                    console.log('groups', groups);
                    children = _.result(_.findWhere(groups, {
                        value: groupName
                    }), 'children');
                    console.log('children', children);
                    var group = {
                        label: groupName,
                        value: groupName,
                        children: children,
                        parent: req.body.group
                    }
                    console.log(req.body);
                    operations.push(p.insert("groups[value ='" + req.body.group + "']/array-node('children')", 'last-child', group))
                    // when a group is add to another  group, update all groups that contain this group as child
                    operations.push(p.insert("children[label eq '" + req.body.group + "']/array-node('children')", 'last-child', group));
            }
        }

        if (operations.length > 0) {
            db.documents.patch({
                uri: uri,
                operations: operations
            }).result(function() {
                res.status(200).json({
                    message: 'config updated'
                })
            }, function(error) {
                res.status(error.statusCode).json(error)
            })
        }
        }, function(error) {
            res.status(error.statusCode).json(error.body.errorResponse.message)
        })
        
    } else {
        res.status(304).json({
            message: 'cannot add empty values'
        });
    }
  
}


exports.removeusersfromgroup = function(req, res) {

}