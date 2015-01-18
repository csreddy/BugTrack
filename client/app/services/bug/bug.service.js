'use strict';

var app = angular.module('bug.services', []);

app.service('Bug', ['$http',
    function($http) {
        // AngularJS will instantiate a singleton by calling 'new' on this function
        this.search = function(criteria) {
            return $http({
                method: 'POST',
                url: '/api/search',
                data: criteria
            });
        };


        this.getCurrentUserBugs = function(user) {
            if (user) {
                var searchCriteria = {
                    kind: {
                        Bug: true
                    },
                    assignTo: user.username,
                    facets: {}
                };
                return $http({
                    method: 'POST',
                    url: '/api/search',
                    data: searchCriteria
                });
            }

        };


        this.create = function(bug, files) {
            return $http({
                url: '/api/bug/new',
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('bug', angular.toJson(bug));
                    for (var i = 0; i < data.files.length; i++) {
                        console.log('FORM', data.files[i]);
                        form.append('file' + i, data.files[i]);
                    }
                    return form;
                },
                data: {
                    bug: bug,
                    files: files
                }
            });
        };


        this.update = function(bug, files) {
            return $http({
                url: '/api/bug/new',
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('bug', angular.toJson(bug));
                    if (data.files) {
                        for (var i = 0; i < data.files.length; i++) {
                            console.log('FORM', data.files[i]);
                            form.append('file' + i, data.files[i]);
                        }
                    }
                    return form;
                },
                data: {
                    bug: bug,
                    files: files
                }
            });
        };

        this.clone = function(payload) {
            console.log('inside updateBug()');
            var payloadForUpdate = {};
            payloadForUpdate.bug = payload;
            return $http({
                method: 'POST',
                url: '/api/bug/new',
                data: payloadForUpdate
            });
        };


        this.get = function(id) {
            return $http({
                method: 'GET',
                url: '/api/bug/' + id
            });
        };


        this.count = function() {
            return $http({
                method: 'GET',
                url: '/api/bug/count'
            });
        };

        this.getFacets = function() {
            return $http({
                method: 'GET',
                url: '/bug/facets'
            });
        };


    }
]);