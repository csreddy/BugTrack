'use strict';

angular.module('user.controllers')
    .controller('profileCtrl', ['$scope', '$location', 'currentUser', 'Search', 'Flash', 'User', 'modalService',
        function($scope, $location, currentUser, Search, Flash, User, modalService) {
            $scope.username = currentUser.name || undefined;
            //$scope.userQueries = JSON.stringify(currentUser.savedQueries, null, 6);
            $scope.userQueries = currentUser.savedQueries;
             $scope.isCollapsed = true;

            // for user saved searches
            $scope.search = function(query) {
                $location.path('#');
                Search.search(query).success(function(response) {
                    console.log(response);
                    Flash.addAlert('success', 'Returned ' + (response[0].total) + ' results');
                }).error(function(error) {
                    Flash.addAlert('danger', ' :error occured' + error);
                });
            };


            // formats query json for better human redability
            $scope.format = function(query) {
                return JSON.stringify(query, null, 3);
            };


            // delete query
            $scope.deleteQuery = function(queryName) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    bodyText: '',
                    headerText: 'Are you sure you want to delete query: ' + queryName + '?'
                };

                modalService.showModal({}, modalOptions).then(function() {
                    User.deleteQuery(queryName).then(function() {
                        Flash.addAlert('success', 'Deleted query');
                    }, function() {
                        Flash.addAlert('danger', 'Could not delete query');
                    });
                }, function() {
                    // do nothing
                });
            };

            // get query results
            $scope.getResults = function(query) {
                $location.path('/home');
                $location.$$search = query;
            };

        }
    ]);