'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/configure', {
            templateUrl: 'app/configure/configure.html',
            controller: 'configCtrl',
            reloadOnSearch: false,
            resolve:{
            	currentUser: ['User',
                        function(User) {
                            return User.getCurrentUserInfo();
                        }
                    ],
            	config: ['Config',
                    function(Config) {
                        return Config.get();
                    }
                ],
            	issues: ['Config',
                    function(Config) {
                        return Config.getUnImportedIssues();
                    }
                ]
            }
        });
    });