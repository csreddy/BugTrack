'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/new', {
            templateUrl: 'app/bug/new/new.html',
            controller: 'newBugCtrl',
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
                bugId: ['Bug',
                    function(Bug) {
                        return Bug.count();
                    }
                ]

            }
        })
        .when('/bug/:id', {
        	templateUrl: 'app/bug/view/view.html',
        	controller: 'viewCtrl',
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
                bugId: ['Bug',
                    function(Bug) {
                        return Bug.count();
                    }
                ]
            }
        });
    });

