'use strict';

var app = angular.module('rfe.services', []);

app.service('RFE', ['$http',
    function($http) {
        this.getCurrentUserTasks = function(user) {
            if (user) {
                var searchCriteria = {
                    kind: {
                        RFE: true
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


        this.create = function(rfe, files) {
            return $http({
                url: '/api/rfes/new',
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('rfe', angular.toJson(rfe));
                    for (var i = 0; i < data.files.length; i++) {
                        //console.log('FORM', data.files[i]);
                        form.append('file' + i, data.files[i]);
                    }
                    return form;
                },
                data: {
                    rfe: rfe,
                    files: files
                }
            });
        };


        this.update = function(rfe, old, files) {
            return $http({
                url: '/api/rfes/update',
                method: 'PUT',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function(data) {
                    var form = new FormData();
                    form.append('rfe', angular.toJson(rfe));
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
                    rfe: rfe,
                    old: old,
                    files: files
                }
            });
        };


        this.subscribe = function(subscribe) {
            return $http({
                method: 'PUT',
                url: '/api/rfes/' + subscribe.id + '/subscribe',
                data: subscribe
            });
        };

        this.unsubscribe = function(unsubscribe) {
            return $http({
                method: 'PUT',
                url: '/api/rfes/' + unsubscribe.id + '/unsubscribe',
                data: unsubscribe
            });
        };



        this.get = function(id) {
            return $http({
                method: 'GET',
                url: '/api/rfes/' + id
            });
        };


        this.count = function() {
            console.log('getting task count');
            return $http({
                method: 'GET',
                url: '/api/rfes/count'
            });
        };



        this.getParentAndSubTasks = function(version) {
            if (version === 'n/a') {
                version = 'all';
            }
            return $http({
                method: 'GET',
                url: '/api/rfes/' + version + '/parentAndSubTasks'
            });
        };



        this.getSubTasks = function(id) {
            return $http({
                method: 'GET',
                url: '/api/rfes/' + id + '/subtasks'
            });
        };

        this.insertProceduralTask = function(parentTaskId, proceduralTaskType, proceduralTaskId) {
            return $http({
                method: 'PUT',
                url: '/api/rfes/insertProceduralTask',
                data: {
                    parentTaskId: parentTaskId,
                    proceduralTaskType: proceduralTaskType,
                    proceduralTaskId: proceduralTaskId
                }
            });
        };

        this.insertSubTask = function(parentTaskId, subTaskId) {
            return $http({
                method: 'PUT',
                url: '/api/rfes/insertSubTask',
                data: {
                    parentTaskId: parentTaskId,
                    subTaskId: subTaskId
                }
            });
        };

    }
]);