'use strict';

angular.module('config.controllers', [])
  .controller('configCtrl', ['$scope', 'Config', 'Flash',
    function($scope, Config, Flash) {
        $scope.config = {};
        Config.get().then(function(response) {
            $scope.config = response.data;
        });

        $scope.test = 'in config page';

        //  bugConfig.insertConfig(config);


        $scope.addUser = function(email, name, username) {
            var newuser = {
                email: email,
                name: name,
                username: username
            };
            $scope.config.users.push(newuser);
            Config.update($scope.config);
            $scope.newuseremail = $scope.newusername = $scope.newuserusername = '';

        };


        $scope.deleteUser = function(usersIndex) {
            console.log('users', usersIndex);
            for (var i = 0; i < usersIndex.length; i++) {
                $scope.config.users.splice(usersIndex[i], 1);
            }
            Config.update($scope.config);
        };

        // $scope.deleteUser = function(users) {
        //     console.log('users', users);
        //     for (var i = 0; i < users.length; i++) {
        //         while ($scope.config.users.indexOf(users[i]) !== -1) {
        //             $scope.config.users.splice($scope.config.users.indexOf(users[i]), 1);
        //         }
        //     }
        //     bugConfig.updateConfiguration($scope.config);
        // };

        $scope.addKind = function(newkind) {
            $scope.config.kind.push(newkind);
           	Config.update($scope.config).then(function() {
                Flash.addAlert('success', 'Added ' + newkind + ' to Kind');
                $scope.newkind = ''; // clear input field after success
            }, function(response) {
                Flash.addAlert('danger', 'Error: could not add ' + newkind + ' to Kind');
            });
        };

        $scope.addConfigItem = function(category, newItem) {
            switch (category) {
                case 'kind':
                    $scope.config.kind.push(newItem);
                    $scope.newkind = '';
                    break;
                case 'platform':
                    $scope.config.platform.push(newItem);
                    $scope.newplatform = '';
                    break;
                case 'status':
                    $scope.config.status.push(newItem);
                    $scope.newstatus = '';
                    break;
                case 'category':
                    $scope.config.category.push(newItem);
                    $scope.newcategory = '';
                    break;
                case 'version':
                    $scope.config.version.push(newItem);
                    $scope.newversion = '';
                    break;
                case 'tofixin':
                    $scope.config.tofixin.push(newItem);
                    $scope.newtofixin = '';
                    break;
                case 'severity':
                    $scope.config.severity.push(newItem);
                    $scope.newseverity = '';
                    break;
                default:
                    Flash.addAlert('danger', 'Error occured');
                    break;
            }
            Config.update($scope.config).then(function() {
                Flash.addAlert('success', 'Added ' + newItem + ' to ' + category);
                $scope[newItem] = ''; // clear input field after success
            }, function(response) {
                Flash.addAlert('danger', 'Error: could not add ' + newItem + ' to ' + category);
            });

        };


        $scope.deleteConfigItem = function(category, items) {
            switch (category) {
                case 'kind':
                    console.log(items);
                    console.log($scope.config.kind);
                    for (var i = 0; i < items.length; i++) {
                        $scope.config.kind.splice($scope.config.kind.indexOf(items[i]), 1);
                    }
                    break;
                case 'platform':
                for (var i = 0; i < items.length; i++) {
                        $scope.config.platform.splice($scope.config.platform.indexOf(items[i]), 1);
                    }
                    break;
                case 'status':
                for (var i = 0; i < items.length; i++) {
                        $scope.config.status.splice($scope.config.status.indexOf(items[i]), 1);
                    }
                    break;
                case 'category':
                for (var i = 0; i < items.length; i++) {
                        $scope.config.category.splice($scope.config.category.indexOf(items[i]), 1);
                    }
                    break;
                case 'version':
                    for (var i = 0; i < items.length; i++) {
                        $scope.config.version.splice($scope.config.version.indexOf(items[i]), 1);
                    }
                    break;
                case 'tofixin':
                for (var i = 0; i < items.length; i++) {
                        $scope.config.tofixin.splice($scope.config.tofixin.indexOf(items[i]), 1);
                    }
                    break;
                case 'severity':
                    for (var i = 0; i < items.length; i++) {
                        $scope.config.severity.splice($scope.config.severity.indexOf(items[i]), 1);
                    }
                    break;
                default:
                    Flash.addAlert('danger', 'Error occured');
                    break;
            }

            Config.update($scope.config).then(function() {
                Flash.addAlert('success', 'Removed ' + items + ' from ' + category);
            }, function(response) {
                Flash.addAlert('danger', 'Error: could not remove ' + items + ' from ' + category);
            });


        };

    }
]);