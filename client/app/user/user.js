'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/login', {
            templateUrl: 'app/user/login.html',
            controller: 'loginCtrl'
        });
    });