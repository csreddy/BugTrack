'use strict';

angular.module('fullstackApp')
    .config(function($routeProvider) {
        $routeProvider.
        when('/configure', {
            templateUrl: 'app/configure/configure.html',
            controller: 'configCtrl',
            reloadOnSearch: false
        });
    });