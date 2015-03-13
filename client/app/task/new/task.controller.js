'use strict';

angular.module('task.controllers', ['angularFileUpload', 'textAngular', 'ngProgress'])
    .controller('newTaskCtrl', ['$scope','$q', '$location', 'config', 'currentUser', 'count', 'Task', 'Flash', 'ngProgress',
        function($scope, $q, $location, config, currentUser, count, Task, Flash, ngProgress) {
            $scope.task = {};
            $scope.task.parent = {};
            $scope.task.period = {
                startDate: stringify(new Date()),
                endDate: null
            };
            $scope.config = {};
            $scope.config = config.data;
            $scope.accordion = {};
            $scope.accordion.status = {
                isFirstOpen: true,
                isFirstDisabled: false
            };

            $scope.task.files = [];
            $scope.task.days = 1;
            $scope.relatedTo = [];
            $scope.relationTypes = [
                'Requirements Task',
                'Functional Specification Task',
                'Test Specification Task',
                'Test Automation Task',
                'Documentation Task',
                'Sub-task'
            ];

            $scope.statuses = ['Not Yet Started', 'In Progress', 'Completed'];


            $scope.days = _.range(1, 101);


            // for calendar   
            $scope.cal = {
                open: function(when, $event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.cal.fromOpened = (when === 'from') ? true : false;
                    $scope.cal.toOpened = (when === 'to') ? true : false;
                },
                format: 'MM-dd-yyyy'
            };

            $scope.$watch('task.period', function() {
                console.log($scope.task.period);
            }, true);

            //listen for the file selected event
            $scope.$on('fileSelected', function(event, args) {
                $scope.$apply(function() {
                    //add the file object to the scope's files collection
                    $scope.task.files.push(args.file);
                });
            });

            $scope.createNewTask = function() {
                if ($scope.taskForm.$valid) {
                    // Submit as normal
                    submitTask();
                } else {
                    $scope.taskForm.submitted = true;
                }
            };


            this.submitTask = function() {
                submitTask();
            };

            this.stringify = function(date) {
                stringify(date);
            };


            /* private functions */
            function submitTask() {
                console.log('submit new task');
                ngProgress.start();
                Task.count().success(function(response) {
                    var task = {};
                    task.id = response.count + 1;
                    task.kind = 'Task';
                    task.title = $scope.task.title;
                    task.description = $scope.task.description;
                    task.days = $scope.task.days;
                    if ($scope.task.period.startDate > new Date()) {
                        task.status = $scope.statuses[0];
                    }
                    if ($scope.task.period.startDate <= new Date()) {
                        task.status = $scope.statuses[1];
                    }


                    task.period = $scope.task.period;
                    task.priority = $scope.task.priority;
                    task.category = $scope.task.category;
                    task.severity = $scope.task.severity;
                    task.version = $scope.task.version;
                    task.tofixin = $scope.task.tofixin;
                    task.parent = $scope.task.parent;
                    task.submittedBy = {
                        username: currentUser.username,
                        email: currentUser.email,
                        name: currentUser.name
                    };
                    task.assignTo = $scope.task.assignTo;
                    task.subscribers = [];
                    task.subscribers.push(task.submittedBy);
                    if (task.assignTo.username !== task.submittedBy.username) {
                        task.subscribers.push(task.assignTo);
                    }
                    task.attachments = [];
                    console.log('task', task);
                    for (var i = 0; i < $scope.task.files.length; i++) {
                        task.attachments[i] = {
                            name: $scope.task.files[i].name,
                            uri: '/task/' + task.id + '/attachments/' + $scope.task.files[i].name
                        };
                    }
                    task.subTasks = [];
                    task.proceduralTasks = {
                        'Requirements Task': [],
                        'Functional Specification Task': [],
                        'Test Specification Task': [],
                        'Test Automation Task': [],
                        'Documentation Task': []
                    };
                    task.createdAt = new Date();
                    task.modifiedAt = new Date();
                    task.changeHistory = [];
                    var updates = [Task.create(task, $scope.task.files).then()];
                    if (task.parent.id) {
                        if ($scope.relationTypes.indexOf(task.parent.type) > -1 && task.parent.type !== 'Sub-task') {
                            updates.push(Task.insertProceduralTask(task.parent.id, task.parent.type, task.id).then());
                        } else {
                            updates.push(Task.insertSubTask(task.parent.id, task.id).then())
                        }
                    }

                    $q.all(updates).then(function(response) {
                        ngProgress.complete();
                        $location.path('/task/' + task.id);
                        Flash.addAlert('success', '<a href=\'/task/' + task.id + '\'>' + 'Task-' + task.id + '</a>' + ' was successfully created');
                    }, function(error) {
                        Flash.addAlert('danger', 'Oops! Could not create the task. Please try again.')
                    });
                }).error(function(error) {
                    Flash.addAlert('danger', 'Oops! cound not get task count')
                });

            }

            function stringify(d) {
                var dateStr = d.getFullYear() + '-';
                var month = d.getMonth() + 1;
                dateStr = (month < 10) ? dateStr + '0' + month + '-' : dateStr + month + '-';
                dateStr = (d.getDate() < 10) ? dateStr + '0' + d.getDate() : dateStr + d.getDate();
                return dateStr;
            }
        }
    ]);