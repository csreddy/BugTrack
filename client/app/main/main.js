'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'app/main/main.html',
                controller: 'MainCtrl'
            })
            .when('/new', {
                templateUrl: 'app/main/new.html',
                controller: 'newBugCtrl'
            })
    });