'use strict';

var app = angular.module('task.services', []);

app.service('Task', ['$http',
    function($http) {
        // AngularJS will instantiate a singleton by calling 'new' on this function
        this.search = function(criteria) {
            return $http({
                method: 'POST',
                url: '/api/search',
                data: criteria
            });
        };


        this.getCurrentUserTasks = function(user) {
            if (user) {
                var searchCriteria = {
                    kind: {
                        Task: true
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


        this.create = function(task, files) {
            return $http({
                url: '/api/tasks/new',
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('task', angular.toJson(task));
                    for (var i = 0; i < data.files.length; i++) {
                        //console.log('FORM', data.files[i]);
                        form.append('file' + i, data.files[i]);
                    }
                    return form;
                },
                data: {
                    task: task,
                    files: files
                }
            });
        };


        this.update = function(task, old, files) {
            return $http({
                url: '/api/tasks/update',
                method: 'PUT',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('task', angular.toJson(task));
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
                    task: task,
                    old: old,
                    files: files
                }
            });
        };


        this.subscribe = function(subscribe) {
            return $http({
                method: 'PUT',
                url: '/api/tasks/' + subscribe.id + '/subscribe',
                data: subscribe
            });
        };

        this.unsubscribe = function(unsubscribe) {
            return $http({
                method: 'PUT',
                url: '/api/tasks/' + unsubscribe.id + '/unsubscribe',
                data: unsubscribe
            });
        };



        this.get = function(id) {
            return $http({
                method: 'GET',
                url: '/api/tasks/' + id
            });
        };


        this.count = function() {
            console.log('getting task count');
            return $http({
                method: 'GET',
                url: '/api/tasks/count'
            });
        };



        this.watch2 = function(scope, task) {
            var props = ['status', 'priority', 'severity', 'category', 'version', 'tofixin', 'fixedin', 'assignTo'];
            var oldTaskValues = angular.copy(task);
            angular.forEach(props, function(value, index) {
                if (scope.task[value]) {
                    scope.task.changes[value] = {
                        'from': oldTaskValues[value],
                        'to': scope.task[value]
                    };
                }
            });
        }

        this.watch = function(scope, object) {
            scope.$watch(object, function() {
                if (scope[object] !== undefined) {
                    var note = object + ' changed from ' + scope.task[object] + ' to ' + scope[object];
                    console.log(note);
                    scope.task.changes[object] = {
                        'from': scope.task[object],
                        'to': scope[object]
                    };
                }
            }, true);


        };

    }
]);