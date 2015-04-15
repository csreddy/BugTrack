'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/rfe/new', {
            templateUrl: 'app/rfe/new/new.html',
            controller: 'newRFECtrl',
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
                count: ['RFE',
                    function(RFE) {
                        return RFE.count();
                    }
                ]

            }
        })
        .when('/rfe/:id', {
        	templateUrl: 'app/rfe/view/view.html',
        	controller: 'viewRFECtrl',
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
                SubTasks: ['RFE', '$location', function(RFE, $location) {
                      var id = $location.url().replace(/\/rfe\//, '');
                    return RFE.getSubTasks(parseInt(id));
                }]
            }
        });
    });
