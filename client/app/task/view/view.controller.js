'use strict';

angular.module('task.controllers')
    .controller('viewTaskCtrl', ['$scope', '$location', '$timeout', '$q', 'Task', 'SubTasks','config', 'Flash', 'currentUser', 'modalService', 'ngProgress',

        function($scope, $location, $timeout, $q, Task, SubTasks, config, Flash, currentUser, modalService, ngProgress) {

            $scope.changes = {};
            $scope.updatedBy = currentUser || {};
            $scope.showSubscribe = true;
            $scope.showUnsubscribe = false;
            $scope.config = config.data || {};
            $scope.hasAttachments = false;
            $scope.accordion = {};
            $scope.accordion.status = {
                isFirstOpen: true,
                isFirstDisabled: false
            };
            $scope.proceduralTaskTypes = [
                'Requirements Task',
                'Functional Specification Task',
                'Test Specification Task',
                'Test Automation Task',
                'Documentation Task'
            ];
            $scope.relationTypes = [
                'Requirements Task',
                'Functional Specification Task',
                'Test Specification Task',
                'Test Automation Task',
                'Documentation Task',
                'Sub-task'
            ];
            $scope.newSubTask = {};
            var oldCopy;
            var id = $location.path().replace('/task/', '');

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


            Task.get(id).then(function(response) {

                    $scope.task = response.data;
                    oldCopy = angular.copy(response.data);

                    // need specical handling for 'priority' and 'assignTo' for 
                    // pre-selecting values and binding selection from the UI to model
                    // in dropdown becuase the model is object and not string
                    var index = _.findIndex($scope.config.priority, $scope.task.priority);
                    $scope.task.priority = $scope.config.priority[index];
                    index = _.findIndex($scope.config.users, $scope.task.assignTo);
                    $scope.task.assignTo = $scope.config.users[index];

                    // if the current user has already subscribed then show Unsubscribe else show Subscribe
                    var subscribers = $scope.task.subscribers;
                    for (var i = 0; i < subscribers.length; i++) {
                        if (subscribers[i].username === currentUser.username) {
                            $scope.showSubscribe = false;
                            $scope.showUnsubscribe = true;
                            break;
                        }
                    }
                    // if the current user is task reporter or task assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed by default and not allowed to unsubscribe
                    if (currentUser.username === $scope.task.assignTo.username || currentUser.username === $scope.task.submittedBy.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    }

                    if ($scope.task.attachments.length > 0) {
                        $scope.hasAttachments = true;
                    }

                   $scope.task.subTasks = SubTasks.data;
                   $scope.allProceduralTasks  = getAllProceduralTasks($scope.task.proceduralTasks);
                  
                   // watch for fields in modal form
                   $scope.$on('newItem', function(event, newItem) {
                        $scope.newSubTask = newItem;
                   });

                },
                function(error) {
                    if (error.status === 404) {
                        $location.path('/404');
                        Flash.addAlert('danger', 'Task not found');
                    } else {
                        Flash.addAlert('danger', error.data.error.message);
                    }

                });

            //an array of files selected
            $scope.files = [];

            //listen for the file selected event
            $scope.$on('fileSelected', function(event, args) {
                $scope.$apply(function() {
                    //add the file object to the scope's files collection
                    $scope.files.push(args.file);
                });
            });

            // update task 
            $scope.updateTask = function() {
                ngProgress.start();

                $scope.task.updatedBy = {
                    username: currentUser.username,
                    email: currentUser.email,
                    name: currentUser.name
                };
                // oldCopy.subscribers = $scope.task.subscribers.push(oldCopy.updatedBy);
                $scope.task.svninfo = {};

                for (var j = 0; j < $scope.files.length; j++) {
                    var fileuri = '/task/' + oldCopy.id + '/attachments/' + $scope.files[j].name;
                    if ($scope.task.attachments.indexOf(fileuri) > -1) {
                        var modalOptions = {
                            showCloseButton: true,
                            showActionButton: false,
                            closeButtonText: 'Ok',
                            headerText: 'File Exists!',
                            bodyText: 'File with name <b>' + fileuri + '</b> is already attached to this task'
                        };
                        modalService.showModal({}, modalOptions);
                    } else {
                        $scope.task.attachments.push(fileuri);
                    }
                }

                // Task.watch2($scope, $scope.task);

                Task.update($scope.task, oldCopy, $scope.files).success(function() {
                    reloadBugInfo(id);
                    Flash.addAlert('success', '<a href=\'/task/' + $scope.task.id + '\'>' + 'Task-' + $scope.task.id + '</a>' + ' was successfully updated');
                    ngProgress.complete();
                }).error(function(error) {
                    ngProgress.complete();
                    Flash.addAlert('danger', error.data.message);
                });

            };

            // create procedural tasks
            $scope.createProceduralTask = function(proceduralTaskType) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Create',
                    bodyText: '',
                    headerText: 'Create ' + proceduralTaskType + ' for Task-' + id,
                    scope: {config: $scope.config}
                };
                modalService.showModal({}, modalOptions).then(function() {
                    Task.count().success(function(response) {
                        var task = {};
                        task.id = response.count + 1;
                        task.kind = 'Task';
                        task.title = proceduralTaskType + ' for ' + $scope.task.title;
                        task.description = 'Implement ' + task.title;
                        task.note = '';
                        task.days = '';
                        task.status = $scope.config.status[0];
                        task.period = {
                            startDate: '',
                            endDate: ''
                        };


                        task.period  = '';
                        task.priority = $scope.newSubTask.priority;
                        task.category = $scope.task.category;
                        task.severity = $scope.task.severity;
                        task.version = $scope.task.version;
                        task.tofixin = $scope.newSubTask.tofixin
                        task.submittedBy = {
                            username: currentUser.username,
                            email: currentUser.email,
                            name: currentUser.name
                        };
                        task.assignTo = $scope.newSubTask.assignTo;
                        task.subscribers = [task.submittedBy, task.assignTo];
                        task.attachments = [];
                        task.parent = {
                            type: proceduralTaskType,
                            id: id
                        };
                        task.proceduralTasks = {
                            'Requirements Task': [],
                            'Functional Specification Task': [],
                            'Test Specification Task': [],
                            'Test Automation Task': [],
                            'Documentation Task': []
                        };
                        task.subTasks = [];
                        task.createdAt = new Date();
                        task.modifiedAt = new Date();
                        task.changeHistory = [];

                        var updates = [Task.create(task, []).then(), Task.insertProceduralTask(id, proceduralTaskType, task.id).then()];
                        $q.all(updates).then(function(response) {
                            ngProgress.complete();

                            $scope.message = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span> Created Task-" + task.id + "</span>";
                            // show message for 5 seconds and hide
                            $timeout(function() {
                                $scope.message = '';
                            }, 5000);
                            //  Flash.addAlert('success', '<a href=\'/task/' + task.id + '\'>' + 'Task-' + task.id + '</a>' + ' was successfully created'); 
                            reloadBugInfo(id);

                        }, function(error) {
                            ngProgress.complete();
                            Flash.addAlert('danger', 'Oops! Could not create the task. Please try again.');
                        });
                    }).error(function(error) {
                        ngProgress.complete();
                        Flash.addAlert('danger', 'Oops! could not get task count');
                    });
                }, function(error) {
                    ngProgress.complete();
                    // do nothing
                });
            };


            $scope.createSubTask = function() {
                var modalOptions = {
                 //   templateUrl: '/components/modal/subtask.modal.html',
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Create',
                    bodyText: '',
                    headerText: 'Create sub-task for Task-' + id,
                    scope: {config: $scope.config}
                };
                modalService.showModal({}, modalOptions).then(function() {
                    Task.count().success(function(response) {
                        var task = {};
                        task.id = response.count + 1;
                        task.kind = 'Task';
                        task.title = $scope.task.subtaskTitle;
                        task.description = 'Implement ' + task.title;
                        task.note = '';
                        task.days = '';
                        task.status = $scope.config.status[0];
                        task.period = {
                            startDate: '',
                            endDate: ''
                        };

                        task.priority = $scope.newSubTask.priority;
                        task.category = $scope.task.category;
                        task.severity = $scope.task.severity;
                        task.version = $scope.task.version;
                        task.tofixin = $scope.newSubTask.tofixin;
                        task.fixedin = $scope.task.fixedin;
                        task.parent = id;
                        task.submittedBy = {
                            username: currentUser.username,
                            email: currentUser.email,
                            name: currentUser.name
                        };
                        task.assignTo = $scope.newSubTask.assignTo;
                        task.subscribers = [task.submittedBy, task.assignTo];
                        task.attachments = [];
                        task.parent = {
                            type: $scope.relationTypes[5],
                            id: id
                        };
                        task.proceduralTasks = {
                            'Requirements Task': [],
                            'Functional Specification Task': [],
                            'Test Specification Task': [],
                            'Test Automation Task': [],
                            'Documentation Task': []
                        };
                        task.subTasks = [];
                        task.createdAt = new Date();
                        task.modifiedAt = new Date();
                        task.changeHistory = [];

                        Task.createSubTask(id, task).then(function(response) {
                            ngProgress.complete();

                            $scope.message = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span> Created Task-" + task.id + "</span>";
                            // show message for 5 seconds and hide
                            $timeout(function() {
                                $scope.message = '';
                            }, 5000);
                            //  Flash.addAlert('success', '<a href=\'/task/' + task.id + '\'>' + 'Task-' + task.id + '</a>' + ' was successfully created'); 
                            reloadBugInfo(id);
                        }, function(error) {
                            ngProgress.complete();
                            Flash.addAlert('danger', 'Oops! Could not create the task. Please try again.');
                        });
                    }).error(function(error) {
                        ngProgress.complete();
                        Flash.addAlert('danger', 'Oops! could not get task count');
                    });
                }, function(error) {
                    ngProgress.complete();
                    // do nothing
                });
            };


            // subscribe to the task
            $scope.subscribe = function() {
                //$scope.task.subscribers.push($scope.updatedBy);
                var subscribe = {
                    id: id,
                    user: {
                        name: currentUser.name,
                        email: currentUser.email,
                        username: currentUser.username
                    }
                };
                Task.subscribe(subscribe).then(function() {
                    $scope.showSubscribe = false;
                    $scope.showUnsubscribe = true;
                    Flash.addAlert('success', 'You have subscribed to ' + '<a href=\'/#/task/' + $scope.task.id + '\'>' + 'Task-' + $scope.task.id + '</a>');
                }, function(error) {
                    Flash.addAlert('danger', error.data);
                });
            };
            // unsubscribe the task
            $scope.unsubscribe = function() {
                var unsubscribe = {
                    id: id,
                    user: {
                        name: currentUser.name,
                        email: currentUser.email,
                        username: currentUser.username
                    }
                };

                Task.unsubscribe(unsubscribe).then(function() {
                    // if the current user is task reporter or task assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed default and cannot unsubscribe
                    if (currentUser.username === $scope.task.submittedBy.username || currentUser.username === $scope.task.assignTo.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    } else {
                        $scope.showSubscribe = true;
                        $scope.showUnsubscribe = false;
                    }
                    Flash.addAlert('success', 'You have unsubscribed from ' + '<a href=\'/#/task/' + $scope.task.id + '\'>' + 'Task-' + $scope.task.id + '</a>');
                }, function(error) {
                    Flash.addAlert('danger', error);
                });
            };

            $scope.toggleTaskListInclusion = function(yesOrNo) {
                Task.toggleTaskListInclusion(id, yesOrNo).success(function() {
                    $scope.message = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span> Updated </span>";
                }).error(function(error) {
                        Flash.addAlert('danger', 'Oops! Something went wrong. Reload and try again.');
                });
            };


    

            // private functions
            function reloadBugInfo(id) {
                Task.get(id).then(function(response) {
                    $scope.files = [];
                    $scope.task = response.data;
                    oldCopy = angular.copy(response.data);

                    // need specical handling for 'priority' and 'assignTo' for 
                    // pre-selecting values and binding selection from the UI to model
                    // in dropdown becuase the model is object and not string
                    var index = _.findIndex($scope.config.priority, $scope.task.priority);
                    $scope.task.priority = $scope.config.priority[index];
                    index = _.findIndex($scope.config.users, $scope.task.assignTo);
                    $scope.task.assignTo = $scope.config.users[index];

                    // if the current user has already subscribed then show Unsubscribe else show Subscribe
                    var subscribers = $scope.task.subscribers;
                    for (var i = 0; i < subscribers.length; i++) {
                        if (subscribers[i].username === currentUser.username) {
                            $scope.showSubscribe = false;
                            $scope.showUnsubscribe = true;
                            break;
                        }
                    }
                    // if the current user is task reporter or task assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed by default and not allowed to unsubscribe
                    if (currentUser.username === $scope.task.assignTo.username || currentUser.username === $scope.task.submittedBy.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    }

                    if ($scope.task.attachments.length > 0) {
                        $scope.hasAttachments = true;
                    }

                    subTasks(id);
                    $scope.task.comment = '';


                }, function(error) {
                    Flash.addAlert('danger', error.data.message);
                });
            }


            function subTasks(id) {
                Task.getSubTasks(id).then(function(response) {
                    $scope.task.subTasks = response.data;
                    console.log('subTasks',$scope.task.subTasks);
                }, function(error) {
                    // console.log(error);
                    Flash.addAlert('danger', 'Oops! Could not retrieve sub tasks')
                });
            }

            function getAllProceduralTasks(proceduralTasks) {
                var _proceduralTasks = [];
                angular.forEach(proceduralTasks, function(tasks) {
                     _proceduralTasks.push(tasks);
                });
                
                _proceduralTasks =  _.flatten(_proceduralTasks);
                return _proceduralTasks;
            }
        }

    ]);