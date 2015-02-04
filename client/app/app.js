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
    'wysiHtml5.directive',
    'fileupload.directive',
    'ngProgress',
    'facet.directive'

]);
app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/404', {
            templateUrl: 'components/404.html'
        })
        .otherwise({
            redirectTo: '/home'
        });
    $locationProvider.html5Mode(true).hashPrefix('');
}).filter('capitalize', function() {
    return function(input, all) {
        return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
    }
}).run(function($rootScope, ngProgress) {
    $rootScope.$on('$routeChangeStart', function() {
        ngProgress.height('3px');
        ngProgress.color('green');
        ngProgress.start();
    });

    $rootScope.$on('$routeChangeSuccess', function() {
        ngProgress.complete();
    });
    // Do the same with $routeChangeError
});