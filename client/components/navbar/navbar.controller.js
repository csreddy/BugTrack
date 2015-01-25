'user strict';

var app = angular.module('navbar.controllers', []);

/**
 * hide irrelelvant navbar links when user is logged in
 */

app.controller('navbarCtrl', ['$rootScope', '$scope', '$location', '$window',
    function($rootScope, $scope, $location, $window) {

        $rootScope.navbarUser = $window.sessionStorage.currentUser;

        $scope.selected = function(page) {
            var currentRoute = $location.path().substring(1) || 'home';
            return page === currentRoute ? 'active' : '';
        };

        $rootScope.quickSearch = function(bugId) {
            $location.path('/bug/' + bugId);
        };


    }
]);