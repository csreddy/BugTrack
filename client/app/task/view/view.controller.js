'use strict';

angular.module('task.controllers')
    .controller('viewTaskCtrl', ['$scope', '$location', 'Task', 'config', 'Flash', 'currentUser', 'modalService', '$q', 'ngProgress',

        function($scope, $location, Task, config, Flash, currentUser, modalService, $q, ngProgress) {

            $scope.changes = {};
            $scope.updatedBy = currentUser || {};
            $scope.showSubscribe = true;
            $scope.showUnsubscribe = false;
            $scope.config = config.data || {};
            $scope.hasAttachments = false;
            $scope.statuses = ['Not Yet Started', 'In Progress', 'Completed'];


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

           function showTaskInfo(task) {
                    console.log(task.data);

                    $scope.task = task.data;
                    oldCopy = JSON.parse(JSON.stringify(task.data));
                    console.log('oldCopy', oldCopy);
					
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

                }



            Task.get(id).then(function(response) {
            	console.log(response.data);

                    $scope.task = response.data;
                    oldCopy = JSON.parse(JSON.stringify(response.data));
                    console.log('oldCopy', oldCopy);
					
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
            },
                function(response) {
                    if (response.status === 404) {
                        $location.path('/404');
                        Flash.addAlert('danger', 'Task not found');
                    } else {
                        Flash.addAlert('danger', response.data.error.message);
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

            $scope.$watch('task.priority', function() {
            	console.log('task.priority', $scope.task.priority);
            })
               
               
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
                    // reset watchers
                  //  $scope.task.changes = {};
                    $scope.files = [];
                    $scope.task.comment = '';
                    Flash.addAlert('success', '<a href=\'/task/' + $scope.task.id + '\'>' + 'Task-' + $scope.task.id + '</a>' + ' was successfully updated');
                    Task.get(id).then(function(response) {
                        $scope.task = response.data;
                    }, function(error) {
                        Flash.addAlert('danger', error.message);
                    });
                    ngProgress.complete();
                }).error(function(error) {
                    Flash.addAlert('danger', error.message);
                });

            };

            // clone task 
            $scope.clone = function(id) {

                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Clone',
                    headerText: 'Clone Task-' + id + '?',
                    bodyText: 'Are you sure you want to clone this task?'
                };

                console.log('cloning ' + id);
                var cloneTime = new Date();
                var newTaskId;
                var clone = {};
                clone.task = angular.copy($scope.task);
                clone.task.cloneOf = id;
                clone.task.clones = [];
                clone.task.changeHistory.push({
                    'time': cloneTime,
                    'updatedBy': $scope.updatedBy,
                    'comment': "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span></span> Cloned from " + "<a href='/task/" + id + "'>Task-" + id + "</a>"
                });

                if ($scope.task.cloneOf) {
                    Flash.addAlert('danger', "Cloning of cloned task is not allowed. Clone the parent <a href='/task/" + $scope.task.cloneOf + "'>Task-" + $scope.task.cloneOf + "</a>");
                    // $location.path('/task/' + id);
                } else {
                    console.warn('clone of', $scope.task.cloneOf);
                    modalService.showModal({}, modalOptions).then(function() {


                        var cloneOps = [Task.count().then(function(response) {
                            newTaskId = parseInt(response.data.count) + 1;
                            clone.task.id = newTaskId;
                            $scope.task.clones.push(newTaskId);
                            Task.clone($scope.task, clone.task).then();
                        })];

                        ngProgress.start();
                        $q.all(cloneOps).then(function() {
                                ngProgress.complete();
                                console.log('task details ', clone.task);
                                //  console.log('----', $scope.updatedBy);
                                $location.path('/task/' + newTaskId);
                                Flash.addAlert('success', '<a href=\'/#/task/' + clone.task.id + '\'>' + 'Task-' + clone.task.id + '</a>' + ' was successfully cloned');
                            },
                            function(error) {
                                ngProgress.complete();
                                console.log(error);
                                Flash.addAlert('danger', error.data.message);
                            }
                        );
                    });
                }
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
        }
    ]);