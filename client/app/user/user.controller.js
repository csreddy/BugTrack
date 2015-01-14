'user strict';

var app = angular.module('user.controllers', ['ngCookies']);

app.controller('loginCtrl', ['$scope', '$location', '$cookieStore', 'Flash', '$http', 'User',
    function($scope, $location, $cookieStore, Flash, $http, User) {

        $scope.username = 'sreddy';
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
                    });
                },
                function(response) {
                    Flash.addAlert('danger', response.data.message);
                });
        };

    }
]);


app.controller('logoutCtrl', ['$http', 'Flash', '$location', '$rootScope',
    function($http, Flash, $location, $rootScope) {
        $http.get('/logout').then(function() {
            console.log('logged out');
            $location.path('/login');
            Flash.addAlert('success', 'user logged out');
            $rootScope.navbarUser = undefined;
        }, function() {
            Flash.addAlert('danger', 'something went wrong');
        });
    }
]);

app.controller('registerCtrl', ['$scope', '$location', 'Flash', 'User', 'bugConfigFactory',
    function($scope, $location, Flash, User, bugConfigFactory) {

        $scope.config = {};
        bugConfigFactory.getConfig().then(function(response) {
            $scope.config = response.data;
        });


        $scope.createUser = function() {

            // TODO : check if user already exists 

            console.log($scope.user.password1);
            if ($scope.user.password1 !== $scope.user.password2) {
                Flash.addAlert('danger', 'passwords did not match');
            } else {
                var user = {};
                user.name = $scope.user.name;
                user.email = $scope.user.email;
                user.username = $scope.user.username;
                user.password = $scope.user.password1; //md5($scope.user.password1);
                user.createdAt = new Date();
                user.modifiedAt = new Date();
                user.savedQueries = {
                    default: {}
                };
                User.create(user.username, user).then(function() {
                    // update config
                    $scope.config.users.push({
                        'email': user.email,
                        'name': user.name,
                        'username': user.username
                    });
                    bugConfigFactory.updateConfiguration($scope.config);

                    // login user automatically after successfull registration
                    User.login({
                        username: user.username,
                        password: user.password
                    }).then(function(response) {
                            $location.path('/');
                            User.getInfo().success(function(user) {
                                Flash.addAlert('success', 'Welcome! ' + user.name);
                            });
                        },
                        function(response) {
                            Flash.addAlert('danger', response.data.message);
                        });

                    //  console.log('user', user.fullname);
                    // Flash.addAlert('success', '<b>' + user.username + '</b> was successfully created');

                }),
                function(response) {
                    Flash.addAlert('danger', response.data.error.message);
                };
            }

        };

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