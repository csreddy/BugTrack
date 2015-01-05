'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main/main.html',
                controller: 'MainCtrl'
            })
            .when('/login', {
                templateUrl: 'app/views/login.html',
                controller: 'loginCtrl'
            })
    });