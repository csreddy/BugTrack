'use strict';

angular.module('bug.controllers')
    .controller('viewCtrl', ['$scope', '$location', 'Bug', 'config', 'Flash', 'currentUser', 'modalService', '$q', 'ngProgress',

    function($scope, $location, Bug, config, Flash, currentUser, modalService, $q, ngProgress) {

        $scope.changes = {};
        $scope.updatedBy = currentUser || {};
        $scope.showSubscribe = true;
        $scope.showUnsubscribe = false;
        $scope.config = config.data || {};
        $scope.hasAttachments = false;

        var updateBug;
        var id = $location.path().replace('/bug/', '');


        Bug.get(id).then(function(response) {
                console.log(response.data);

                $scope.bug = response.data;
                updateBug = JSON.parse(JSON.stringify(response.data));
                console.log('updateBug', updateBug);


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

                if($scope.bug.attachments.length > 0){
                    $scope.hasAttachments = true;
                }

                // watch for bug field changes   
                Bug.watch($scope, 'status');
                Bug.watch($scope, 'priority');
                Bug.watch($scope, 'severity');
                Bug.watch($scope, 'category');
                Bug.watch($scope, 'version');
                Bug.watch($scope, 'platform');
                Bug.watch($scope, 'tofixin');
                Bug.watch($scope, 'fixedin');
                Bug.watch($scope, 'assignTo');

                // Flash.addAlert('success', 'opened ' + uri);
            },
            function(response) {
                if (response.status === 404) {
                    $location.path('/404');
                    Flash.addAlert('danger', 'Bug not found');
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
            updateBug.subscribers = $scope.assignTo || '';
            updateBug.updatedBy = currentUser;
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
            headerText: 'Clone Bug-' + id + '?',
            bodyText: 'Are you sure you want to clone this bug?'
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
                    $scope.bug.clones.push(newBugId);
                    Bug.clone($scope.bug, clone.bug).then();
                })];

                ngProgress.start();
                $q.all(cloneOps).then(function() {
                        ngProgress.complete();
                        console.log('bug details ', clone.bug);
                        //  console.log('----', $scope.updatedBy);
                        $location.path('/bug/' + newBugId);
                        Flash.addAlert('success', '<a href=\'/#/bug/' + clone.bug.id + '\'>' + 'Bug-' + clone.bug.id + '</a>' + ' was successfully cloned');
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
}]);