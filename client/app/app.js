'use strict';

var app = angular.module('fullstackApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.bootstrap',
    'ngRoute',
    'bug.controllers',
    'bugConfig.services',
    'bug.factory',
    'bug.services',
	'user.controllers',
	'user.services',
	'flash.services'
]);
  app.config(function($routeProvider, $locationProvider) {
        $routeProvider
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    });