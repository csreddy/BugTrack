'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/login', {
            templateUrl: 'app/user/login/login.html',
            controller: 'loginCtrl'
        })
        .when('/logout', {
            templateUrl: 'app/user/login/login.html',
            controller: 'logoutCtrl'
        })
        .when('/register', {
            templateUrl: 'app/user/register/register.html',
            controller: 'registerCtrl'
        })
        .when('/profile', {
        	templateUrl: 'app/user/profile/profile.html',
        	controller: 'profileCtrl',
            resolve: {
                currentUser: ['User',
                    function(User) {
                        return User.getCurrentUserInfo();
                    }
                ]
            }
        });

    });