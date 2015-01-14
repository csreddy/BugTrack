'use strict';

var app = angular.module('fullstackApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.bootstrap',
    'ngRoute',

    'search.controllers',
    'search.services',

    'bug.controllers',
    'bug.services',

    'user.controllers',
    'user.services',

    'config.controllers',
    'config.services',
    
    'dashboard.controllers',

    'navbar.controllers',


    
    'modal.services',
    'flash.services',

    // 'bugTexteditor.directive',
    // 'wysiHtml5.directive',
     'fileupload.directive'

]);
app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .otherwise({
            redirectTo: '/home'
        });
    $locationProvider.html5Mode(true);
}).constant('RESTURL', 'http://' + location.hostname + ':' + location.port);