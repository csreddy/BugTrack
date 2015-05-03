'use strict';

angular.module('rfe.controllers', ['angularFileUpload', 'textAngular', 'ngProgress'])
    .controller('newRFECtrl', ['$scope','$q', '$location', 'config', 'currentUser', 'count', 'RFE', 'Flash', 'ngProgress',
        function($scope, $q, $location, config, currentUser, count, RFE, Flash, ngProgress) {
            $scope.rfe = {};
            $scope.rfe.parent = {};
            $scope.rfe.period = {
                startDate: stringify(new Date()),
                endDate: ''
            };
            $scope.config = {};
            $scope.config = config.data;
            $scope.accordion = {};
            $scope.accordion.status = {
                rfeInfo: true
            };

            $scope.rfe.files = [];
            $scope.rfe.days = 1;
            $scope.relatedTo = [];
            $scope.relationTypes = [
                'Requirements Task',
                'Functional Specification Task',
                'Test Specification Task',
                'Test Automation Task',
                'Documentation Task',
                'Sub-task'
            ];

            $scope.days = _.range(1, 101);
               // sort users
            $scope.config.users = _.sortBy($scope.config.users, 'name');
          

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


            //listen for the file selected event
            $scope.$on('fileSelected', function(event, args) {
                $scope.$apply(function() {
                    //add the file object to the scope's files collection
                    $scope.rfe.files.push(args.file);
                });
            });

            $scope.createNewRFE = function() {
                if ($scope.rfeForm.$valid) {
                    // Submit as normal
                    submitRFE();
                } else {
                    $scope.rfeForm.submitted = true;
                }
            };


            this.submitRFE = function() {
                 submitRFE();
            };

            this.stringify = function(date) {
                stringify(date);
            };

            
            /* private functions */
            function submitRFE() {
                console.log('submit new rfe');
                ngProgress.start();
                RFE.count().success(function(response) {
                    var rfe = {};
                    rfe.id = response.count + 1;
                    rfe.kind = 'RFE';
                    rfe.title = $scope.rfe.title;
                    rfe.description = $scope.rfe.description;
                    rfe.note = $scope.rfe.note;
                 
                    rfe.status = $scope.config.status[0];

                    rfe.priority = $scope.rfe.priority;
                    rfe.category = $scope.rfe.category;
                    rfe.severity = $scope.rfe.severity;
                    rfe.version = $scope.rfe.version;
                    rfe.tofixin = $scope.rfe.tofixin;
                    rfe.fixedin = '';
                    rfe.parent = {};

                    rfe.submittedBy = {
                        username: currentUser.username,
                        email: currentUser.email,
                        name: currentUser.name
                    };
                    rfe.assignTo = $scope.rfe.assignTo;
                    rfe.subscribers = [];
                    rfe.subscribers.push(rfe.submittedBy);
                    if (rfe.assignTo.username !== rfe.submittedBy.username) {
                        rfe.subscribers.push(rfe.assignTo);
                    }
                    rfe.attachments = [];
                    
                    for (var i = 0; i < $scope.rfe.files.length; i++) {
                        rfe.attachments[i] = {
                            name: $scope.rfe.files[i].name,
                            uri: '/rfe/' + rfe.id + '/attachments/' + $scope.rfe.files[i].name
                        };
                    }
                   
                    rfe.includeInTaskList = true;
                    rfe.proceduralTasks = {
                        'Requirements Task': [],
                        'Functional Specification Task': [],
                        'Test Specification Task': [],
                        'Test Automation Task': [],
                        'Documentation Task': []
                    };
                    rfe.subTasks = [];
                    rfe.tags = [$scope.rfe.category, rfe.assignTo.username, rfe.submittedBy.username];
                    rfe.createdAt = new Date();
                    rfe.modifiedAt = new Date();
                    rfe.changeHistory = [];
                    var updates = [RFE.create(rfe, $scope.rfe.files).then()];

                    $q.all(updates).then(function(response) {
                        ngProgress.complete();
                        $location.path('/rfe/' + rfe.id);
                        Flash.addAlert('success', '<a href=\'/rfe/' + rfe.id + '\'>' + 'RFE-' + rfe.id + '</a>' + ' was successfully created');
                    }, function(error) {
                         ngProgress.complete();
                        Flash.addAlert('danger',  ' Oops! Could not create RFE. ' + error.data.message)
                    });
                }).error(function(error) {
                    ngProgress.complete();
                    Flash.addAlert('danger', 'Oops! cound not get rfe count')
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