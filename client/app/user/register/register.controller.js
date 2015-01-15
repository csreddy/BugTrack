'use strict';

angular.module('user.controllers')
 .controller('registerCtrl', ['$scope', '$location', 'Flash', 'User', 'Config',
    function($scope, $location, Flash, User, Config) {

        $scope.config = {};
        Config.get().then(function(response) {
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
                User.create(user).then(function() {
                    // update config
                    $scope.config.users.push({
                        'email': user.email,
                        'name': user.name,
                        'username': user.username
                    });
                    Config.update($scope.config);

                    // login user automatically after successfull registration
                    User.login({
                        username: user.username,
                        password: user.password
                    }).then(function(response) {
                            $location.path('/home');
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