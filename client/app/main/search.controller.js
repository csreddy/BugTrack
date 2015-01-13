'user strict';

var app = angular.module('search.controllers', []);

app.controller('searchCtrl', ['$rootScope', '$scope', '$location', '$filter', 'Search', 'Flash', 'bugConfig', 'currentUser', 'User', 'config',
    function($rootScope, $scope, $location, $filter, Search, Flash, bugConfig, currentUser, User, config) {
        $scope.bugs = [];
        $scope.currentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.config = config;
        $scope.userDefaultSearch = true;
        $scope.form = {};

        $scope.user =  currentUser;
              
}]);