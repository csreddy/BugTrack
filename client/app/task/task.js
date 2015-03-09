'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/task/new', {
            templateUrl: 'app/task/new/new.html',
            controller: 'newTaskCtrl',
            reloadOnSearch: false,
            resolve: {
                config: ['Config',
                    function(Config) {
                        return Config.get();
                    }
                ],
                currentUser: ['User',
                    function(User) {
                        return User.getCurrentUserInfo();
                    }
                ],
                count: ['Task',
                    function(Task) {
                        return Task.count();
                    }
                ]

            }
        })
        .when('/task/:id', {
        	templateUrl: 'app/task/view/view.html',
        	controller: 'viewTaskCtrl',
            reloadOnSearch: false,
        	resolve: {
        		config: ['Config',
                    function(Config) {
                        return Config.get();
                    }
                ],
                currentUser: ['User',
                   function(User) {
                        return User.getCurrentUserInfo();
                    }
                ]
            }
        });
    });
