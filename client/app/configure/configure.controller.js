'use strict';

angular.module('config.controllers', ['ivh.treeview'])
    .controller('configCtrl', ['$scope', '$location', 'Config', 'config', 'issues', 'Flash', 'ngProgress',
        function($scope, $location, Config, config, issues, Flash, ngProgress) {
            $location.$$search = null;

            $scope.config = config.data;
            $scope.unImportedIssues = _.sortBy(issues.data['github_issues'], 'project');

            $scope.tabs = [{
                    title: 'Field Options',
                    content: '',
                    hash: 'options'
                }, {
                    title: 'GitHub',
                    content: '',
                    hash: 'github'
                }
                /*{
                title: 'Others',
                content: '',
                hash: 'others'
            }*/
            ];

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
                    /* case 'others':
                    $scope.tabs[2].active = true;
                    break;*/
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

            $scope.importIssue = function(project, id, event) {
                event.currentTarget.parentElement.parentElement.cells[event.currentTarget.parentElement.parentElement.cells.length-2].textContent = '';
                event.currentTarget.text = 'Retrying...';
                // ngProgress.start();
                Config.importSingleGithibIssue(project, id).success(function(response) {
                    event.currentTarget.style.pointerEvents = 'none';
                    event.currentTarget.style.cursor = 'default';
                    event.currentTarget.parentElement.parentElement.cells[event.currentTarget.parentElement.parentElement.cells.length-2].textContent = response.msg;
                    if (response.msg.substring(0, 5) === 'Error') {
                        event.currentTarget.style.color = 'red';
                        event.currentTarget.text = 'Failed';
                        //Flash.addAlert('danger', 'Could not import #'+id + ' because of error: ' + response.msg);
                    } else {
                       event.currentTarget.style.color = 'green';
                        event.currentTarget.text = 'Imported';
                        // Flash.addAlert('success', 'Successfully imported with bugtrack id '+ response.bugtrackId);
                    }
                }, function(error) {
                    //  ngProgress.complete();
                    Flash.addAlert('danger', 'Oops! Something went wrong. Reload page and try again');
                });
            };


            $scope.importIssues = function(project) {
                ngProgress.start();
                Config.importGithubIssues(project).success(function(response) {
                    ngProgress.complete();
                    Flash.addAlert('success', 'Imported issues successfully');
                    $scope.importedIssues = response.issues;
                    Config.getUnImportedIssues().success(function(response) {
                        $scope.unImportedIssues = _.sortBy(response['github_issues'], 'project');
                    }).error(function(error) {
                        console.log('Could not retrive GitHub issues');
                    });

                }).error(function(error) {
                    ngProgress.complete();
                    Flash.addAlert('danger', 'Oops! Something went wront while importing.' + error);
                });
            };



        }
    ]);