'use strict';

angular.module('user.controllers')
.controller('profileCtrl', ['$scope', '$location', 'currentUser', 'Search', 'Flash',
    function($scope, $location, currentUser, Search, Flash) {
        $scope.username = currentUser.name || undefined;
        //$scope.userQueries = JSON.stringify(currentUser.savedQueries, null, 6);
        $scope.userQueries = currentUser.savedQueries;

        // for user saved searches
        $scope.search = function(query) {
            $location.path('#');
            Search.search(query).success(function(response) {
                console.log(response);
                Flash.addAlert('success', 'Returned ' + (response[0].total) + ' results');
            }).error(function(error) {
                Flash.addAlert('danger', ' :error occured' + error );
            });
        };

        $scope.editInfo = function() {};

    }
]);