'user strict';

var app = angular.module('search.controllers', ['ivh.treeview', 'ngProgress']);

app.controller('searchCtrl', ['$rootScope', '$scope', '$location', '$filter', 'Search', 'defaultSearchCriteria', 'Flash', 'currentUser', 'User', 'config', '$timeout', 'ivhTreeviewMgr', 'Config', 'ngProgress',
    function($rootScope, $scope, $location, $filter, Search, defaultSearchCriteria, Flash, currentUser, User, config, $timeout, ivhTreeviewMgr, Config, ngProgress) {

        $scope.home = 'Home page';
        $scope.form = angular.copy(defaultSearchCriteria) || {};
        $scope.bugs = [];
        $scope.currentPage = parseInt($location.search().page) || 1;
        $scope.config = angular.copy(config);
        $scope.form.groups = angular.copy($scope.preSelectedGroups) || angular.copy(config.groups);
        $scope.userDefaultSearch = false;
        $scope.nvfe = false;
        $scope.pageLength = 20;
        $scope.facetName = '';
        $scope.isPaginationEvent = false;
        $scope.groupCriteria = 'submittedBy';
        $scope.totalItems = {
            all: 0,
            bugs: 0,
            tasks: 0
        };
        $scope.facetOrder = [{
            type: 'assignTo',
            title: 'Assigned To'
        }, {
            type: 'submittedBy',
            title: 'Submitted By'
        }, {
            type: 'category',
            title: 'Category'
        }, {
            type: 'status',
            title: 'Status'
        }, {
            type: 'severity',
            title: 'Severity'
        }, {
            type: 'priority',
            title: 'Priority'
        }, {
            type: 'createdAt',
            title: 'Created On'
        }, {
            type: 'publishStatus',
            title: 'Publish Status'
        }]; //'platform'

        var conditionNames = ['q', 'kind', 'status', 'severity', 'priority', 'category', 'version', 'fixedin', 'tofixin', 'assignTo', 'submittedBy', 'page', 'pageLength'];

        $scope.tabs = [{
            title: 'Bug',
            content: $scope.bugs
        }, {
            title: 'Task',
            content: $scope.tasks
        }];

        // for calendar   
        $scope.cal = {
            open: function(when, $event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.cal.fromOpened = (when === 'from') ? true : false;
                $scope.cal.toOpened = (when === 'to') ? true : false;
            },
            format: 'MM-dd-yyyy'
        };

        // initial funtion which executes when the page is loaded
        $scope.init = function() {
            // if url contains search params then get that search results
            if (Object.keys($location.search()).length > 0) {
                console.log('init()', $location.search());
                // set form selections according to url query params
                $scope.form = parseQueryParams($location.search());
                search($location.search());
                if (isBug()) {
                    $scope.tabs[0].active = true;
                    $scope.tabs[1].active = false;
                }
                if (isTask()) {
                    $scope.tabs[0].active = false;
                    $scope.tabs[1].active = true;
                }

                // due to pagination directive bug, current page number does not get higlighted when 
                // browser back/fwd is clicked. This is a hack to fix it.
                $timeout(function() {
                    highlightPageNumber($location.search().page);
                }, 1000);
                $scope.form.groups = angular.copy($scope.preSelectedGroups) || angular.copy(config.groups);
                console.log('preSelectedGroups', $scope.preSelectedGroups);
                /*   
            // check if the url matches users default query, if true then select checkbox to indicate
                if (angular.equals(searchCriteria, currentUser.savedQueries.default)) {
                    $scope.userDefaultSearch = true;
                }
            */
            } else if (Object.keys(currentUser.savedQueries.default).length > 0) {
                // if the user has default query then set the $scope.form to user's default query
                // otherwise initialize with app default query
                console.log('user has default search....');
                $location.search(currentUser.savedQueries.default);
                $scope.form = parseQueryParams($location.search());
                $scope.userDefaultSearch = true;
            } else {
                $scope.form.assignTo = currentUser.username;
                search(convertFormSelectionsToQueryParams());
            }
        };

        // for form selection using checkboxes and dropdowns
        $scope.addSelectedValueToQuery = function() {
            angular.forEach(conditionNames, function(item) {
                if ($scope.form[item]) {
                    $location.search(item, setSelectedItems($scope.form[item]));
                }
            });
            console.log('addSelectedValueToQuery', $scope.form);
        };

        $scope.addSelectedValueToQuery2 = function(facetName, selectedItem) {
            var index = getObjectIndex($scope.form.facets[facetName], selectedItem.name);
            $scope.form.facets[facetName][index].selected = true;
        };

        // toggle advanced search panel visibility
        $scope.showMore = true;
        $scope.showAdvancedSearch = function() {
            if ($scope.showMore) {
                $scope.showMore = false;
            } else {
                $scope.showMore = true;
            }
        };



        $scope.mainSearch = function() {
            console.log('SCOPE.FORM', $scope.form);
            $scope.isPaginationEvent = false;
            $location.search(convertFormSelectionsToQueryParams());
            $location.search('page', 1); // start from page 1 for every search
            if (isBug()) {
                $scope.tabs[0].active = true;
                $scope.tabs[1].active = false;
            }
            if (isTask()) {
                $scope.tabs[0].active = false;
                $scope.tabs[1].active = true;
            }


        };

        $scope.getItems = function(kind) {
            if (kind === 'Bug') $location.search('kind', 'Bug');
            if (kind === 'Task') $location.search('kind', 'Task')
            $location.search('page', 1); // start from page 1 for every search
        };



        // clear form. returns all bugs by default.
        // will change to return tasks, rfes and others when 
        // they are implemented
        $scope.clear = function() {
            console.log('clear fields');
            $scope.isPaginationEvent = false;
            $scope.form = angular.copy(defaultSearchCriteria);
            $scope.preSelectedGroups = config.groups;
            $scope.form.groups = $scope.preSelectedGroups;
            ivhTreeviewMgr.deselectAll($scope.form.groups);
            ngProgress.start();
            return Search.search($location.search({})).success(function(response) {
                processResult(response);
                ngProgress.complete();
            }).error(function(error) {
                Flash.addAlert('danger', error.body.errorResponse.message);
                ngProgress.complete();
            });
        };


        $scope.hideFacetBox = function() {
            console.log('hide facet');
            angular.element("div[id='facetBox']").hide();
            // angular.element('span#showFacetBox').attr('style', 'display:none');
        };

        $scope.showFacetBox = function() {
            console.log('show facet');
            angular.element("div[id='facetBox']").show();
            // angular.element('a#showFacetBox').attr('style', 'display:block');
        };


        // go to bug details page when clicked on bug id
        $scope.goToBug = function(uri) {
            $location.path(uri);
        };

        // get bugs for the current page
        $scope.gotoPage = function(pageNo) {
            console.log($location.search());
            $location.search('page', pageNo);
            $scope.isPaginationEvent = true;
            search($location.search());
        };

        // for table column sorting
        var orderBy = $filter('orderBy');
        $scope.order = function(predicate, reverse) {
            $scope.bugs = orderBy($scope.bugs, predicate, reverse);
        };

        // watch the buglist collection returned from the search response
        // and get details of each bug for rendering in table the UI
        $scope.$watchCollection('bugList', function() {
            getBugDetails();
        }, true);

        // watch the buglist collection returned from the search response
        // and get details of each bug for rendering in table the UI
        $scope.$watchCollection('taskList', function() {
            getTaskDetails();
        }, true);


        $scope.$watchCollection('form', function() {
            $scope.prettyForm = JSON.stringify($scope.form, null, 6);
        }, true);


        // save users default search qyery, performs this search whenever user reloads the page
        //  with no search params in the url
        $scope.saveUserDefaultSearch = function() {
            if (!$scope.form.userDefaultSearch) {
                console.log('saved......');
                //var searchCriteria = angular.copy(convertFormSelectionsToQueryParams());
                User.saveDefaultQuery($location.search()).success(function() {
                    $scope.userDefaultSearch = true;
                    Flash.addAlert('success', 'Default search query saved');
                }).error(function(error) {
                    Flash.addAlert('danger', 'Oops! Could not save query. Please try again');
                    console.log(error);
                });
            }
        };

        // selecting checkbo nvfe  selects n/v/f/e checkboxes
        $scope.selectNVFE = function(select) {
            console.log('select n/v/f/e');
            $scope.form.status.forEach(function(item) {
                if (item.name === 'New' || item.name === 'Verify' || item.name === 'Fix' || item.name === 'External') {
                    item.value = select;
                }
            });
            $scope.addSelectedValueToQuery();
        };

        // boolean to show/hide facet dropdown
        $scope.showFacetDropdown = function(facetKind, facetType) {
            var show = false;
            if (facetType.length === 0) {
                show = false;
            }
            if (facetKind === 'assignTo') {
                show = true;
            }
            if (facetKind === 'submittedBy') {
                show = true;
            }

            if (facetKind === 'category') {
                show = true;
            }
            return show;
        };

        // another variation to show/hide facet dropdown
        $scope.showFacetDropdown2 = function(facetName) {
            var show = false;
            if ($scope.form.facets[facetName] || !$scope.form.facets[facetName] instanceof Array) {
                show = false;
            }
            if (facetName === 'assignTo') {
                show = true;
            }
            if (facetName === 'submittedBy') {
                show = true;
            }

            if (facetName === 'category') {
                show = true;
            }
            return show;
        };

        // clear dropdown selection
        $scope.clearSelection = function(selection) {
            console.log('selection', selection);
            $scope.form[selection] = null;
            // $location.search(selection, null);
        };

        // highlight page number in the pagination button list
        function highlightPageNumber(pageNo) {
            angular.forEach(angular.element('#pager li'), function(li) {
                if (angular.element(li).text() === pageNo.toString()) {
                    angular.element(li).addClass('active');
                } else {
                    angular.element(li).removeClass('active');
                }
            });
        }

        // watch for location changes and extract search pararms from the url and perform search
        $scope.$on('$locationChangeSuccess', function() {
            console.log($location.url());
            if ($location.url().indexOf('/home') > -1) {
                $scope.currentPage = $location.search().page || 1;

                // due to pagination directive bug, current page number does not get higlighted when 
                // browser back/fwd is clicked. This is a hack to fix it.
                highlightPageNumber($scope.currentPage);

                if (!$scope.isPaginationEvent) {
                    // for form selections to auto fill when browser back/fwd is clicked
                    if (Object.keys($location.search()).length === 0) {
                        // reset search form to default

                        $scope.form = angular.copy(defaultSearchCriteria);
                    } else {
                        // get form selections from query params
                        $scope.form = parseQueryParams($location.search());

                    }
                    search($location.search());
                }
                $scope.isPaginationEvent = false;
            }
            console.log('form:', $scope.form);
        });

        // set group criteria
        $scope.setGroupCriteria = function(groupCriteria) {
            $scope.form.groupCriteria = groupCriteria.value;
        };

        // collect all selected users/groups from groups tree
        $scope.selectGroups = function(node, isSelected, tree) {
            $scope.form.groupUsers = getSelectedUsers(tree);
            // console.log('$scope.form.group.groupUsers', $scope.form.groupUsers);
        };

        // expand groups tree
        $scope.expand = function() {
            Config.expandGroups($scope.form.groups);
        };

        // collapse groups treee
        $scope.collapse = function() {
            Config.collapseGroups($scope.form.groups);
        };

        $scope.processRadio = function(obj) {
            console.log('processRadio()');
            var indexOfCheckedRadioInTheKindObject = $scope.form.kind.indexOf(obj);
            angular.forEach($scope.form.kind, function(value, key) {
                if (indexOfCheckedRadioInTheKindObject !== key) {
                    value.selected = false;
                    console.log(key + ':', value.selected);
                }
            });
        };

        /*********************************************
         *
         *
         *   private functions
         *
         *
         *********************************************/

        // search with passed search criteria
        function search(searchCriteria) {
            if (searchCriteria.groupUsers) {
                if (searchCriteria.groupUsers.length === 0) {
                    delete searchCriteria.groupCriteria;
                    delete searchCriteria.groupUsers;
                }
            }
            ngProgress.start();
            return Search.search(searchCriteria).success(function(response) {
                processResult(response);
                console.log('RESULT', response[0].report);
                console.log('scope.form.groups', $scope.form.groups);
                //console.log('search', response);
                ngProgress.complete();
            }).error(function(error) {
                Flash.addAlert('danger', error.body.errorResponse.message);
                ngProgress.complete();
            });
        }

        function processResult(searchResult) {
            $scope.bugs = [];
            $scope.tasks = [];

            angular.forEach(_.pluck(searchResult.slice(1), 'content'), function(item) {
                if (item.kind === 'Bug') {
                    $scope.bugs.push(item);
                }
                if (item.kind === 'Task') {
                    $scope.tasks.push(item);
                }
            });


            $scope.form.facets = angular.copy(processFacets(searchResult[0].facets));
            // groups does not come from search resposne
            // so we artifically attach groups to the search response
            if ($location.search().groupUsers) {
                $scope.form.groups = angular.copy($scope.preSelectedGroups);
            } else {
                $scope.form.groups = angular.copy(config.groups);
            }
            // $scope.form.groups = angular.copy($scope.preSelectedGroups) || angular.copy(config.groups);
            renameEmptyFacets($scope.form.facets);
            preselectFacetCheckBox($scope.form.facets);
            $scope.searchMetrics = searchResult[0].metrics;
            $scope.totalItems = {
                all: searchResult[0].total,
                bugs: $scope.bugs.length,
                tasks: $scope.tasks.length
            };
        }


        // process the facets returned from results into managable 
        // arrays so that it can be included as part of the search form
        function processFacets(facetsFromSearch) {
            var facetArray = {};

            angular.forEach(facetsFromSearch, function(facet, key) {
                facetArray[key] = facet.facetValues;
                // add extra property to each object in facetarray
                angular.forEach(facetArray[key], function(item) {
                    item.selected = false;
                });
            });

            return facetArray;
        }
        // check if search param contains Bug collection
        function isBug() {
            var exists = false;
            if ($location.search().kind) {
                if ($location.search().kind.indexOf('Bug') > -1) {
                    exists = true;
                }
            }
            return exists;
        }

        // check if search param contains Task collection
        function isTask() {
            var exists = false;
            if ($location.search().kind) {
                if ($location.search().kind.indexOf('Task') > -1) {
                    exists = true;
                }
            }
            return exists;
        }

        // if the search query contains facets selection then automatically 
        // pre-select after the results are retained
        function preselectFacetCheckBox(facetsFromSearch) {
            var queryParams = angular.copy($location.search());
            angular.forEach(queryParams, function(item, key) {
                if (key.indexOf('f:') > -1) {
                    for (var i = 0; i < queryParams[key].length; i++) {
                        angular.forEach(facetsFromSearch[key.replace(/f:/, '')], function(facet) {
                            if (facet.name === queryParams[key][i] || facet.name === queryParams[key]) {
                                facet.selected = true;
                            }
                        })
                    }
                }
            });
            return facetsFromSearch;
        }

        // get bug details for table display
        function getBugDetails() {
            $scope.bugs = [];
            angular.forEach($scope.bugList, function(bug) {
                $scope.bugs.push(bug.content);
            });
        }

        // get task details for table display
        function getTaskDetails() {
            $scope.tasks = [];
            angular.forEach($scope.taskList, function(task) {
                $scope.tasks.push(task.content);
            });
        }

        // rename empty value facets, show them as (empty) in the ui
        function renameEmptyFacets(facets) {
            angular.forEach(facets, function(v) {
                for (var i = 0; i < v.length; i++) {
                    if (v[i].name === '') {
                        v[i].name = '(empty)';
                    }
                }

            });
        }

        function setSelectedItems(item) {
            var selectedItems = [];
            if (typeof item === 'string') {
                return item;
            }

            if (item instanceof Array) {
                angular.forEach(item, function(item) {
                    if (item.value) {
                        selectedItems.push(item.name);
                    }
                });
                //   console.log(selectedItems);
                return selectedItems;
            }
        }

        function convertFormSelectionsToQueryParams() {
            // delete f:keys from $scope.forms before processing
            angular.forEach($scope.form, function(item, key) {
                if (key.indexOf('f:') > -1) {
                    delete $scope.form[key];
                }
            });

            var params = {};
            // params.facets = {};
            angular.forEach($scope.form, function(value, key) {
                if (!value) {
                    //   params[key] = null;
                }
                if (typeof value === 'string') {
                    params[key] = value;
                }
                if (value instanceof Array) {
                    params[key] = [];
                    angular.forEach(value, function(item) {
                        if (item instanceof Object && item.selected) params[key].push(item.name);
                        if (typeof item === 'string' && item !== '') {
                            params[key].push(item);
                        }
                    });
                    // if its empty array then delete the criterion
                    if (params[key].length === 0) delete params[key];
                }
                if (value instanceof Object && key === 'facets') {
                    angular.forEach(value, function(item, facetKind) {
                        params['f:' + facetKind] = [];
                        for (var i = 0; i < item.length; i++) {
                            if (item[i].selected) {
                                console.log('pusing...');
                                params['f:' + facetKind].push(item[i].name);
                            }
                        }
                        // if its empty array then delete the criterion
                        if (params['f:' + facetKind].length === 0) delete params['f:' + facetKind];

                    });
                }

                if (value instanceof Object && key === 'range') {
                    if (value.from) params.from = stringify(new Date(value.from));
                    if (value.to) params.to = stringify(new Date(value.to));
                }

                if (value instanceof Array && key === 'groups') {
                    params.groupUsers = getSelectedUsers(value);
                    console.log('groups', value);
                }
            });
            console.log('params', params);
            if (params.groupUsers.length === 0) {
                delete params.groupCriteria;
                delete params.groupUsers;
            }
            // we dont need groups param
            delete params.groups;
            console.log('params:', params);
            return params;
        }

        function stringify(d) {
            var dateStr = d.getFullYear() + '-';
            var month = d.getMonth() + 1;
            dateStr = (month < 10) ? dateStr + '0' + month + '-' : dateStr + month + '-';
            dateStr = (d.getDate() < 10) ? dateStr + '0' + d.getDate() : dateStr + d.getDate();
            return dateStr;
        }

        // parses query params and converts them into equivalent form selections
        function parseQueryParams(queryParams) {
            //  $scope.form = angular.copy(defaultSearchCriteria);
            defaultSearchCriteria.groups = config.groups;
            var form = angular.copy(defaultSearchCriteria);
            angular.forEach(queryParams, function(value, key) {
                switch (key) {
                    case 'page':
                        $scope.currentPage = parseInt(value);
                        break;
                    case 'kind':
                        if (value) form[key] = value;
                        break;
                    case 'status':
                    case 'severity':
                        if (typeof value === 'string') {
                            var index = getObjectIndex(form[key], value);
                            form[key][index].selected = true;
                        }
                        if (value instanceof Array) {
                            angular.forEach(value, function(item) {
                                var index = getObjectIndex(form[key], item);
                                form[key][index].selected = true;
                            });
                        }
                        break;
                    case 'from':
                    case 'to':
                        if (value) {
                            form.range[key] = value;
                        }
                        break;
                    case 'groupUsers':
                        angular.forEach(value, function(user) {
                            console.log('found groups');
                            angular.forEach(form.groups, function(group) {
                                angular.forEach(group.children, function(u, i) {
                                    if (u.value.username === user) {
                                        ivhTreeviewMgr.select(form.groups, group.children[i]);
                                    }
                                });
                            });
                        });

                        // copy this for pre-selecting group selection when url contaning
                        // group selections is reloaded
                        $scope.preSelectedGroups = angular.copy(form.groups);
                        break;
                    default:
                        if (key.indexOf('f:') > -1) {
                            key = key.replace(/f:/, '');
                            form.facets[key] = [];
                            angular.forEach(value, function(item) {
                                form.facets[key].push({
                                    name: item,
                                    value: item,
                                    selected: true
                                });
                            });
                        } else {
                            form[key] = value;
                        }

                        break;
                }
            });

            return form;
            //  console.log('after parsing', $scope.form);
        }

        // get all selected users from the groups tree
        function getSelectedUsers(tree, selectedItems, ancestors) {
            var selectedUsers = selectedItems || [];
            for (var i = 0; i < tree.length; i++) {
                tree[i].ancestors = ancestors || [];
                // console.log('tree[i]:', tree[i]);
                if (tree[i].children && tree[i].children.length > 0) {

                    if (tree[i].parent) tree[i].ancestors.push(tree[i].parent);
                    if (tree[i].selected) tree[i].ancestors.pop();
                    getSelectedUsers(tree[i].children, selectedUsers, tree[i].ancestors);
                } else {
                    if (tree[i].selected) {
                        selectedUsers.push([tree[i]]);
                    }
                }
            }
            selectedUsers = _.flattenDeep(selectedUsers);
            selectedUsers = _.map(selectedUsers, function(user) {
                return user.value.username;
            });
            return selectedUsers;
        }

        function getObjectIndex(array, name) {
            var index = -1;
            for (var i = 0; i < array.length; i++) {
                if (array[i].name === name) {
                    index = i;
                }
            }
            return index;
        }

    }
]);