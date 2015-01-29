'user strict';

var app = angular.module('search.controllers', []);

app.controller('searchCtrl', ['$rootScope', '$scope', '$location', '$filter', 'Search', 'defaultSearchCriteria', 'Flash', 'currentUser', 'User', 'config', '$routeParams',
    function($rootScope, $scope, $location, $filter, Search, defaultSearchCriteria, Flash, currentUser, User, config, $routeParams) {
        $scope.home = "Home page";
        $scope.form = defaultSearchCriteria || {};
        $scope.bugs = [];
        $scope.currentPage = parseInt($location.search().page) || 1;
        $scope.config = angular.copy(config);
        $scope.userDefaultSearch = false;
        $scope.nvfe = false;
        $scope.pageLength = 20;
        $scope.facetName = '';
        var conditionNames = ['q', 'kind', 'status', 'severity', 'priority', 'category', 'version', 'fixedin', 'tofixin', 'assignTo', 'submittedBy', 'page', 'pageLength'];

        $scope.init = function() {
          
            // if url contains search params then get that search results
            if (Object.keys($location.search()).length > 0) {
                console.log('init()', $location.search());
                // set form selections according to url query params
                parseURL($location.search());
                return Search.search($location.search()).success(function(response) {
                    processResult(response);
                    console.log('RESULT', response[0].report);
                }).error(function(error) {
                    Flash.addAlert('danger', error);
                });
            } else if (Object.keys(currentUser.savedQueries.default).length > 0) {
                // if the user has default query then set the $scope.form to user's default query
                // otherwise initialize with app default query
                console.log('user has default search....');
                $scope.form = angular.copy(currentUser.savedQueries.default.form);
                $scope.userDefaultSearch = true;
                return Search.search(currentUser.savedQueries.default.search).success(function(response) {
                    processResult(response);
                    console.log('RESULT', response[0].report);
                }).error(function(error) {
                    Flash.addAlert('danger', error);
                });

            } else {
                $scope.form.assignTo = currentUser.username;
                return Search.search($location.search()).success(function(response) {
                    processResult(response);
                    console.log('RESULT', response[0].report);
                }).error(function(error) {
                    Flash.addAlert('danger', error);
                });
            }
        };

        // for form selection using checkboxes and dropdowns
        $scope.addSelectedValueToQuery = function() {
             angular.forEach(conditionNames, function(item) {
                if ($scope.form[item]) {
                    $location.search(item, setSelectedItems($scope.form[item]));
                }
            });
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


        $scope.search = function(searchCriteria) {
            console.log('searchCriteria: ', searchCriteria);
            // criteria selected from search form


            angular.forEach(conditionNames, function(item) {
                if ($scope.form[item]) {
                    $location.search(item, setSelectedItems($scope.form[item]));
                }
            });
            $location.search('page', 1); // start from page 1 for every search
            searchCriteria = $location.search();



            if (Object.keys($location.search()).length !== 0) {
                parseURL($location.search());
                searchCriteria = $location.search();
            }

            // searchCriteria =  {kind:['Bug'],page:1,status:['New','Test']};

            return Search.search(searchCriteria).success(function(response) {
                // console.log('route params',$location.search());
                processResult(response);
                //  console.log('FACETS', $scope.facets);
                console.log('RESULT', response[0].report);
                //   Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(error) {
                Flash.addAlert('danger', error);
            });
        };



        // clear form. returns all bugs by default.
        // will change to return tasks, rfes and others when 
        // they are implemented
        $scope.clear = function() {
            console.log('clear fields');
            $location.search({});
            $scope.form.q = '';
            $scope.form.kind[0].value = true;
            $scope.form.status = config.status;
            $scope.form.severity = config.severity;
            $scope.form.submittedBy = $scope.form.assignTo = $scope.form.category = $scope.form.version = $scope.form.fixedin = $scope.form.tofixin = '';
            $scope.form.facets = {};
            return Search.search({}).success(function(response) {
                processResult(response);
            }).error(function(error) {
                Flash.addAlert('danger', error + ' :error occured');
            });
        };


        // filter results based on facets
        $scope.filter = function(facetKind, facet) {
            if (facet.name === '(empty)') {
                facet.name = '';
            }
            $scope.form.facets[facetKind] = facet;
            console.log('facets:', $scope.form.facets);
            // get form selections
            angular.forEach(conditionNames, function(item) {
                if ($scope.form[item]) {
                    $location.search(item, setSelectedItems($scope.form[item]));
                }
            });
            $location.search(facetKind, facet.name); // set facet in url
            $location.search('page', 1); // reset page number 

            /* return Search.search($location.search()).success(function(response) {
                processResult(response);
                angular.element("ul[name='" + facetKind + "']").hide();
                //    Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(error) {
                Flash.addAlert('danger', JSON.stringify(error));
            });*/
        };


        // remove filter 
        $scope.unfilter = function(facetKind) {
            delete $scope.form.facets[facetKind]; // remove facet from ui
            console.log('$scope.form from removeFacet', $scope.form);
            console.log('unfilter', $location.search());
            delete $location.search()[facetKind]; // remove facet from url
            $scope.form[facetKind] = '';
            $location.search('page', 1);
            /*return Search.search($location.search()).success(function(response) {
                console.log(response);
                processResult(response);
                angular.element("ul[name='" + facetKind + "']").show();
                //  Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(error) {
                Flash.addAlert('danger', error + ' :error occured');
            });*/
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
            //  $scope.search($location.search());
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
                User.saveDefaultQuery($location.search(), $scope.form).success(function() {
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
        };


        $scope.showFacetDropdown = function(facetKind, facetType) {
            var show = false;
            if (facetType.facetValues.length === 0) {
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



        $scope.$on('$locationChangeSuccess', function() {
            console.log($location.search());
            $scope.currentPage = $location.search().page;
           
            // for form selections to auto fill when browser back/fwd is clicked
            if (Object.keys($location.search()).length === 0) {
                  // reset search form to default
                  $scope.form=angular.copy(defaultSearchCriteria);
            } else{
                parseURL($location.search());
            }

            return Search.search($location.search()).success(function(response) {
                // console.log('route params',$location.search());
                processResult(response);
                //  console.log('FACETS', $scope.facets);
                console.log('RESULT', response[0].report);
                //   Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(error) {
                Flash.addAlert('danger', error + ' :error occured');
            });
        });

        // watch if user default query is changed
        $scope.$watch('form', function() {
            //  console.log('hey, search query changed!' + JSON.stringify($scope.form));
            // console.log('default user query', JSON.stringify(currentUser.savedQueries.default.form));
            if (angular.equals($scope.form, currentUser.savedQueries.default.form)) {
                //  console.log('user default search unchanged');
                $scope.userDefaultSearch = true;
            } else {
                console.log('user default search changed');
                $scope.userDefaultSearch = false;
            }

        }, true);



        /* private functions  */
        function processResult(searchResult) {
            $scope.results = searchResult;
            $scope.bugList = searchResult.slice(1);
            $scope.facets = searchResult[0].facets;
            renameEmptyFacets($scope.facets);
            // reArrangeFacets($scope.facets);
            $scope.searchMetrics = searchResult[0].metrics;
            $scope.totalItems = searchResult[0].total;
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
                for (var i = 0; i < v.facetValues.length; i++) {
                    if (v.facetValues[i].name === '') {
                        v.facetValues[i].name = '(empty)';
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
                console.log(selectedItems);
                if (selectedItems.length > 0) {
                    return selectedItems;
                } else {
                    return selectedItems[0];
                }
            }
        }


        function reArrangeFacets(facets) {
            var reArrangedFacets = {};
            reArrangedFacets.category = facets.category;
            reArrangedFacets.assignTo = facets.assignTo;
            $scope.facets = angular.copy(reArrangedFacets);
        }

        function parseURL(queryParams) {
            angular.forEach(queryParams, function(value, key) {
                switch (key) {
                    case 'kind':
                    case 'status':
                    case 'severity':
                        console.log('value: ', value);
                        if (typeof value === 'string') {
                            var index = getObjectIndex($scope.form[key], value);
                            $scope.form[key][index].value = true;
                        }
                        if (value instanceof Array) {
                            angular.forEach(value, function(item) {
                                var index = getObjectIndex($scope.form[key], item);
                                $scope.form[key][index].value = true;
                            });
                        }
                        break;
                    default:
                        $scope.form[key] = value;
                        break;
                }
            });
        }


        function getObjectIndex(array, name) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].name === name) {
                    return i;
                }
            }
        }

    }
]);