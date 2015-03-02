'use strict';

angular.module('config.controllers', ['ivh.treeview'])
    .controller('configCtrl', ['$scope', 'Config', 'Flash',
        function($scope, Config, Flash) {
            $scope.config = {};
            Config.get().then(function(response) {
                $scope.config = response.data;
            });

            $scope.users = {
                selectedChildren: []
            };


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
                    // if (category === 'groups' && operation === 'delete') {
                    //     msg = 'Removed group';
                    // }

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

            // get all selected items from the groups tree
            function getSelectedChildren2(tree, selectedItems, ancestors) {
                var selectedChildren = selectedItems || [];
                for (var i = 0; i < tree.length; i++) {
                    tree[i].ancestors = ancestors || [];
                    // console.log('tree[i]:', tree[i]);
                    if (tree[i].children && tree[i].children.length > 0) {

                        if (tree[i].parent) tree[i].ancestors.push(tree[i].parent);
                        if (tree[i].selected) {
                            tree[i].ancestors.pop();
                            selectedChildren.push(tree[i]);
                        } else {
                            getSelectedChildren2(tree[i].children, selectedChildren, tree[i].ancestors);
                        }
                    } else {
                        if (tree[i].selected) {
                            selectedChildren.push(tree[i]);
                        }
                    }
                }
                return selectedChildren;
            }

            function getSelectedChildren(tree) {
                var selectedItems = [];
                for (var i = 0; i < tree.length; i++) {
                    for (var j = 0; j < tree[i].children.length; j++) {
                        if (tree[i].children[j].selected) {
                            selectedItems.push(tree[i].children[j]);
                        }
                    }
                }
                return selectedItems;
            }


            $scope.selectUsers = function(node, isSelected, tree) {
                $scope.users.selectedChildren = getSelectedChildren(tree);
                // console.log('$scope.user.selected', $scope.users.selectedChildren);
            };

            $scope.selectUsers2 = function(node, isSelected, tree) {
                $scope.users.selectedChildren = getSelectedChildren2(tree);
                console.log('$scope.user.selected', $scope.users.selectedChildren);
            };


            $scope.removeUsersFromGroup = function() {
                Config.removeUsersFromGroup($scope.users.selectedChildren).then(function() {
                    Flash.addAlert('success', 'Users removed successfully');
                    Config.get().then(function(response) {
                        $scope.config.groups = response.data.groups;
                    });
                }, function(error) {
                    Flash.addAlert('danger', error.statusText);
                });
            };

            // expan tree
            $scope.expand = function() {
                Config.expandGroups($scope.config.groups);
            };

            // collapse tree
            $scope.collapse = function() {
                Config.collapseGroups($scope.config.groups);
            };

        }
    ]);