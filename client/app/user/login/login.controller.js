'user strict';

var app = angular.module('user.controllers', ['ngCookies']);

app.controller('loginCtrl', ['$scope', '$location', '$cookieStore', 'Flash', '$http', 'User', '$window',
    function($scope, $location, $cookieStore, Flash, $http, User, $window) {

        $scope.username = 'btuser';
        $scope.password = 'admin';


        $scope.login = function() {
            console.log('login called');
            console.log($scope.username, $scope.password);
            var payload = {
                username: $scope.username,
                password: $scope.password
            };

            User.login(payload).then(function(response) {
                    //$location.path('/user/' + response.data.username);
                    $location.path('/home');
                    User.getInfo().success(function(user) {
                        Flash.addAlert('success', 'Welcome! ' + user.name);
                        $window.sessionStorage.currentUser = user.name;
                    });
                },
                function(response) {
                    Flash.addAlert('danger', response.data.message);
                });
        };

    }
]);


app.controller('logoutCtrl', ['$http', 'User', 'Flash', '$location', '$window',
    function($http, User, Flash, $location, $rootScope, $window) {
        User.logout().then(function() {
            $location.path('/login');
            Flash.addAlert('success', 'user logged out');
            //$window.sessionStorage.currentUser = undefined;
        }, function(error) {
            Flash.addAlert('danger', 'something went wrong\n'+ error);
        });
    }
]);

app.controller('userRedirectCtrl', ['$location', 'getCurrentUser',
    function($location, getCurrentUser) {
        try {
            $location.path('/user/' + getCurrentUser.username);
        } catch (e) {
            $location.path('/login');
        }

    }
]);

app.controller('userProfileCtrl', ['$scope', '$location', 'currentUser', 'Search', 'Flash',
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