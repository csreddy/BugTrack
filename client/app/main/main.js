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
                                config.kind = [];
                                config.status = [];
                                config.severity = [];
                                for (var i = 0; i < configdata.data.kind.length; i++) {
                                    config.kind.push({
                                        name: configdata.data.kind[i],
                                        selected: false
                                    });
                                }
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
                            var criteria = {
                                kind: [{
                                    name: 'Bug',
                                    selected: true
                                }, {
                                    name: 'Task',
                                    selected: false
                                }, {
                                    name: 'RFE',
                                    selected: false
                                }, {
                                    name: 'Other',
                                    selected: false
                                }],
                                status: [{
                                    name: 'New',
                                    selected: false
                                }, {
                                    name: 'Verify',
                                    selected: false
                                }, {
                                    name: 'Test',
                                    selected: false
                                }, {
                                    name: 'Fix',
                                    selected: false
                                }, {
                                    name: 'Ship',
                                    selected: false
                                }, {
                                    name: 'Closed',
                                    selected: false
                                }, {
                                    name: 'Will not fix',
                                    selected: false
                                }, {
                                    name: 'External',
                                    selected: false
                                }],
                                severity: [{
                                    name: 'P1 - Catastrophic',
                                    selected: false
                                }, {
                                    name: 'P2 - Critical',
                                    selected: false
                                }, {
                                    name: 'P3 - Major',
                                    selected: false
                                }, {
                                    name: 'P4 - Minor',
                                    selected: false
                                }, {
                                    name: 'P5 - Aesthetic',
                                    selected: false
                                }, {
                                    name: 'Performance',
                                    selected: false
                                }],
                                q: null,
                                facets: {},
                                assignTo: null,
                                submittedBy: null,
                                category: null,
                                version: null,
                                fixedin: null,
                                tofixin: null
                            };
                            return criteria;
                        }
                    ]
                }
            });
    });