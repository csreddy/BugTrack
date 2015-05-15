'use strict';

angular.module('config.controllers', ['ivh.treeview'])
    .controller('configCtrl', ['$scope', '$location', 'Config', 'Flash', 'ngProgress',
        function($scope, $location, Config, Flash, ngProgress) {
            $location.$$search = null;
            $scope.config = {};
            Config.get().then(function(response) {
                $scope.config = response.data;
            });


            $scope.tabs = [{
                title: 'Field Options',
                content: 'Dynamic content 1',
                hash: 'options'
            }, {
                title: 'GitHub',
                content: 'Dynamic content 2',
                hash: 'github'
            }, {
                title: 'Others',
                content: 'Dynamic content 2',
                hash: 'others'
            }];

            $scope.users = {
                selectedChildren: []
            };


            $scope.selectTab = function(tabPath) {
                $location.hash(tabPath);
            };

            switch ($location.$$hash) {
                case 'options':
                    $scope.tabs[0].active = true;
                    break;
                case 'github':
                    $scope.tabs[1].active = true;
                    break;
                case 'others':
                    $scope.tabs[2].active = true;
                    break;
                default:
                    $scope.tabs[0].active = true;
            }

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
                    var msg = (operation === 'add') ? 'Added <b>' + items + '</b> to ' + category : 'Removed ' + items.join(',') + ' from ' + category;
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
                    // Flash.addAlert('danger', error.statusText + ': Oops! Could not update config. Please try again.');

                    Flash.addAlert('danger', error.data.message);
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


            $scope.importIssues = function(project) {
                ngProgress.start();
                Config.importGithubIssues(project).success(function(response) {
                    ngProgress.complete();
                    Flash.addAlert('success', 'Imported issues successfully');
                    $scope.importedIssues = response.issues;
                    console.log('response', response);
                }).error(function(error) {
                    ngProgress.complete();
                    Flash.addAlert('danger', 'Oops! Something went wront while importing.' + error);
                });
            };

            $scope.goto = function(id) {
                Config.goto(id).success(function(response) {
                console.log('response', response);
                   
                   $location.path(response.uri);
                   return response.uri;
                }, function(error) {
                   // $location.path('/404');
                });
            };

        }
    ]);
