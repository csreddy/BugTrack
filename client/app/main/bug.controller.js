'use strict';

var app = angular.module('bug.controllers', ['ui.bootstrap']);
app.constant('RESTURL', 'http://' + location.hostname + ':' + location.port);

app.controller('newBugCtrl', ['$scope', '$location', 'RESTURL', 'BugService', 'bugFactory', 'bugConfigFactory', 'Flash',

    function($scope, $location, RESTURL, BugService, bugFactory, bugConfigFactory, Flash, Serv) {
        //$scope.test = 'controller works';

        // accordiion interactions   
        $scope.status = {
            isFirstOpen: true,
            isFirstDisabled: false
        };

        $scope.config = {};
        bugConfigFactory.getConfig().then(function(response) {
            $scope.config = response.data;
        });

        $scope.selectedItem = {
            value: 0,
            label: ''
        };

        $scope.Wrapper = Serv;

        // initialize scope variables
        // $scope.id = null;
        // $scope.title = null;
        // $scope.submittedBy = null;
        // $scope.assignTo = null;
        // $scope.description = null;
        // $scope.samplequery = null;
        // $scope.sampledata = null;
        // $scope.stacktrace = null;
        // $scope.cloneOf = null;
        // $scope.clones = [];
        // $scope.category = null;
        // $scope.priority = null;
        // $scope.relation = null;
        $scope.relatedTo = [];
        // $scope.version = null;
        // $scope.platform = 'all';
        // $scope.memory = null;
        // $scope.processors = null;
        // $scope.note = null;
        // $scope.headline = null;
        // $scope.supportDescription = null;
        // $scope.workaround = null;
        // $scope.publishStatus = 'Not ready';
        // $scope.tickets = [];
        // $scope.customerImpact = null;


        $scope.relatedTasks = [
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
            $scope.assignTo = assignTo;
        };

        $scope.setSeverity = function(severity) {
            $scope.severity = severity;
        };

        $scope.setPriority = function(priority) {
            $scope.priority = priority;
        };

        $scope.setToFixIn = function(tofixin) {
            $scope.tofixin = tofixin;
        };

        $scope.setRelation = function(relation) {
            $scope.relation = relation;
        };

        $scope.setRelatedTo = function(relatedTo) {
            var tokenizedTaskIds = relatedTo.split(',');
            for (var i = 0; i < tokenizedTaskIds.length; i++) {
                tokenizedTaskIds[i] = parseInt(tokenizedTaskIds[i].replace(/ /g, ''));
            }
            $scope.relatedTo = tokenizedTaskIds;
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
            $scope.headline = headline;
        };

        $scope.setSupportDescription = function(supportDescription) {
            $scope.supportDescription = supportDescription;
        };

        $scope.setWorkaround = function(workaround) {
            $scope.workaround = workaround;
        };

        $scope.setPublishStatus = function(publishStatus) {
            $scope.publishStatus = publishStatus;
        };

        $scope.setTickets = function(setTickets) {
            var tokenizedTickets = setTickets.split(',');
            for (var i = 0; i < tokenizedTickets.length; i++) {
                tokenizedTickets[i] = parseInt(tokenizedTickets[i].replace(/ /g, ''));
            }
            $scope.tickets = (tokenizedTickets === null) ? [] : tokenizedTickets;
        };

        $scope.setCustomerImpact = function(customerImpact) {
            $scope.customerImpact = customerImpact;
        };

        $scope.createNewBug = function() {
            var bugId = Math.floor(Math.random() * 10000);
            var bug = {};
            bug.relatedTo = [];
            bug.tickets = [];

            bug.id = bugId;
            bug.kind = $scope.kind || 'Bug';
            bug.createdAt = new Date();
            bug.modifiedAt = bug.createdAt;
            bug.status = $scope.config.status[1];
            bug.title = $scope.title;
            bug.submittedBy = 'sudhakar';
            bug.assignTo = JSON.parse($scope.assignTo);
            bug.description = $scope.description;
            bug.samplequery = $scope.samplequery;
            bug.sampledata = $scope.sampledata;
            bug.stacktrace = $scope.stacktrace;

            // $scope.cloneOf = null;
            // $scope.clones;
            bug.category = $scope.category;
            bug.tofixin = $scope.tofixin;
            bug.severity = $scope.severity;
            bug.priority = JSON.parse($scope.priority);
            bug.relation = $scope.relation;
            bug.relatedTo = $scope.relatedTo;
            //bug.relatedTo.push($scope.relatedTo);
            bug.version = $scope.version;
            bug.platform = $scope.platform || 'all';
            bug.memory = $scope.memory;
            bug.processors = $scope.processors;
            bug.note = $scope.note;
            bug.headline = $scope.headline;
            bug.supportDescription = $scope.supportDescription;
            bug.workaround = $scope.workaround;
            bug.publishStatus = $scope.publishStatus;
            bug.tickets.push($scope.tickets);
            bug.customerImpact = $scope.customerImpact;
            bug.changes = [];


            var uri = bugId + '.json';
            BugService.putDocument(uri, bug).then(function() {
                    console.log('bug details ', bug);
                    $location.path('/list');
                    Flash.addAlert('success', '<a href=\'/#/bug/' + bugId + '\'>' + bugId + '</a>' + ' was successfully created');

                },
                function(response) {
                    //  console.log(response.data);
                    Flash.addAlert('danger', response.data.error.message);
                }
            );
        };


        // text editor for bug descrition	
        //  $scope.descrizione = undefined;

    }
]);



app.controller('bugListCtrl', ['$scope', '$location', 'RESTURL', 'BugService', 'bugFactory', 'Flash',

    function($scope, $location, RESTURL, BugService, bugFactory, Flash) {

        BugService.getBugs().then(function(response) {
            $scope.bugs = response.data.results;
            $scope.bugs.sort(function(a, b) {
                //  console.log(a.uri);
                a = parseInt(a.uri.replace('.json', ''));
                b = parseInt(b.uri.replace('.json', ''));
                return (a - b);
            });
            console.log($scope.bugs);
        });

        $scope.goToBug = function(uri) {
            $location.path(uri);
        };

    }
]);


app.controller('bugViewCtrl', ['$scope', '$location', 'RESTURL', 'BugService', 'bugFactory', 'bugConfigFactory', 'Flash',

    function($scope, $location, RESTURL, BugService, bugFactory, bugConfigFactory, Flash) {

        $scope.config = {};
        $scope.changes = {};
        var updateBug;
        var uri = $location.path().replace('/bug/', '') + '.json';

        bugConfigFactory.getConfig().then(function(response) {
            $scope.config = response.data;
            console.log('config: ', $scope.config);
        });


        BugService.getBug(uri).then(function(response) {
                console.log(response.data);
                $scope.bug = response.data;
                updateBug = response.data;
                console.log('updateBug', updateBug);

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



                //  Flash.addAlert('success', 'opened ' + uri);
            },
            function(response) {
                Flash.addAlert('danger', response.data.error.message);
            });



        // update bug 
        $scope.updateBug = function() {
            var uri = $scope.bug.id + '.json';
            var updateTime = new Date();
            updateBug.status = $scope.status || $scope.bug.status;
            updateBug.assignTo = ($scope.assignTo === undefined) ? $scope.bug.assignTo : JSON.parse($scope.assignTo);
            updateBug.category = $scope.category || $scope.bug.category;
            updateBug.tofixin = $scope.tofixin || $scope.bug.tofixin;
            updateBug.severity = $scope.severity || $scope.bug.severity;
            updateBug.priority = ($scope.priority === undefined) ? $scope.bug.priority : JSON.parse($scope.priority);
            updateBug.version = $scope.version || $scope.bug.version;
            updateBug.platform = $scope.platform || $scope.bug.platform;
            updateBug.fixedin = $scope.fixedin || $scope.bug.fixedin;
            if (Object.keys($scope.changes).length !== 0) {
                updateBug.changes.push({
                    'time': updateTime,
                    'change': $scope.changes
                });
            }


            //  updateBug.changes.comment.push($scope.newcomment);

            BugService.putDocument(uri, updateBug).then(function() {

                    console.log('changes', $scope.changes);
                    //      console.log('updateBug', updateBug);
                    console.log('bug changed from ', updateBug);
                    console.log('bug changed to', $scope.bug);
                    Flash.addAlert('success', $scope.bug.id + ' was successfully updated');

                },
                function(response) {
                    Flash.addAlert('danger', response.data.error.message);
                }
            );
        };
    }
]);