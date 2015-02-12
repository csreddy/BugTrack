'use strict';

angular.module('config.controllers', ['ivh.treeview'])
    .controller('configCtrl', ['$scope', 'Config', 'Flash', 'ivhTreeviewMgr',
        function($scope, Config, Flash, ivhTreeviewMgr) {
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


            $scope.updateConfigOptions = function(category, items, operation) {
                Config.update(category, items, operation).then(function() {
                    var msg = (operation === 'add') ? 'Added ' + items + ' to ' + category : 'Removed ' + items.join(',') + ' from ' + category;
                    Flash.addAlert('success', msg);
                    $scope.newItem = {}; // clear input field after success
                    console.log($scope);
                    Config.get().then(function(response) {
                        $scope.config[category] = response.data[category];
                    });
                }, function(error) {
                    Flash.addAlert('danger', error.statusText + ': Oops! Could not update config. Please try again.');
                    //  Flash.addAlert('danger', JSON.stringify(error));
                });

            };


            $scope.addUsersToGroup = function(group, users) {
                Config.addUsersToGroup(group, users).then(function() {
                    Config.get().then(function(response) {
                        $scope.config = response.data;
                    });

                }, function(error) {
                    Flash.addAlert('danger', error.statusText + ': Oops! Could not add user(s) to the group. Please try again.');
                });
            };

            $scope.selectUsers = function(node, isSelected, tree) {
                //Config.removeUsersFromGroup(node, isSelected);
                console.log(node);
                console.log('parent', tree);
                //var parent = 
            };

            $scope.expand = function() {
                ivhTreeviewMgr.expandRecursive($scope.config.groups);
            };

            $scope.collapse = function() {
                ivhTreeviewMgr.collapseRecursive($scope.config.groups);
            };



        }
    ]);