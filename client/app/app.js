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
    'facet.directive',
    'ui.bootstrap',
    'hljs'

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
})
// for code highlight
.config(function(hljsServiceProvider) {
    hljsServiceProvider.setOptions({
        // replace tab with 4 spaces
        tabReplace: '    '
    });
})
// for groups tree ui
.config(function(ivhTreeviewOptionsProvider) {
    ivhTreeviewOptionsProvider.set({
        defaultSelectedState: false,
        validate: true,
        // Twisties can be images, custom html, or plain text
        twistieCollapsedTpl: '<span class="glyphicon glyphicon-plus-sign"></span>',
        twistieExpandedTpl: '<span class="glyphicon glyphicon-minus-sign"></span>',
        // twistieLeafTpl: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
        twistieLeafTpl: ''
    });
})
// filter for capitalize
.filter('capitalize', function() {
    return function(input, all) {
        return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
    };
})
// progress bar
.run(function($rootScope, ngProgress) {
    $rootScope.$on('$routeChangeStart', function() {
        ngProgress.height('3px');
        ngProgress.color('green');
        ngProgress.start();
    });

    $rootScope.$on('$routeChangeSuccess', function() {
        ngProgress.complete();
    });
    // Do the same with $routeChangeError
})
// for debugging app performance
.factory('getWatchCount', function() {
    return function getWatchCount() {
        var total = 0;
        angular.element('.ng-scope').each(function() {

            var scope = $(this).scope();
            total += scope.$$watchers ? scope.$$watchers.length : 0;
        });
        return (total);
    };
})
// get watch count
.run(['$rootScope', 'getWatchCount',
    function($rootScope, getWatchCount) {
        $rootScope.$watch(function() {
            $rootScope.watch = getWatchCount();
        });
    }
])
// set login and registration page background
.run(function($rootScope, $location) {
    $rootScope.$on('$routeChangeSuccess', function() {
        if ($location.$$path === '/login' || $location.$$path === '/register') {
            $rootScope.setBg = {
                background: '#192026'
            };
        } else {
            $rootScope.setBg = {
                background: 'white'
            };
        }
    });
});