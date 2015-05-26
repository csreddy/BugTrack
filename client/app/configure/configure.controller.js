'use strict';

angular.module('config.controllers', ['ivh.treeview'])
    .controller('configCtrl', ['$scope', '$location', 'Config', 'config', 'issues', 'Flash', 'ngProgress',
        function($scope, $location, Config, config, issues, Flash, ngProgress) {
            $location.search({}).replace();
            $scope.config = config.data;
            $scope.config.users = _.sortBy($scope.config.users, 'name');
            $scope.unImportedIssues = _.sortByAll(issues.data['github_issues'], ['project', 'githubId']);

            $scope.tabs = [{
                title: 'Field Options',
                content: '',
                hash: 'options'
            }, {
                title: 'GitHub',
                content: '',
                hash: 'github'
            }, {
                title: 'Users',
                content: '',
                hash: 'users'
            }];

            // this is for groups
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
                case 'users':
                    $scope.tabs[2].active = true;
                    break;
                default:
                    $scope.tabs[0].active = true;
            }

            $scope.newUser = {
                email: '',
                name: '',
                username: '',
                githubUsername: ''
            };


            $scope.updateConfigOptions = function(category, items, operation) {
                Config.update(category, items, operation).then(function() {
                    var msg = (operation === 'add') ? 'Added <b>' + items + '</b> to ' + category : 'Removed ' + items.join(',') + ' from ' + category;
                    // if (category === 'groups' && operation === 'delete') {
                    //     msg = 'Removed group';
                    // }
                    if (category === 'users' && operation === 'add') {
                        msg = (operation === 'add') ? 'Added <b>' + items.name + '</b> to ' + category : 'Removed  users from ' + category;
                    }

                    Flash.addAlert('success', msg);
                    $scope.newItem = {}; // clear input field after success
                    console.log($scope);
                    Config.get().then(function(response) {
                        $scope.config[category] = response.data[category];
                    });
                }, function(error) {
                    // Flash.addAlert('danger', error.statusText + ': Oops! Could not update config. Please try again.');

                    Flash.addAlert('danger', error.data.error);
                });

            };


            $scope.addUsersToGroup = function(group, users) {
                Config.addUsersToGroup(group, users).then(function() {
                    Config.get().then(function(response) {
                        $scope.config = response.data;
                    });

                }, function(error) {
                    Flash.addAlert('danger', error.statusText + ': Oops! Could not add user(s) to the group.' + error.data.error);
                });
            };

            // get all selected items from the groups tree
            function getSelectedChildren2(tree, selectedItems, ancestors) {
                console.log('TREE:', tree);
                var selectedChildren = selectedItems || [];
                for (var i = 0; i < tree.length; i++) {
                    tree[i].ancestors = ancestors || [];
                    //  console.log('tree:', tree[i].label);
                    console.log('tree-selected:', tree[i].selected);
                    if (tree[i].hasOwnProperty('selected') && !tree[i].selected && tree[i].children) {
                            if (tree[i].parent) {
                                tree[i].ancestors.push(tree[i].parent);
                               // tree.ancestors = _(tree[i].ancestors).reverse().value();
                            }
                            console.log('calling recursion...');
                            getSelectedChildren2(tree[i].children, selectedChildren, tree[i].ancestors);
                    }
                        if (tree[i].selected) {
                            console.log('child selected');
                           // tree[i].ancestors.pop();
                            selectedChildren.push(tree[i]);
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
                //  event.currentTarget.parentElement.parentElement.cells[event.currentTarget.parentElement.parentElement.cells.length-2].textContent = '';
                // event.currentTarget.text = 'Retrying...';
                ngProgress.start();
                Config.importSingleGithibIssue(project, id).success(function(response) {
                    ngProgress.complete();
                    //    event.currentTarget.style.pointerEvents = 'none';
                    //   event.currentTarget.style.cursor = 'default';                    
                    if (response.msg.substring(0, 5) === 'Error') {
                        //     event.currentTarget.style.color = 'red';
                        //   event.currentTarget.text = 'Failed';
                        // event.currentTarget.parentElement.parentElement.cells[event.currentTarget.parentElement.parentElement.cells.length-2].textContent = response.msg;
                        Flash.addAlert('danger', 'Could not import #' + id + ' because of error: ' + response.msg);
                    } else {
                        //   event.currentTarget.style.color = 'green';
                        //   event.currentTarget.text = 'Imported';
                        //   event.currentTarget.parentElement.parentElement.cells[event.currentTarget.parentElement.parentElement.cells.length-2].textContent = response.msg + ' with id ' + response.bugtrackId;
                        Flash.addAlert('success', 'Successfully imported with bugtrack Id ' + response.bugtrackId);
                    }
                }, function(error) {
                    ngProgress.complete();
                    Flash.addAlert('danger', 'Oops! Something went wrong. Reload page and try again');
                });
            };

            $scope.importAs = function(project, id, kind) {
                ngProgress.start();
                Config.importSingleGithibIssue(project, id, kind).success(function(response) {
                    ngProgress.complete();
                    if (response.msg.substring(0, 5) === 'Error') {
                        Flash.addAlert('danger', 'Could not import #' + id + ' because of error: ' + response.msg);
                    } else {
                        Flash.addAlert('success', 'Successfully imported with bugtrack Id ' + response.bugtrackId);
                    }
                    Config.getUnImportedIssues().success(function(response) {
                        $scope.unImportedIssues = _.sortByAll(response['github_issues'], ['project', 'githubId']);

                    }).error(function(error) {
                        console.log('Could not retrive GitHub issues');
                        Flash.addAlert('danger', 'Oh snap! Could not retrive GitHub issues');
                    });
                }, function(error) {
                    ngProgress.complete();
                    Flash.addAlert('danger', 'Oops! Something went wrong. Reload page and try again');
                });
            };


            $scope.importIssues = function(project, event) {
                //console.log('event', event)
                event.currentTarget.disabled = true;
                event.currentTarget.innerHTML = "<i class='fa fa-spinner'></i> Importing...";
                // ngProgress.start();
                Config.importGithubIssues(project).success(function(response) {
                    event.currentTarget.disabled = false;
                    event.currentTarget.innerHTML = "<i class='fa fa-github'></i> Import";
                    // ngProgress.complete();
                    Flash.addAlert('success', 'Import completed');
                    $scope.importedIssues = _.sortByAll(response.issues, ['msg', 'githubId']);
                    Config.getUnImportedIssues().success(function(response) {
                        $scope.unImportedIssues = _.sortByAll(response['github_issues'], ['project', 'githubId']);
                    }).error(function(error) {
                        console.log('Could not retrive GitHub issues');
                        Flash.addAlert('danger', 'Oh snap! Could not retrive GitHub issues');
                    });

                }).error(function(error) {
                    //   ngProgress.complete();
                    event.currentTarget.innerHTML = "<i class='fa fa-github'></i> Import";
                    event.currentTarget.disabled = false;
                    Flash.addAlert('danger', 'Oops! Something went wront while importing.' + error);
                });
            };



        }
    ]);