'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main/main.html',
                controller: 'searchCtrl',
                title: 'Home',
                resolve: {
                    currentUser: ['User',
                        function(User) {
                            return User.getCurrentUserInfo();
                        }
                    ],
                    getAllBugs: ['BugService',
                        function(BugService) {
                            return BugService.getBugs();
                        }
                    ],
                    config: ['bugConfig',
                        function(bugConfig) {
                            var config = {};
                            return bugConfig.getConfig().then(function(configdata) {
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
                                return config;
                            });
                        }
                    ]
                }
            })
            .when('/login', {
                templateUrl: 'app/user/login.html',
                controller: 'loginCtrl'
            });
    });