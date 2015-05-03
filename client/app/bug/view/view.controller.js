'use strict';

angular.module('bug.controllers')
    .controller('viewCtrl', ['$scope', '$location', '$window', '$sce', 'Bug', 'clones', 'config', 'Flash', 'currentUser', 'modalService', '$q', 'ngProgress',

        function($scope, $location, $window, $sce, Bug, clones, config, Flash, currentUser, modalService, $q, ngProgress) {
            $location.search({}); // clear query params from url when navigating from search page
            $scope.changes = {};
            $scope.updatedBy = {
                username: currentUser.username,
                name: currentUser.name,
                email: currentUser.email
            } || {};

            $scope.showSubscribe = true;
            $scope.showUnsubscribe = false;
            $scope.config = config.data || {};
            $scope.hasAttachments = false;
            $scope.accordion = {};
            $scope.accordion.status = {
                open: true,
                closed: false
            };
            $scope.clones = clones.data;

            
            // check if this preference is stored in localStorage before
            // otherwise set the defaults
            try {
                if($window.localStorage.showCompactInfoBox){
                    $scope.sideBar =  false;
                    $scope.compactInfoBox = true;
                }else{
                 $scope.sideBar = true;
                 $scope.compactInfoBox = false;   
                } 
            } catch (e) {
                // defaults
                 $scope.sideBar = true;
                 $scope.compactInfoBox = false;
            }



            var updateBug;
            var id = $location.path().replace('/bug/', '');

            // sort users
            $scope.config.users = _.sortBy($scope.config.users, 'name');

            Bug.get(id).then(function(response) {
                    console.log(response.data);

                    $scope.bug = response.data;
                    // ignore html sanitize
                    $scope.bug.description = $sce.trustAsHtml($scope.bug.description);
                    updateBug = JSON.parse(JSON.stringify(response.data));
                    console.log('updateBug', updateBug);


                    $scope.support = updateBug.support;

                    // if the current user has already subscribed then show Unsubscribe else show Subscribe
                    var subscribers = $scope.bug.subscribers;
                    for (var i = 0; i < subscribers.length; i++) {
                        if (subscribers[i].username === currentUser.username) {
                            $scope.showSubscribe = false;
                            $scope.showUnsubscribe = true;
                            break;
                        }
                    }
                    // if the current user is bug reporter or bug assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed by default and not allowed to unsubscribe
                    if (currentUser.username === $scope.bug.assignTo.username || currentUser.username === $scope.bug.submittedBy.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    }

                    if ($scope.bug.attachments.length > 0) {
                        $scope.hasAttachments = true;
                    }

                  /*  // watch for bug field changes   
                    Bug.watch($scope, 'status');
                    Bug.watch($scope, 'priority');
                    Bug.watch($scope, 'severity');
                    Bug.watch($scope, 'category');
                    Bug.watch($scope, 'version');
                    Bug.watch($scope, 'platform');
                    Bug.watch($scope, 'tofixin');
                    Bug.watch($scope, 'fixedin');
                    Bug.watch($scope, 'assignTo');
                    Bug.watch($scope, 'support');*/


                    // Flash.addAlert('success', 'opened ' + uri);

                    // watch for fields in modal form
                    $scope.$on('newItem', function(event, newItem) {
                        $scope.newClone = newItem;
                    });
                },
                function(error) {
                    if (error.status === 404) {
                        $location.path('/404');
                        Flash.addAlert('danger', 'Bug not found');
                    } else {
                        Flash.addAlert('danger', error.data.error.message);
                    }

                });

            // watch for bug title
            $scope.$on('editTitle', function(event, newTitle) {
                updateBug.title = newTitle;
            });

            // watch for certain bug fields which must accompany with a comment
            $scope.$on('originalBug', function(event, originalBug) {
                $scope.newcomment = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span></span> This is Duplicate of " + "<a href='/bug/" + originalBug.id + "'>Bug-" + originalBug.id + "</a>\n" + originalBug.comment
            });

            // watch for certain bug fields which must accompany with a comment
            $scope.$on('notABug', function(event, comment) {
                $scope.newcomment = "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span></span> This is Not a Bug \n" + comment;
            });

            // certain status requires comment or some other update
            // below cases covers them and applies rules accordingly
            $scope.$watch('status', function() {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Submit',
                    bodyText: '',
                };
                switch ($scope.status) {
                    case 'Duplicate':
                        modalOptions.headerText = 'Original Bug Id';
                        modalOptions.scope = {
                            duplicate: true
                        };
                        modalService.showModal({
                            //  templateUrl: 'components/modal/partials/duplicate.modal.html'
                        }, modalOptions).then(function() {
                            $scope.updateBug();
                        }, function() {
                            // revert status
                            $scope.status = $scope.bug.status;
                            // clear pre-generated comment when cancelled
                            $scope.newcomment = '';

                        });
                        break;
                    case 'Not a bug':
                        console.log('inside not a bug');
                        modalOptions.headerText = 'Not A Bug';
                        modalOptions.scope = {
                            notABug: true
                        };
                        modalService.showModal({}, modalOptions).then(function() {
                            $scope.updateBug();
                        }, function() {
                            // revert status
                            $scope.status = $scope.bug.status;
                            // clear pre-generated comment when cancelled
                            $scope.newcomment = '';
                        });
                        break;
                    default:
                        // do nothing  
                }

            });

            $scope.editTitle = function() {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Submit',
                    bodyText: '',
                    headerText: 'Edit bug title',
                    scope: {
                        editTitle: true,
                        oldTitle: $scope.bug.title
                    }
                };
                modalService.showModal({}, modalOptions).then(function() {
                    if (updateBug.title === $scope.bug.title) {
                        Flash.addAlert(null, 'Did not update because there was no chnage in the title');
                    } else {
                        $scope.newcomment = '';
                        $scope.updateBug();
                    }

                }, function() {
                    // do nothing
                });
            };

            //an array of files selected
            $scope.files = [];

            //listen for the file selected event
            $scope.$on('fileSelected', function(event, args) {
                $scope.$apply(function() {
                    //add the file object to the scope's files collection
                    $scope.files.push(args.file);
                });
            });

            // show sidebar
            $scope.showSidebar = function() {
                $scope.compactInfoBox = false;
                $scope.sideBar = true;
                delete  $window.localStorage.showCompactInfoBox;
            };

            // show compact info box
            $scope.showCompactInfoBox = function() {
                $scope.compactInfoBox = true;
                $scope.sideBar = false;
                $window.localStorage.showCompactInfoBox = 'true';
            };


            // update bug 
            $scope.updateBug = function() {
                ngProgress.start();

                updateBug.status = $scope.status || $scope.bug.status;
                updateBug.assignTo = ($scope.assignTo === undefined) ? $scope.bug.assignTo : JSON.parse($scope.assignTo);
                updateBug.category = $scope.category || $scope.bug.category;
                updateBug.tofixin = $scope.tofixin || $scope.bug.tofixin;
                updateBug.severity = $scope.severity || $scope.bug.severity;
                updateBug.priority = ($scope.priority === undefined) ? $scope.bug.priority : JSON.parse($scope.priority);
                updateBug.version = $scope.version || $scope.bug.version;
                updateBug.platform = $scope.platform || $scope.bug.platform;
                updateBug.fixedin = $scope.fixedin || $scope.bug.fixedin;
                updateBug.comment = $scope.newcomment || '';
                // updateBug.subscribers = $scope.assignTo || '';
                updateBug.updatedBy = currentUser;
                updateBug.support = $scope.support || $scope.bug.support;
                updateBug.svninfo = {};

                for (var j = 0; j < $scope.files.length; j++) {
                    var fileuri = '/bug/' + updateBug.id + '/attachments/' + $scope.files[j].name;
                    if (updateBug.attachments.indexOf(fileuri) > -1) {
                        var modalOptions = {
                            showCloseButton: true,
                            showActionButton: false,
                            closeButtonText: 'Ok',
                            headerText: 'File Exists!',
                            bodyText: 'File with name <b>' + fileuri + '</b> is already attached to this bug'
                        };
                        modalService.showModal({}, modalOptions);
                    } else {
                        updateBug.attachments.push(fileuri);
                    }
                }

                Bug.update(updateBug, $scope.bug, $scope.files).success(function() {
                    // reset watchers
                    $scope.changes = {};
                    $scope.files = [];
                    $scope.newcomment = '';
                    Flash.addAlert('success', '<a href=\'/bug/' + $scope.bug.id + '\'>' + 'Bug-' + $scope.bug.id + '</a>' + ' was successfully updated');
                    Bug.get(id).then(function(response) {
                        $scope.bug = response.data;
                    }, function(error) {
                        Flash.addAlert('danger', error.message);
                    });
                    ngProgress.complete();
                }).error(function(error) {
                    Flash.addAlert('danger', error.message);
                });

            };

            // clone bug 
            $scope.clone = function(id) {

                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Clone',
                    headerText: 'Clone Bug-' + id,
                    bodyText: '',
                    scope: {
                        config: $scope.config
                    }
                };

                console.log('cloning ' + id);
                var cloneTime = new Date();
                var newBugId;
                var clone = {};
                clone.bug = angular.copy($scope.bug);
                clone.bug.cloneOf = id;
                clone.bug.clones = [];
                clone.bug.changeHistory.push({
                    'time': cloneTime,
                    'updatedBy': $scope.updatedBy,
                    'change': {},
                    'comment': "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span></span> Cloned from " + "<a href='/bug/" + id + "'>Bug-" + id + "</a>"
                });

                if ($scope.bug.cloneOf) {
                    Flash.addAlert('danger', "Cloning of cloned bug is not allowed. Clone the parent <a href='/bug/" + $scope.bug.cloneOf + "'>Bug-" + $scope.bug.cloneOf + "</a>");
                    // $location.path('/bug/' + id);
                } else {
                    console.warn('clone of', $scope.bug.cloneOf);
                    modalService.showModal({}, modalOptions).then(function() {
                        var cloneOps = [Bug.count().then(function(response) {
                            newBugId = parseInt(response.data.count) + 1;
                            clone.bug.id = newBugId;
                            clone.bug.tofixin = $scope.newClone.tofixin;
                            clone.bug.priority = $scope.newClone.priority;
                            clone.bug.assignTo = $scope.newClone.assignTo;
                            $scope.bug.clones.push(newBugId);
                            Bug.clone($scope.bug, clone.bug).then();
                        })];

                        ngProgress.start();
                        $q.all(cloneOps).then(function() {
                                ngProgress.complete();
                                console.log('bug details ', clone.bug);
                                //  console.log('----', $scope.updatedBy);
                                //  $location.path('/bug/' + newBugId);
                                Flash.addAlert('success', '<a href=\'/bug/' + clone.bug.id + '\'>' + 'Bug-' + clone.bug.id + '</a>' + ' was successfully cloned');
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

            // subscribe to the bug
            $scope.subscribe = function() {
                //$scope.bug.subscribers.push($scope.updatedBy);
                var subscribe = {
                    id: id,
                    user: {
                        name: currentUser.name,
                        email: currentUser.email,
                        username: currentUser.username
                    }
                };
                Bug.subscribe(subscribe).then(function() {
                    $scope.showSubscribe = false;
                    $scope.showUnsubscribe = true;
                    Flash.addAlert('success', 'You have subscribed to ' + '<a href=\'/#/bug/' + $scope.bug.id + '\'>' + 'Bug-' + $scope.bug.id + '</a>');
                }, function(error) {
                    Flash.addAlert('danger', error.data);
                });
            };
            // unsubscribe the bug
            $scope.unsubscribe = function() {
                var unsubscribe = {
                    id: id,
                    user: {
                        name: currentUser.name,
                        email: currentUser.email,
                        username: currentUser.username
                    }
                };

                Bug.unsubscribe(unsubscribe).then(function() {
                    // if the current user is bug reporter or bug assignee then do not show subscribe/unsubscribe because 
                    // they are subscribed default and cannot unsubscribe
                    if (currentUser.username === $scope.bug.submittedBy.username || currentUser.username === $scope.bug.assignTo.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = false;
                    } else {
                        $scope.showSubscribe = true;
                        $scope.showUnsubscribe = false;
                    }
                    Flash.addAlert('success', 'You have unsubscribed from ' + '<a href=\'/#/bug/' + $scope.bug.id + '\'>' + 'Bug-' + $scope.bug.id + '</a>');
                }, function(error) {
                    Flash.addAlert('danger', error);
                });
            };
        }
    ]);