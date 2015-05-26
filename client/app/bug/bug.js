'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/bug/new', {
            templateUrl: 'app/bug/new/new.html',
            controller: 'newBugCtrl',
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
                /* bugId: ['Bug',
                    function(Bug) {
                        return Bug.count();
                    }
                ]
                */
            }
        })
            .when('/bug/:id', {
                templateUrl: 'app/bug/view/view.html',
                controller: 'viewCtrl',
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
                    clones: ['Bug', '$location',
                        function(Bug, $location) {
                            var id = $location.url().replace(/\/bug\//, '');
                            return Bug.getClones(id);
                        }
                    ]
                }
            });
    });