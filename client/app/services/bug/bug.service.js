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

        this.getNewId = function() {
            return $http({
                method: 'GET',
                url: '/api/bug/newbugid'
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
                        //console.log('FORM', data.files[i]);
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


        this.update = function(bug, old, files) {
            return $http({
                url: '/api/bug/update',
                method: 'PUT',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('bug', angular.toJson(bug));
                    form.append('old', angular.toJson(old));
                    if (data.files) {
                        for (var i = 0; i < data.files.length; i++) {
                            //console.log('FORM', data.files[i]);
                            form.append('file' + i, data.files[i]);
                        }
                    }
                    return form;
                },
                data: {
                    bug: bug,
                    old: old,
                    files: files
                }
            });
        };


        this.subscribe = function(subscribe) {
            return $http({
                method: 'PUT',
                url: '/api/bug/' + subscribe.id + '/subscribe',
                data: subscribe
            });
        };

        this.unsubscribe = function(unsubscribe) {
            return $http({
                method: 'PUT',
                url: '/api/bug/' + unsubscribe.id + '/unsubscribe',
                data: unsubscribe
            });
        };

        this.clone = function(parent, clone) {
            console.log('inside clone()');
            var data = {
                parent: parent,
                clone: clone
            };
            return $http({
                method: 'POST',
                url: '/api/bug/clone',
                data: data
            });
        };

        this.getClones = function(id) {
            return $http({
                method: 'GET',
                url: '/api/bug/' + id + '/clones'
            });
        };


        this.get = function(id) {
            return $http({
                method: 'GET',
                url: '/api/bug/' + id
            });
        };


        this.count = function() {
            console.log('getting bug count');
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



        this.watch = function(scope, object) {
            scope.$watch(object, function() {
                if (scope[object] !== undefined) {
                    var note = object + ' changed from ' + scope.bug[object] + ' to ' + scope[object];
                  //  console.log(note);
                    scope.changes[object] = {
                        'from': scope.bug[object],
                        'to': scope[object]
                    };
                }
            }, true);
        };


    }
]);