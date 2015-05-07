'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'app/main/main.html',
                controller: 'searchCtrl',
                title: 'Home',
                reloadOnSearch: false,
                resolve: {
                    currentUser: ['User',
                        function(User) {
                            return User.getCurrentUserInfo();
                        }
                    ],
                    config: ['Config',
                        function(Config) {
                            var config = {};
                            return Config.get().then(function(configdata) {
                                config = angular.copy(configdata.data);
                               // config.kind = configdata.data.kind;
                                config.status = [];
                                config.severity = [];
                                // for (var i = 0; i < configdata.data.kind.length; i++) {
                                //     config.kind.push({
                                //         name: configdata.data.kind[i],
                                //         selected: false
                                //     });
                                // }
                                for (var i = 0; i < configdata.data.status.length; i++) {
                                    config.status.push({
                                        name: configdata.data.status[i],
                                        selected: false
                                    });
                                }
                                for (var i = 0; i < configdata.data.severity.length; i++) {
                                    config.severity.push({
                                        name: configdata.data.severity[i],
                                        selected: false
                                    });
                                }
                                // sort users alphabetically
                                config.users.sort(function(a, b) {
                                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                                });
                                // sort version alphabetically
                                config.version.sort(function(a, b) {
                                    return a.toLowerCase().localeCompare(b.toLowerCase());
                                });
                                // sort category alphabetically
                                config.category.sort(function(a, b) {
                                    return a.toLowerCase().localeCompare(b.toLowerCase());
                                });
                                return config;
                            });
                        }
                    ],
                    defaultSearchCriteria: [
                        function() {
                            console.log(this);
                            var criteria = {
                                kind: 'Bug',
                                status: (function () {
                                    var statuses = ['New', 'Verify', 'Test', 'Fix', 'Ship', 'Closed', 'Will not fix', 'External', 'Duplicate', 'Not a bug']
                                    var statusCheckboxes = [];
                                    _.forEach(statuses, function(status, index) {
                                           statusCheckboxes[index] = {
                                            name: status,
                                            selected: false
                                           }; 
                                    });
                                    return statusCheckboxes;
                                })(),
                                severity: (function () {
                                    var severities = ['P1 - Catastrophic', 'P2 - Critical', 'P3 - Major', 'P4 - Minor', 'P5 - Aesthetic', 'Performance']
                                    var severityCheckboxes = [];
                                    _.forEach(severities, function(severity, index) {
                                           severityCheckboxes[index] = {
                                            name: severity,
                                            selected: false
                                           }; 
                                    });
                                    return severityCheckboxes;
                                })(),
                                q: null,
                                facets: {},
                                assignTo: null,
                                submittedBy: null,
                                category: null,
                                version: null,
                                fixedin: null,
                                tofixin: null,
                                range: {},
                                selectedUsers: [],
                                groupCriteria: null
                            };
                            return criteria;
                        }
                    ]
                }
            });
    });