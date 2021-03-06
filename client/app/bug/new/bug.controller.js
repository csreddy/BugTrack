'use strict';

angular.module('bug.controllers', ['angularFileUpload', 'textAngular', 'ngProgress'])
    .controller('newBugCtrl', ['$scope', '$location', 'Bug', 'Config', 'Flash', 'User', 'config', 'currentUser', 'ngProgress', 'Common',

        function($scope, $location, Bug, Config, Flash, User, config, currentUser, ngProgress, Common) {
            $location.search({}).replace(); // clear query params from url when navigating from search page

            // accordion interactions   
            $scope.accordion = {
                status: {
                    oneAtATime: false,
                    samplequery: false,
                    sampledata: false,
                    stacktrace: false,
                    bugInfo: true,
                    supportInfo: false
                }
            };

            $scope.config = {};
            $scope.config = config.data;
            // sort users
            $scope.config.users = _.sortBy($scope.config.users, 'name');

            $scope.submittedBy = currentUser;

            // suppport default values
            $scope.support = {
                headline: '',
                supportDescription: '',
                publishStatus: $scope.config.publishStatus[0],
                tickets: [],
                customerImpact: $scope.config.customerImpact[3],
                workaround: ''
            };

            $scope.associatedTask = {};
            $scope.selectedItem = {
                value: 0,
                label: ''
            };


            $scope.relatedTo = [];

            $scope.relationTypes = [
                'Requirements task for',
                'Functional Spec task for',
                'Test Specification task for',
                'Test Automation task for',
                'Documentation task for',
                'Sub-task of'
            ];

            // $scope.setKind = function(kind) {
            //     $scope.kind = kind;
            // };

            $scope.submitted = false;


            $scope.setQuery = function(samplequery) {
                $scope.samplequery = samplequery;
            };
            $scope.setSampledata = function(sampledata) {
                $scope.sampledata = sampledata;
            };
            $scope.setStacktrace = function(stacktrace) {
                $scope.stacktrace = stacktrace;
            };

            $scope.setCategory = function(category) {
                $scope.category = category;
            };

            $scope.setAssignTo = function(assignTo) {
                $scope.assignTo = JSON.parse(assignTo);
            };

            $scope.setSeverity = function(severity) {
                $scope.severity = severity;
            };

            $scope.setPriority = function(priority) {
                $scope.priority = JSON.parse(priority);
            };

            $scope.setToFixIn = function(tofixin) {
                $scope.tofixin = tofixin;
            };

            $scope.setRelation = function(relation) {
                $scope.associatedTask.type = relation;
            };

            // TODO: modify this to accept only one task id
            $scope.setRelatedTo = function(relatedTo) {
                if (relatedTo) {
                    var tokenizedTaskIds = relatedTo.split(',');
                    var taskIds = [];
                    for (var i = 0; i < tokenizedTaskIds.length; i++) {
                        if (!isNaN(parseInt(tokenizedTaskIds[i].replace(/ /g, '')))) {
                            taskIds[i] = parseInt(tokenizedTaskIds[i].replace(/ /g, ''));
                        }
                    }
                    $scope.associatedTask.id = taskIds;
                    console.log(taskIds);
                } else {
                    $scope.associatedTask.id = [];
                }
            };

            $scope.setVersion = function(version) {
                $scope.version = version;
            };

            $scope.setPlatform = function(platform) {
                $scope.platform = platform;
            };

            $scope.setMemory = function(memory) {
                $scope.memory = memory;
            };

            $scope.setProcessors = function(processors) {
                $scope.processors = processors;
            };

            $scope.setNote = function(note) {
                $scope.note = note;
            };

            $scope.setHeadline = function(headline) {
                $scope.support.headline = headline;
            };

            $scope.setSupportDescription = function(supportDescription) {
                $scope.support.supportDescription = supportDescription;
            };

            $scope.setWorkaround = function(workaround) {
                $scope.support.workaround = workaround;
            };

            $scope.setPublishStatus = function(publishStatus) {
                $scope.support.publishStatus = publishStatus || 'Not Ready';
            };

            $scope.setTickets = function(tickets) {
                if (tickets) {
                    var tokenizedTickets = tickets.split(',');
                    var ticketIds = [];
                    for (var i = 0; i < tokenizedTickets.length; i++) {
                        // remove spaces
                        tokenizedTickets[i].replace(/ /g, '');
                        // put only if its  a number
                        if (!isNaN(parseInt(tokenizedTickets[i]))) {
                            ticketIds[i] = parseInt(tokenizedTickets[i]);
                        }
                    }
                    $scope.support.tickets = ticketIds;
                } else {
                    $scope.support.tickets = [];
                }

            };

            $scope.setCustomerImpact = function(customerImpact) {
                $scope.support.customerImpact = customerImpact;
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
            $scope.createNewBug = function() {
                if ($scope.bugForm.$valid) {
                    // Submit as normal
                    submitBug();
                } else {
                    $scope.bugForm.submitted = true;
                }
            };

            function submitBug() {

                console.log('called submitBug()');
                ngProgress.start();
                Bug.getNewId().success(function(response) {
                    var bug = {};
                    bug.id = response.nextId;
                    bug.kind = $scope.kind || 'Bug';
                    bug.createdAt = new Date();
                    bug.modifiedAt = bug.createdAt;
                    bug.status = $scope.config.status[0];
                    bug.title = $scope.title;
                    bug.submittedBy = {
                        username: $scope.submittedBy.username,
                        email: $scope.submittedBy.email,
                        name: $scope.submittedBy.name
                    };
                    bug.assignTo = $scope.assignTo;
                    bug.description = Common.linkifyBugId($scope.description);
                    bug.description.replace(/(b#)(\d*)/, "<a href='/bug/$2'>$2</a>")
                        .replace(/(t#)(\d*)/, "<a href='/task/$2'>$2</a>")
                        .replace(/(r#)(\d*)/, "<a href='/rfe/$2'>$2</a>");
                    bug.samplequery = $scope.samplequery;
                    bug.sampledata = $scope.sampledata;
                    bug.stacktrace = $scope.stacktrace;
                    bug.category = $scope.category;
                    bug.tofixin = $scope.tofixin;
                    bug.fixedin = '';
                    bug.severity = $scope.severity;
                    bug.priority = $scope.priority;
                    bug.version = $scope.version;
                    bug.platform = $scope.platform || 'all';
                    bug.memory = $scope.memory;
                    bug.processors = $scope.processors;
                    bug.note = $scope.note;


                    bug.subscribers = [];
                    bug.subscribers.push({
                        email: $scope.submittedBy.email,
                        name: $scope.submittedBy.name,
                        username: $scope.submittedBy.username
                    });
                    if ($scope.assignTo.username !== $scope.submittedBy.username) {
                        bug.subscribers.push($scope.assignTo);
                    }
                    bug.attachments = [];
                    for (var i = 0; i < $scope.files.length; i++) {
                        bug.attachments[i] = {
                            name: $scope.files[i].name,
                            uri: '/bug/' + bug.id + '/attachments/' + $scope.files[i].name
                        };
                    }
                    bug.tags = [$scope.category, $scope.assignTo.username, $scope.submittedBy.username];
                    //bug.relation = $scope.relation;
                    //bug.relatedTo = $scope.relatedTo || [];

                    //  bug.associatedTask = $scope.associatedTask;
                    bug.clones = [];
                    bug.support = $scope.support;
                    bug.changeHistory = [];


                    Bug.create(bug, $scope.files).success(function() {
                        ngProgress.complete();
                        $location.path('/bug/' + bug.id);
                        Flash.addAlert('success', '<a href=\'/bug/' + bug.id + '\'>' + 'Bug-' + bug.id + '</a>' + ' was successfully created');
                    }).error(function(error) {
                        ngProgress.complete();
                        Flash.addAlert('danger', error);
                    });

                }).error(function(error) {
                    ngProgress.complete();
                    Flash.addAlert('error', 'Oops! Could not generate new bug Id. Reload and try again');
                });
            }

            // attached to scope for exposing private functions to unit tests
            this.submitBug = function() {
                submitBug();
            };

        }
    ]);