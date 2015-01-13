'use strict';

var app = angular.module('fullstackApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.bootstrap',
    'ngRoute',
    'bug.controllers',
    'bug.services',
	'user.controllers',
	'user.services',
	'flash.services',
    'navbar.controllers',
    'search.services',
    'bugconfig.services',
    'modal.services',
    'bugTexteditor.directive',
    'search.controllers'
]);
  app.config(function($routeProvider, $locationProvider) {
        $routeProvider
        .otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    }); 