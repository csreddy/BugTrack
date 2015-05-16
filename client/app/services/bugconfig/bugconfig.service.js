'use strict';

var app = angular.module('config.services', ['ivh.treeview']);

app.factory('Config', ['$http','ivhTreeviewMgr',
    function($http, ivhTreeviewMgr) {
        // Service logic
        function update(category, items, operation) {
            return $http({
                method: 'PUT',
                url: '/api/configure/update',
                data: {
                    category: category,
                    items: items,
                    operation: operation
                }
            });
        }

        function get() {
            return $http({
                method: 'GET',
                url: '/api/configure'
            });
        }

        function insert(payload) {
            return $http({
                method: 'PUT',
                url: '/api/configure/update',
                data: payload
            });
        }

        function createUser(user) {
            return $http({
                method:'PUT',
                url: '/api/configure/createuser',
                data: user
            });
        }

        function addUsersToGroup(group, users) {
            return $http({
                method: 'PUT',
                url: '/api/configure/adduserstogroup',
                data: {
                    group: group,
                    users: users
                }
            });
        }

        function removeUsersFromGroup(users) {
            console.log('users', users);
            return $http({
                method: 'PUT',
                url: '/api/configure/removeusersfromgroup',
                data: {
                    users: users
                }
            });
        }

        function expandGroups (groups) {
           ivhTreeviewMgr.expandRecursive(groups);
        }
        function collapseGroups (groups) {
           ivhTreeviewMgr.collapseRecursive(groups);
        }

        function importGithubIssues (project) {
            return $http({
                method: 'GET',
                url: '/api/github/issues?project='+project+'&interval=false&import=true'
            });
        }
        function importSingleGithibIssue (project, id) {
            return $http({
                method: 'GET',
                url: '/api/github/issue?project='+project+'&id='+id + '&import=true'
            });
        }

        function goto (id) {
            return $http({
                method: 'GET',
                uri: '/api/common/goto?id='+id
            });
        }

        function getUnImportedIssues() {
            return $http({
                method:'GET',
                url: '/api/github/'
            });
        }


        // Public API here
        return {
            insert: function(payload) {
                console.log('inside insertConfig', payload);
                insert(payload);
            },
            createUser: function(user) {
                return createUser(user);
            },
            update: function(category, item, operation) {
                return update(category, item, operation);
            },
            get: function() {
                return get();
            },
            addUsersToGroup: function(group, users) {
                return addUsersToGroup(group, users);
            },
            removeUsersFromGroup: function(group, users, tree) {
                return removeUsersFromGroup(group, users, tree);
            },
            expandGroups: function(groups) {
                return expandGroups(groups);
            },
            collapseGroups: function(groups) {
                return collapseGroups(groups);
            },
            importGithubIssues: function(project) {
                return importGithubIssues(project);
            },
            importSingleGithibIssue: function(project, id) {
                return importSingleGithibIssue(project, id);
            },
            goto: function(id) {
                return goto(id);
            },
            getUnImportedIssues: function () {
                return getUnImportedIssues();
            }
        };
    }
]);