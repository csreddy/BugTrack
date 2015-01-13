'use strict';

var app = angular.module('bug.controllers', ['ui.bootstrap']);

app.controller('newBugCtrl', ['$scope', '$location', 'BugService', 'bugConfigFactory', 'Flash', 'User', 'loadConfig', 'getCurrentUser', 'bugId',

    function($scope, $location, BugService, bugConfigFactory, Flash, User, loadConfig, getCurrentUser, bugId) {
        // accordion interactions   
        $scope.status = {
            isFirstOpen: true,
            isFirstDisabled: false
        };

        $scope.config = {};
        $scope.config = loadConfig.data;
        $scope.submittedBy = getCurrentUser;

        $scope.selectedItem = {
            value: 0,
            label: ''
        };

        //  $scope.Wrapper = Serv;
        $scope.relatedTo = [];

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
            $scope.relation = relation;
        };

        $scope.setRelatedTo = function(relatedTo) {
            if (relatedTo) {
                var tokenizedTaskIds = relatedTo.split(',');
                var taskIds = [];
                for (var i = 0; i < tokenizedTaskIds.length; i++) {
                    if (!isNaN(parseInt(tokenizedTaskIds[i].replace(/ /g, '')))) {
                        taskIds[i] = parseInt(tokenizedTaskIds[i].replace(/ /g, ''));
                    }
                }
                $scope.relatedTo = taskIds;
                console.log(taskIds);
            } else {
                $scope.relatedTo = [];
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

        $scope.setTickets = function(tickets) {
            if (tickets) {
                var tokenizedTickets = tickets.split(',');
                var ticketIds = [];
                for (var i = 0; i < tokenizedTickets.length; i++) {
                    if (!isNaN(parseInt(tokenizedTickets[i].replace(/ /g, '')))) {
                        ticketIds[i] = parseInt(tokenizedTickets[i].replace(/ /g, ''));
                    }
                }
                $scope.tickets = ticketIds;
            } else {
                $scope.tickets = [];
            }

        };

        $scope.setCustomerImpact = function(customerImpact) {
            $scope.customerImpact = customerImpact;
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

        //-------------------------------------------------------------------
        function submitBug() {
            var bug = {};

            bug.id = parseInt(bugId.data.count) + 1;
            bug.kind = $scope.kind || 'Bug';
            bug.createdAt = new Date();
            bug.modifiedAt = bug.createdAt;
            bug.status = $scope.config.status[1];
            bug.title = $scope.title;
            bug.submittedBy = $scope.submittedBy;
            bug.assignTo = $scope.assignTo;
            bug.description = $scope.description;
            bug.samplequery = $scope.samplequery;
            bug.sampledata = $scope.sampledata;
            bug.stacktrace = $scope.stacktrace;
            bug.category = $scope.category;
            bug.tofixin = $scope.tofixin;
            bug.severity = $scope.severity;
            bug.priority = $scope.priority;
            bug.version = $scope.version;
            bug.platform = $scope.platform || 'all';
            bug.memory = $scope.memory;
            bug.processors = $scope.processors;
            bug.note = $scope.note;
            bug.headline = $scope.headline;
            bug.subscribers = [];
            bug.subscribers.push($scope.submittedBy);
            if ($scope.assignTo.username !== $scope.submittedBy.username) {
                bug.subscribers.push($scope.assignTo);
            }
            bug.attachments = [];
            for (var i = 0; i < $scope.files.length; i++) {
                bug.attachments[i] = '/' + bug.id + '/' + $scope.files[i].name;
            }
            bug.relation = $scope.relation;
            bug.relatedTo = $scope.relatedTo || [];
            bug.clones = [];

            bug.supportDescription = $scope.supportDescription;
            bug.workaround = $scope.workaround;
            bug.publishStatus = $scope.publishStatus;
            bug.customerImpact = $scope.customerImpact;
            bug.tickets = $scope.tickets || [];
            bug.changeHistory = [];

            BugService.createNewBug(bug, $scope.files).success(function() {
                $location.path('/');
                Flash.addAlert('success', '<a href=\'/#/bug/' + bug.id + '\'>' + 'Bug-' + bug.id + '</a>' + ' was successfully created');
            }).error(function(response) {
                Flash.addAlert('danger', response);
            });
        }
    }
]);



app.controller('bugListCtrl', ['$scope', '$location', 'BugService', 'Flash', 'getCurrentUserBugs', '$filter', 'getCurrentUser',

    function($scope, $location, BugService, Flash, getCurrentUserBugs, $filter, getCurrentUser) {

        $scope.bugs = [];
        $scope.currentUser = getCurrentUser;
        $scope.currentPage = 1;
        $scope.itemsPerPage = 25;


        // get search metrics data from first item in result set
        $scope.searchMetrics = getCurrentUserBugs.data[0].metrics;
        $scope.totalItems = getCurrentUserBugs.data[0].total;

        // get bug contents
        getCurrentUserBugs.data.splice(0, 1);
        $scope.bugList = getCurrentUserBugs.data;


        getBugList();


        $scope.$on('search', function(event, data) {
            $scope.bugList = data.searchResults;
            $scope.facets = data.searchCriteria.facets;
            console.log($scope.bugList);
            $scope.totalItems = $scope.bugList[0].total;
            getBugList();
        });


        $scope.goToBug = function(uri) {
            $location.path(uri);
        };

        $scope.setPage = function(pageNo) {
            $scope.currentPage = pageNo;
            console.log('Page changed to: ' + $scope.currentPage);
            var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
            var end = begin + $scope.itemsPerPage;
            getBugDetails(begin, end);
        };

        var orderBy = $filter('orderBy');
        $scope.order = function(predicate, reverse) {
            $scope.bugs = orderBy($scope.bugs, predicate, reverse);
        };


        // private functions

        function getBugDetails(begin, end) {
            $scope.bugs = [];
            var paginatedBugList = $scope.bugList.slice(begin, end);

            angular.forEach(paginatedBugList, function(bug) {
                $scope.bugs.push(bug.content);
            });
        }
        // for pagination, get bug details only for given page
        function getBugList() {
            getBugDetails(0, $scope.itemsPerPage);
        }



    }
]);


app.controller('bugViewCtrl', ['$scope', '$location', 'BugService', 'bugConfigFactory', 'Flash', 'getCurrentUser', 'bugId', '$q', 'modalService',

    function($scope, $location, BugService, bugConfigFactory, Flash, getCurrentUser, bugId, $q, modalService) {

        $scope.config = {};
        $scope.changes = {};
        $scope.updatedBy = getCurrentUser;
        $scope.showSubscribe = true;
        $scope.showUnsubscribe = false;


        var updateBug;
        var id = $location.path().replace('/bug/', '');

        bugConfigFactory.getConfig().then(function(response) {
            $scope.config = response.data;
            console.log('config: ', $scope.config);
        });

        BugService.getBug(id).then(function(response) {
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
                    if (subscribers[i].username === getCurrentUser.username) {
                        $scope.showSubscribe = false;
                        $scope.showUnsubscribe = true;
                        break;
                    }
                }
                // if the current user is bug reporter or bug assignee then do not show subscribe/unsubscribe because 
                // they are subscribed default and cannot unsubscribe
                if (getCurrentUser.username === $scope.bug.assignTo.username || getCurrentUser.username === $scope.bug.submittedBy.username) {
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

            BugService.updateBug(updateBug, $scope.files).success(function() {
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
                    var promises = [BugService.cloneBug(clone.bug).then(),
                        BugService.cloneBug($scope.bug).then()
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
            BugService.updateBug($scope.bug).then(function() {
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
                if (subscribers[i].username === getCurrentUser.username) {
                    $scope.bug.subscribers.splice(i, 1);
                    break;
                }
            }
            BugService.updateBug($scope.bug).then(function() {
                // if the current user is bug reporter or bug assignee then do not show subscribe/unsubscribe because 
                // they are subscribed default and cannot unsubscribe
                if (getCurrentUser.username === $scope.bug.submittedBy.username || getCurrentUser.username === $scope.bug.assignTo.username) {
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