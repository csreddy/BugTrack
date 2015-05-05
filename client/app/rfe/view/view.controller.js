'use strict';

angular.module('rfe.controllers')
    .controller('viewRFECtrl', ['$scope', '$location', '$timeout', '$q', '$sce','RFE', 'Task','SubTasks','config', 'Flash', 'currentUser', 'modalService', 'ngProgress',

        function($scope, $location, $timeout, $q, $sce, RFE, Task, SubTasks, config, Flash, currentUser, modalService, ngProgress) {

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
            var id = $location.path().replace('/rfe/', '');

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



            RFE.get(id).then(function(response) {

                    $scope.rfe = response.data;
                    // ignore html sanitize
                    $scope.rfe.description = $sce.trustAsHtml($scope.rfe.description);
                    oldCopy = angular.copy(response.data);

                    // need specical handling for 'priority' and 'assignTo' for 
                    // pre-selecting values and binding selection from the UI to model
                    // in dropdown becuase the model is object and not string
                    var index = _.findIndex($scope.config.priority, $scope.rfe.priority);
                    $scope.rfe.priority = $scope.config.priority[index];
                    index = _.findIndex($scope.config.users, $scope.rfe.assignTo);
                    $scope.rfe.assignTo = $scope.config.users[index];

                    // if the current user has already subscribed then show Unsubscribe else show Subscribe
                    var subscribers = $scope.rfe.subscribers;
                    for (var i = 0; i < subscribers.length; i++) {
                        if (subscribers[i].username === currentUser.username) {
                            $scope.showSubscribe = false;
                            $scope.showUnsubscribe = true;
                            break;
                        }
                    }
                    // if the current user is task reporter or task assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed by default and not allowed to unsubscribe
                    if (currentUser.username === $scope.rfe.assignTo.username || currentUser.username === $scope.rfe.submittedBy.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    }

                    if ($scope.rfe.attachments.length > 0) {
                        $scope.hasAttachments = true;
                    }

                   $scope.rfe.subTasks = SubTasks.data;
                   $scope.allProceduralTasks  = getAllProceduralTasks($scope.rfe.proceduralTasks);
                  
                   // watch for fields in modal form
                   $scope.$on('newItem', function(event, newItem) {
                        $scope.newSubTask = newItem;
                   });

                },
                function(error) {
                    if (error.status === 404) {
                        $location.path('/404');
                        Flash.addAlert('danger', 'RFE not found');
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

            // update rfe 
            $scope.updateRFE = function() {
                ngProgress.start();

                $scope.rfe.updatedBy = {
                    username: currentUser.username,
                    email: currentUser.email,
                    name: currentUser.name
                };
                // oldCopy.subscribers = $scope.rfe.subscribers.push(oldCopy.updatedBy);
                $scope.rfe.svninfo = {};

                for (var j = 0; j < $scope.files.length; j++) {
                    var fileuri = '/rfe/' + oldCopy.id + '/attachments/' + $scope.files[j].name;
                    if ($scope.rfe.attachments.indexOf(fileuri) > -1) {
                        var modalOptions = {
                            showCloseButton: true,
                            showActionButton: false,
                            closeButtonText: 'Ok',
                            headerText: 'File Exists!',
                            bodyText: 'File with name <b>' + fileuri + '</b> is already attached to this task'
                        };
                        modalService.showModal({}, modalOptions);
                    } else {
                        $scope.rfe.attachments.push(fileuri);
                    }
                }


                RFE.update($scope.rfe, oldCopy, $scope.files).success(function() {
                    reloadRFEInfo(id);
                    Flash.addAlert('success', '<a href=\'/rfe/' + $scope.rfe.id + '\'>' + 'RFE-' + $scope.rfe.id + '</a>' + ' was successfully updated');
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
                    headerText: 'Create ' + proceduralTaskType + ' for RFE-' + id,
                    scope: {config: $scope.config}
                };
                modalService.showModal({}, modalOptions).then(function() {
                    Task.getNewId().success(function(response) {
                        var task = {};
                        task.id = response.nextId;
                        task.kind = 'Task';
                        task.title = proceduralTaskType + ' for ' + $scope.rfe.title;
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
                        task.category = $scope.rfe.category;
                        task.severity = $scope.rfe.severity;
                        task.version = $scope.rfe.version;
                        task.tofixin = $scope.newSubTask.tofixin;
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
                            parentId: id,
                            taskOrRfe: 'rfe'
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
                            reloadRFEInfo(id);

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
                    headerText: 'Create sub-task for RFE-' + id,
                    scope: {config: $scope.config}
                };
                modalService.showModal({}, modalOptions).then(function() {
                    Task.getNewId().success(function(response) {
                        var task = {};
                        task.id = response.nextId;
                        task.kind = 'Task';
                        task.title = $scope.rfe.subtaskTitle;
                        task.description = 'Implement ' + task.title;
                        task.note = '';
                        task.days = '';
                        task.status = $scope.config.status[0];
                        task.period = {
                            startDate: '',
                            endDate: ''
                        };

                        task.priority = $scope.newSubTask.priority;
                        task.category = $scope.rfe.category;
                        task.severity = $scope.rfe.severity;
                        task.version = $scope.rfe.version;
                        task.tofixin = $scope.newSubTask.tofixin;
                        task.fixedin = $scope.rfe.fixedin;
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
                            parentId: id,
                            taskOrRfe: 'rfe'
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

                        Task.createSubTask(id, task, 'rfe').then(function(response) {
                            ngProgress.complete();

                            $scope.message = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span> Created Task-" + task.id + "</span>";
                            // show message for 5 seconds and hide
                            $timeout(function() {
                                $scope.message = '';
                            }, 5000);
                            //  Flash.addAlert('success', '<a href=\'/task/' + task.id + '\'>' + 'Task-' + task.id + '</a>' + ' was successfully created'); 
                            reloadRFEInfo(id);
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
                //$scope.rfe.subscribers.push($scope.updatedBy);
                var subscribe = {
                    id: id,
                    user: {
                        name: currentUser.name,
                        email: currentUser.email,
                        username: currentUser.username
                    }
                };
                RFE.subscribe(subscribe).then(function() {
                    $scope.showSubscribe = false;
                    $scope.showUnsubscribe = true;
                    Flash.addAlert('success', 'You have subscribed to ' + '<a href=\'/rfe/' + $scope.rfe.id + '\'>' + 'RFE-' + $scope.rfe.id + '</a>');
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

                RFE.unsubscribe(unsubscribe).then(function() {
                    // if the current user is task reporter or task assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed default and cannot unsubscribe
                    if (currentUser.username === $scope.rfe.submittedBy.username || currentUser.username === $scope.rfe.assignTo.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    } else {
                        $scope.showSubscribe = true;
                        $scope.showUnsubscribe = false;
                    }
                    Flash.addAlert('success', 'You have unsubscribed from ' + '<a href=\'/#/task/' + $scope.rfe.id + '\'>' + 'Task-' + $scope.rfe.id + '</a>');
                }, function(error) {
                    Flash.addAlert('danger', error);
                });
            };

            $scope.toggleTaskListInclusion = function(yesOrNo) {
                Task.toggleTaskListInclusion(id, yesOrNo, 'rfe').success(function() {
                    $scope.message = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span> Updated </span>";
                }).error(function(error) {
                        Flash.addAlert('danger', 'Oops! Something went wrong. Reload and try again.');
                });
            };


    

            // private functions
            function reloadRFEInfo(id) {
                RFE.get(id).then(function(response) {
                    $scope.files = [];
                    $scope.rfe = response.data;
                    oldCopy = angular.copy(response.data);

                    // need specical handling for 'priority' and 'assignTo' for 
                    // pre-selecting values and binding selection from the UI to model
                    // in dropdown becuase the model is object and not string
                    var index = _.findIndex($scope.config.priority, $scope.rfe.priority);
                    $scope.rfe.priority = $scope.config.priority[index];
                    index = _.findIndex($scope.config.users, $scope.rfe.assignTo);
                    $scope.rfe.assignTo = $scope.config.users[index];

                    // if the current user has already subscribed then show Unsubscribe else show Subscribe
                    var subscribers = $scope.rfe.subscribers;
                    for (var i = 0; i < subscribers.length; i++) {
                        if (subscribers[i].username === currentUser.username) {
                            $scope.showSubscribe = false;
                            $scope.showUnsubscribe = true;
                            break;
                        }
                    }
                    // if the current user is task reporter or task assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed by default and not allowed to unsubscribe
                    if (currentUser.username === $scope.rfe.assignTo.username || currentUser.username === $scope.rfe.submittedBy.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    }

                    if ($scope.rfe.attachments.length > 0) {
                        $scope.hasAttachments = true;
                    }

                    subTasks(id);
                    $scope.rfe.comment = '';


                }, function(error) {
                    Flash.addAlert('danger', error.data.message);
                });
            }


            function subTasks(id) {
                RFE.getSubTasks(id).then(function(response) {
                    $scope.rfe.subTasks = response.data;
                    console.log('subTasks',$scope.rfe.subTasks);
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