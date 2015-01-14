'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/dashboard', {
            templateUrl: 'app/dashboard/dashboard.html',
            controller: 'dashboardCtrl'
        });
    });