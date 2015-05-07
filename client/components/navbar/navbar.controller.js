'user strict';

var app = angular.module('navbar.controllers', []);

/**
 * hide irrelelvant navbar links when user is logged in
 */

app.controller('navbarCtrl', ['$rootScope', '$scope', '$location', '$window', 'Search', 'Flash',
    function($rootScope, $scope, $location, $window, Search, Flash) {

        $rootScope.navbarUser = $window.localStorage.currentUser;

        $scope.selected = function(page) {
            var currentRoute = $location.path() || 'home';
            return page === currentRoute ? 'active' : '';
        };

        /*  $rootScope.quickSearch = function(bugId) {
            $location.path('/bug/' + bugId);
        };*/

        $rootScope.quickSearch = function(id) {
            Search.search({
                q: 'id:' + id
            }).success(function(response) {
                try {
                    var url = '/' + response[1].content.kind.toLowerCase() + '/' + id;
                    $location.path(url);
                } catch (e) {
                    $location.path('/404');
                }
            }).error(function(error) {
                Flash.addAlert('danger', 'Oops! something went wrong. Reload page and try again');
            });
        };
    }
]);