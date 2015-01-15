'use strict';

angular.module('bug.controllers')
  .controller('viewCtrl', ['$scope', '$location', 'Bug',  'Config', 'Flash', 'currentUser', 'bugId', 'modalService', '$q',

    function($scope, $location, Bug, Config, Flash, currentUser, bugId, modalService, $q) {

        $scope.config = {};
        $scope.changes = {};
        $scope.updatedBy = currentUser;
        $scope.showSubscribe = true;
        $scope.showUnsubscribe = false;


        var updateBug;
        var id = $location.path().replace('/bug/', '');

        Config.get().then(function(response) {
            $scope.config = response.data;
            console.log('config: ', $scope.config);
        });

        Bug.get(id).then(function(response) {
                console.log(response.data);

                $scope.bug = response.data;
                updateBug = response.data;
                console.log('updateBug', updateBug);

                // cloned bug attachedments will have its parent attachment uri, hence need to do this
                $scope.attachments = [];
                for (var i = 0; i < $scope.bug.attachments.length; i++) {
                    $scope.attachments[i] = {};
                    $scope.attachments[i].uri = $scope.bug.attachments[i];
                    $scope.attachments[i].name = $scope.bug.attachments[i].replace(/\/\d*\//, '');
                }

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
                // they are subscribed default and cannot unsubscribe
                if (currentUser.username === $scope.bug.assignTo.username || currentUser.username === $scope.bug.submittedBy.username) {
                    $scope.showSubscribe = false;
                    $scope.showUnsubscribe = false;
                }

                // watch for status change   
                $scope.$watch('status', function() {
                    if ($scope.status !== undefined) {
                        var note = 'Status changed from ' + $scope.bug.status + ' to ' + $scope.status;
                        console.log(note);
                        $scope.changes.status = {
                            'from': $scope.bug.status,
                            'to': $scope.status
                        };
                    }
                }, true);

                // watch for priority change
                $scope.$watch('priority', function() {
                    if ($scope.priority !== undefined) {
                        var p = JSON.parse($scope.priority);
                        var note = 'Priority changed from ' + $scope.bug.priority.level + '-' + $scope.bug.priority.title + ' to ' + p.level + '-' + p.title;
                        console.log(note);
                        $scope.changes.priority = {
                            'from': $scope.bug.priority.level + '-' + $scope.bug.priority.title,
                            'to': p.level + '-' + p.title
                        };
                    }
                }, true);

                // watch for severity change
                $scope.$watch('severity', function() {
                    if ($scope.severity !== undefined) {
                        var note = 'Severity changed from ' + $scope.bug.severity + ' to ' + $scope.severity;
                        console.log(note);
                        $scope.changes.severity = {
                            'from': $scope.bug.severity,
                            'to': $scope.severity
                        };
                    }
                }, true);

                // watch for category change
                $scope.$watch('category', function() {
                    if ($scope.category !== undefined) {
                        var note = 'Category changed from ' + $scope.bug.category + ' to ' + $scope.category;
                        console.log(note);
                        $scope.changes.category = {
                            'from': $scope.bug.category,
                            'to': $scope.category
                        };
                    }
                }, true);

                // watch for version change
                $scope.$watch('version', function() {
                    if ($scope.version !== undefined) {
                        var note = 'Version changed from ' + $scope.bug.version + ' to ' + $scope.version;
                        console.log(note);
                        $scope.changes.version = {
                            'from': $scope.bug.version,
                            'to': $scope.version
                        };
                    }
                }, true);

                // watch for platform change
                $scope.$watch('platform', function() {
                    if ($scope.platform !== undefined) {
                        var note = 'Priority changed from ' + $scope.bug.platform + ' to ' + $scope.platform;
                        console.log(note);
                        $scope.changes.platform = {
                            'from': $scope.bug.platform,
                            'to': $scope.platform
                        };
                    }
                }, true);

                // watch for tofixin change
                $scope.$watch('tofixin', function() {
                    if ($scope.tofixin !== undefined) {
                        var note = 'To Fix in changed from ' + $scope.bug.tofixin + ' to ' + $scope.tofixin;
                        console.log(note);
                        $scope.changes.tofixin = {
                            'from': $scope.tofixin,
                            'to': $scope.tofixin
                        };
                    }
                }, true);

                // watch for fixedin change
                $scope.$watch('fixedin', function() {
                    if ($scope.fixedin !== undefined) {
                        var note = 'Fixed in changed from ' + $scope.bug.fixedin + ' to ' + $scope.fixedin;
                        console.log(note);
                        $scope.changes.fixedin = {
                            'from': $scope.bug.fixedin,
                            'to': $scope.fixedin
                        };
                    }
                }, true);

                // watch for assignTo change
                $scope.$watch('assignTo', function() {
                    if ($scope.assignTo !== undefined) {
                        var note = 'Bug re-assigned to ' + JSON.parse($scope.assignTo).name;
                        console.log(note);
                        $scope.changes.assignTo = {
                            'from': $scope.bug.assignTo,
                            'to': JSON.parse($scope.assignTo)
                        };
                    }
                }, true);
                // Flash.addAlert('success', 'opened ' + uri);
            },
            function(response) {
                if (response.status === 404) {
                    $location.path('/404');
                    Flash.addAlert('danger', 'bug not found');
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


        // update bug 
        $scope.updateBug = function() {
            var uri = $scope.bug.id + '.json';
            var updateTime = new Date();
            updateBug.status = $scope.status || $scope.bug.status;
            updateBug.assignTo = ($scope.assignTo === undefined) ? $scope.bug.assignTo : JSON.parse($scope.assignTo);
            // check if the user has already subscribed
            for (var i = 0; i < updateBug.subscribers.length; i++) {
                if (updateBug.subscribers[i].username === updateBug.assignTo.username) {
                    break;
                }
                // if user has not subscribed then subscribe at the last iteration
                if (i === updateBug.subscribers.length - 1) {
                    updateBug.subscribers.push(updateBug.assignTo);
                }
            }
            updateBug.category = $scope.category || $scope.bug.category;
            updateBug.tofixin = $scope.tofixin || $scope.bug.tofixin;
            updateBug.severity = $scope.severity || $scope.bug.severity;
            updateBug.priority = ($scope.priority === undefined) ? $scope.bug.priority : JSON.parse($scope.priority);
            updateBug.version = $scope.version || $scope.bug.version;
            updateBug.platform = $scope.platform || $scope.bug.platform;
            updateBug.fixedin = $scope.fixedin || $scope.bug.fixedin;
            if (Object.keys($scope.changes).length !== 0 || $scope.newcomment) {
                console.log($scope.newcomment);
                console.log($scope.updatedBy);
                updateBug.changeHistory.push({
                    'time': updateTime,
                    'updatedBy': $scope.updatedBy,
                    'change': $scope.changes,
                    'comment': $scope.newcomment
                });
                // clear text area after submit
                $scope.newcomment = '';
            }
            for (var j = 0; j < $scope.files.length; j++) {
                var fileuri = '/' + updateBug.id + '/' + $scope.files[j].name;
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

            Bug.update(updateBug, $scope.files).success(function() {
                // reset watchers
                $scope.changes = {};
                $scope.files = [];
                Flash.addAlert('success', '<a href=\'/#/bug/' + $scope.bug.id + '\'>' + 'Bug-' + $scope.bug.id + '</a>' + ' was successfully updated');
            }).error(function(response) {
                Flash.addAlert('danger', response.data.error.message);
            });
        };

        // clone bug 
        $scope.clone = function(id) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Clone',
                headerText: 'Clone Bug-' + id + '?',
                bodyText: 'Are you sure you want to clone this bug?'
            };

            console.log('cloning ' + id);
            var cloneTime = new Date();
            var newBugId = parseInt(bugId.data.count) + 1;
            var clone = {};
            clone.bug = angular.copy($scope.bug);
            clone.bug.id = newBugId;
            clone.bug.cloneOf = id;
            clone.bug.clones = [];
            clone.bug.changeHistory.push({
                'time': cloneTime,
                'updatedBy': $scope.updatedBy,
                'comment': "<span class='label label-danger'><span class='glyphicon glyphicon-bullhorn'></span></span> Cloned from " + "<a href='#/bug/" + id + "'>Bug-" + id + "</a>"
            });

            if ($scope.bug.cloneOf) {
                Flash.addAlert('danger', "Cloning of cloned bug is not allowed. Clone the parent <a href='#/bug/" + $scope.bug.cloneOf + "'>Bug-" + $scope.bug.cloneOf + "</a>");
                // $location.path('/bug/' + id);
            } else {
                console.warn('clone of', $scope.bug.cloneOf);
                modalService.showModal({}, modalOptions).then(function(result) {
                    if ($scope.bug.clones) {
                        $scope.bug.clones.push(newBugId);
                    } else {
                        $scope.bug.clones = [newBugId];
                    }
                    var promises = [Bug.clone(clone.bug).then(),
                        Bug.clone($scope.bug).then()
                    ];
                    $q.all(promises).then(function() {
                            console.log('bug details ', clone.bug);
                            //  console.log('----', $scope.updatedBy);
                            $location.path('/bug/' + newBugId);
                            Flash.addAlert('success', '<a href=\'/#/bug/' + clone.bug.id + '\'>' + 'Bug-' + clone.bug.id + '</a>' + ' was successfully cloned');
                        },
                        function(response) {
                            console.log(response);
                            Flash.addAlert('danger', response.data.error.message);
                        }
                    );
                });
            }
        };

        // subscribe to the bug
        $scope.subscribe = function() {
            $scope.bug.subscribers.push($scope.updatedBy);
            Bug.update($scope.bug).then(function() {
                $scope.showSubscribe = false;
                $scope.showUnsubscribe = true;
                Flash.addAlert('success', 'You have subscribed to ' + '<a href=\'/#/bug/' + $scope.bug.id + '\'>' + 'Bug-' + $scope.bug.id + '</a>');
            }, function(response) {
                Flash.addAlert('danger', response.data.error.message);
            });
        };
        // unsubscribe to the bug
        $scope.unsubscribe = function() {
            var subscribers = $scope.bug.subscribers;
            for (var i = 0; i < subscribers.length; i++) {
                if (subscribers[i].username === currentUser.username) {
                    $scope.bug.subscribers.splice(i, 1);
                    break;
                }
            }
            Bug.update($scope.bug).then(function() {
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
            }, function(response) {
                Flash.addAlert('danger', response.data.error.message);
            });
        };
    }
]);

