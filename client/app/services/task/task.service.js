'use strict';

var app = angular.module('task.services', []);

app.service('Task', ['$http',
    function($http) {
         this.getNewId = function() {
            return $http({
                method: 'GET',
                url: '/api/common/nextId'
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


        this.insertProceduralTask = function(parentTaskId, proceduralTaskType, proceduralTaskId) {
            return $http({
                method: 'PUT',
                url: '/api/tasks/insertProceduralTask',
                data: {
                    parentTaskId: parentTaskId,
                    proceduralTaskType: proceduralTaskType,
                    proceduralTaskId: proceduralTaskId
                }
            });
        };

        this.insertSubTask = function(parentTaskId, subTaskId, taskOrRfe) {
            return $http({
                method: 'PUT',
                url: '/api/tasks/insertSubTask',
                data: {
                    taskOrRfe: taskOrRfe,
                    parentTaskId: parentTaskId,
                    subTaskId: subTaskId
                }
            });
        };

        this.createSubTask = function(parentTaskId, subTask, taskOrRfe) {
            return $http({
                method: 'POST',
                url: '/api/tasks/createSubTask',
                data: {
                    taskOrRfe: taskOrRfe,
                    parentTaskId: parentTaskId,
                    subTask: subTask
                }
            });
        };

        this.getParentAndSubTasks = function(version) {
            if (version === 'n/a') {
                version = 'all';
            }
            return $http({
                method: 'GET',
                url: '/api/tasks/' + version + '/parentAndSubTasks'
            });
        };



        this.getSubTasks = function(id, taskOrRfe) {
            var taskOrRfe = taskOrRfe || 'task';
            return $http({
                method: 'GET',
                url: '/api/' + taskOrRfe + 's/' + id + '/subtasks'
            });
        };

        this.toggleTaskListInclusion = function(id, bool, taskOrRfe) {
             var taskOrRfe = taskOrRfe || 'task';
            return $http({
                method: 'PUT',
                url: '/api/tasks/' + id + '/toggleTaskListInclusion',
                data: {
                    id: id,
                    includeInTaskList: bool,
                    taskOrRfe: taskOrRfe
                }
            });
        };

    }
]);