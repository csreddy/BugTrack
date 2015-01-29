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
                                        value: false
                                    });
                                }
                                for (var i = 0; i < configdata.data.status.length; i++) {
                                    config.status.push({
                                        name: configdata.data.status[i],
                                        value: false
                                    });
                                }
                                for (var i = 0; i < configdata.data.severity.length; i++) {
                                    config.severity.push({
                                        name: configdata.data.severity[i],
                                        value: false
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
                                    value: true
                                }, {
                                    name: 'Task',
                                    value: false
                                }, {
                                    name: 'RFE',
                                    value: false
                                }, {
                                    name: 'Other',
                                    value: false
                                }],
                                status: [{
                                    name: 'New',
                                    value: false
                                }, {
                                    name: 'Verify',
                                    value: false
                                }, {
                                    name: 'Test',
                                    value: false
                                }, {
                                    name: 'Fix',
                                    value: false
                                }, {
                                    name: 'Ship',
                                    value: false
                                }, {
                                    name: 'Closed',
                                    value: false
                                }, {
                                    name: 'Will not fix',
                                    value: false
                                }, {
                                    name: 'External',
                                    value: false
                                }],
                                severity: [{
                                    name: 'P1 - Catastrophic',
                                    value: false
                                }, {
                                    name: 'P2 - Critical',
                                    value: false
                                }, {
                                    name: 'P3 - Major',
                                    value: false
                                }, {
                                    name: 'P4 - Minor',
                                    value: false
                                }, {
                                    name: 'P5 - Aesthetic',
                                    value: false
                                }, {
                                    name: 'Performance',
                                    value: false
                                }],
                                q: '',
                                facets: {},
                                assignTo: '',
                                submittedBy: '',
                                category: '',
                                version: '',
                                fixedin: '',
                                tofixin: ''
                            };
                            return criteria;
                        }
                    ]
                }
            });
    });