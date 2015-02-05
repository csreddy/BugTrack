'user strict';

var app = angular.module('search.controllers', ['checklist-model']);

app.controller('searchCtrl', ['$rootScope', '$scope', '$location', '$filter', 'Search', 'defaultSearchCriteria', 'Flash', 'currentUser', 'User', 'config', '$timeout',
    function($rootScope, $scope, $location, $filter, Search, defaultSearchCriteria, Flash, currentUser, User, config, $timeout) {
        $scope.home = "Home page";
        $scope.form = angular.copy(defaultSearchCriteria) || {};
        $scope.bugs = [];
        $scope.currentPage = parseInt($location.search().page) || 1;
        $scope.config = angular.copy(config);
        $scope.userDefaultSearch = false;
        $scope.nvfe = false;
        $scope.pageLength = 20;
        $scope.facetName = '';
        $scope.isPaginationEvent = false;
        $scope.facetOrder = ['assignTo', 'submittedBy', 'category', 'status', 'severity', 'priority', 'createdAt']; //'platform'
        var conditionNames = ['q', 'kind', 'status', 'severity', 'priority', 'category', 'version', 'fixedin', 'tofixin', 'assignTo', 'submittedBy', 'page', 'pageLength'];


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


        $scope.init = function() {

            // if url contains search params then get that search results
            if (Object.keys($location.search()).length > 0) {
                console.log('init()', $location.search());
                // set form selections according to url query params
                $scope.form = angular.copy(parseQueryParams($location.search()));
                var searchCriteria = $location.search();
                search($location.search());
                console.log('highlightPageNumber');
                // due to pagination directive bug, current page number does not get higlighted when 
                // browser back/fwd is clicked. This is a hack to fix it.
                $timeout(function() {
                    highlightPageNumber(searchCriteria.page);
                }, 1000);

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
                $scope.form = angular.copy(parseQueryParams(currentUser.savedQueries.default));
                var searchCriteria = convertFormSelectionsToQueryParams();
                search(searchCriteria);
                $scope.userDefaultSearch = true;
            } else {
                $scope.form.assignTo = currentUser.username;
                var searchCriteria = angular.copy(convertFormSelectionsToQueryParams());
                search(searchCriteria);
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



        $scope.mainSearch = function(searchCriteria) {
            console.log('SCOPE.FORM', $scope.form);
            $scope.isPaginationEvent = false;
            searchCriteria = angular.copy(convertFormSelectionsToQueryParams());
            console.log('searchCriteria: ', searchCriteria);
            $location.search(searchCriteria);
            // searchCriteria =  {kind:['Bug'],page:1,status:['New','Test']};
            $location.search('page', 1); // start from page 1 for every search

        };



        // clear form. returns all bugs by default.
        // will change to return tasks, rfes and others when 
        // they are implemented
        $scope.clear = function() {
            console.log('clear fields');
            $scope.isPaginationEvent = false;
            $scope.form = angular.copy(defaultSearchCriteria);
            return Search.search($location.search({})).success(function(response) {
                processResult(response);
            }).error(function(error) {
                Flash.addAlert('danger', error.body.errorResponse.message);
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
            return Search.search($location.search()).success(function(searchResult) {
                $scope.results = searchResult;
                $scope.bugList = searchResult.slice(1);
                $scope.searchMetrics = searchResult[0].metrics;
                $scope.totalItems = searchResult[0].total;
            }).error(function(error) {
                Flash.addAlert('danger', error.body.errorResponse.message);
            });
        };

        // for table column sorting
        var orderBy = $filter('orderBy');
        $scope.order = function(predicate, reverse) {
            $scope.bugs = orderBy($scope.bugs, predicate, reverse);
        };

        $scope.$watchCollection('bugList', function() {
            getBugDetails();
        }, true);


        $scope.$watchCollection('form', function() {
            $scope.prettyForm = JSON.stringify($scope.form, null, 6);
        }, true);



        $scope.saveUserDefaultSearch = function() {
            if (!$scope.form.userDefaultSearch) {
                console.log('saved......');
                var searchCriteria = angular.copy(convertFormSelectionsToQueryParams());
                User.saveDefaultQuery(searchCriteria).success(function() {
                    $scope.userDefaultSearch = true;
                    Flash.addAlert('success', 'Default search query saved');
                }).error(function(error) {
                    Flash.addAlert('danger', 'Oops! Could not save query. Please try again');
                    console.log(error);
                });
            }
        };


        $scope.selectNVFE = function(select) {
            console.log('select n/v/f/e');
            $scope.form.status.forEach(function(item) {
                if (item.name === 'New' || item.name === 'Verify' || item.name === 'Fix' || item.name === 'External') {
                    item.value = select;
                }
            });
            $scope.addSelectedValueToQuery();
        };


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

        $scope.clearSelection = function(selection) {
            console.log('selection', selection);
            $scope.form[selection] = null;
            // $location.search(selection, null);
        };

        function highlightPageNumber(pageNo) {
            var elements = angular.element('#pager li');
            angular.forEach(angular.element('#pager li'), function(li) {
                if (angular.element(li).text() === pageNo.toString()) {
                    console.log('element', angular.element(li).text());
                    angular.element(li).addClass('active');
                } else {
                    angular.element(li).removeClass('active');
                }
            });
        }


        $scope.$on('$locationChangeSuccess', function() {
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
                    parseQueryParams($location.search());

                }

                return Search.search($location.search()).success(function(response) {
                    processResult(response);
                    //  console.log('FACETS', $scope.facets);
                    console.log('RESULT', response[0].report);
                    //   Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
                }).error(function(error) {
                    Flash.addAlert('danger', error.body.errorResponse.message);
                });
            };

            $scope.isPaginationEvent = false;

        });

        // watch if user default query is changed
        $scope.$watch('form', function() {
            console.log('form:', $scope.form);
            var userQuery = parseQueryParams(currentUser.savedQueries.default);
            if (angular.equals($scope.form, userQuery)) {
                $scope.userDefaultSearch = true;
            } else {
                console.log('user default search changed');
                $scope.userDefaultSearch = false;
            }

        }, true);



        /* private functions  */

        function search(searchCriteria) {
            return Search.search(searchCriteria).success(function(response) {
                processResult(response);
                console.log('RESULT', response[0].report);
                //console.log('$scope.currentPage', typeof $scope.currentPage);
            }).error(function(error) {
                Flash.addAlert('danger', error.body.errorResponse.message);
            });
        }

        function processResult(searchResult) {
            $scope.results = searchResult;
            $scope.bugList = searchResult.slice(1);
            $scope.form.facets = angular.copy(processFacets(searchResult[0].facets));
            renameEmptyFacets($scope.form.facets);
            preselectFacetCheckBox($scope.form.facets);
            console.log('Facets: ', $scope.form.facets);
            // reArrangeFacets($scope.facets);
            $scope.searchMetrics = searchResult[0].metrics;
            $scope.totalItems = searchResult[0].total;
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
                        });
                    }
                }
            });
            return facetsFromSearch;
        }


        // get bug details for table disiplay
        function getBugDetails() {
            $scope.bugs = [];
            angular.forEach($scope.bugList, function(bug) {
                $scope.bugs.push(bug.content);
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
                    if (value.from) params.from =  stringify(new Date(value.from));
                    if (value.to) params.to = stringify(new Date(value.to));
                }


            });
            //    console.log('params', params);
            // delete params.facets;
            return params;
        }

        function stringify(d) {
            var dateStr = d.getFullYear() + '-';
            var month = d.getMonth() + 1;
            dateStr = (month < 10) ? dateStr + '0' + month + '-' : dateStr + month + '-';
            dateStr = (d.getDate() < 10) ? dateStr + '0' + d.getDate() : dateStr + d.getDate();
            return dateStr;
        }

        function parseQueryParams(queryParams) {
            //  $scope.form = angular.copy(defaultSearchCriteria);
            var form = angular.copy(defaultSearchCriteria);
            angular.forEach(queryParams, function(value, key) {
                switch (key) {
                    case 'page':
                        $scope.currentPage = parseInt(value);
                        break;
                    case 'kind':
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
                        if(value){
                            form.range[key] = value;
                        }
                    break;    
                    default:
                        form[key] = value;
                        break;
                }
            });
            return form;
            //  console.log('after parsing', $scope.form);
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