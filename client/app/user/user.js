'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/login', {
            templateUrl: 'app/user/login/login.html',
            controller: 'loginCtrl',
            reloadOnSearch: false 
        })
        .when('/logout', {
            templateUrl: 'app/user/login/login.html',
            controller: 'logoutCtrl',
            reloadOnSearch: false 
        })
        .when('/register', {
            templateUrl: 'app/user/register/register.html',
            controller: 'registerCtrl',
            reloadOnSearch: false 
        })
        .when('/profile', {
        	templateUrl: 'app/user/profile/profile.html',
        	controller: 'profileCtrl',
            reloadOnSearch: false,
            resolve: {
                currentUser: ['User',
                    function(User) {
                        return User.getCurrentUserInfo();
                    }
                ]
            }
        });

    });