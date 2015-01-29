'user strict';

var app = angular.module('search.controllers', []);

app.controller('searchCtrl', ['$rootScope', '$scope', '$location', '$filter', 'Search', 'defaultSearchCriteria','Flash', 'currentUser', 'User', 'config', '$routeParams',
    function($rootScope, $scope, $location, $filter, Search, defaultSearchCriteria, Flash, currentUser, User, config, $routeParams) {
        $scope.home = "Home page";
        $scope.form = {};
        $scope.bugs = [];
        $scope.currentPage = parseInt($location.search().page) || 1;
        $scope.config = angular.copy(config);
        $scope.userDefaultSearch = false;
        $scope.nvfe = false;
        $scope.pageLength = 20;
        $scope.facetName = '';
        var conditionNames = ['q', 'kind', 'status', 'severity', 'priority', 'category', 'version', 'fixedin', 'tofixin', 'assignTo', 'submittedBy', 'page', 'pageLength'];

        $scope.init = function() {
            defaultSearchCriteria.
            // if url contains search params then get that search results
            if (Object.keys($location.search()).length > 0) {
                console.log('$location.search.page', $location.search());
                $scope.search($location.search());
            } else if (Object.keys(currentUser.savedQueries.default).length > 0) {
                // if the user has default query then set the $scope.form to user's default query
                // otherwise initialize with app default query
                console.log('user has default search....');
                $scope.form = angular.copy(currentUser.savedQueries.default.form);
                $scope.search(currentUser.savedQueries.default.search); // need to fix this
                $scope.userDefaultSearch = true;
            } else {
                $scope.search($location.search());
            }
        };



        // sort users alphabetically
        $scope.config.users.sort(function(a, b) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        });
        // sort version alphabetically
        $scope.config.version.sort(function(a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        // sort category alphabetically
        $scope.config.category.sort(function(a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });


        // toggle advanced search panel visibility
        $scope.showMore = true;
        $scope.showAdvancedSearch = function() {
            if ($scope.showMore) {
                $scope.showMore = false;
            } else {
                $scope.showMore = true;
            }
        };

       /* $scope.setAssignedTo = function(assignTo) {
            $scope.form.assignTo = assignTo;
        };

        $scope.setSubmittedBy = function(submittedBy) {
            $scope.form.submittedBy = submittedBy;
        };

        $scope.setCategory = function(category) {
            $scope.form.category = category;
        };

        $scope.setVersion = function(version) {
            $scope.form.version = version;
        };

        $scope.setToFixin = function(tofixin) {
            $scope.form.tofixin = tofixin;
        };

        $scope.setFixedIn = function(fixedin) {
            $scope.form.fixedin = fixedin;
        };*/

        $scope.search = function(searchCriteria) {
            console.log('searchCriteria: ', searchCriteria);
            // $scope.startIndex = (parseInt(pageNo) - 1) * $scope.pageLength + 1;
            // criteria selected from search form
            if (searchCriteria === undefined) {

                angular.forEach(conditionNames, function(item) {
                    if ($scope.form[item]) {
                        $location.search(item, setSelectedItems($scope.form[item]));
                    }
                });
                $location.search('page', 1); // start from page 1 for every search
                searchCriteria = $location.search();

            }

            if (Object.keys($location.search()).length !== 0) {
                parseURL($location.search());
                searchCriteria = $location.search();
            }


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
            //$scope.search($location.search());
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

        /*        function gotoPage(pageNo) {
            console.log('Page changed from ' + $scope.currentPage + ' to: ' + pageNo);
            var begin = ((pageNo - 1) * $scope.pageLength + 1);
            $scope.form.startIndex = begin;
            // console.log('$scope.form', $scope.form);
            $scope.search(begin);
         //   $scope.currentPage = pageNo;
            console.log('$scope.currentPage = ' + $scope.currentPage);
        }*/


        function reArrangeFacets(facets) {
            var reArrangedFacets = {};
            reArrangedFacets.category = facets.category;
            reArrangedFacets.assignTo = facets.assignTo;
            $scope.facets = angular.copy(reArrangedFacets);
        }

        function setDefaultSearchForm() {
            $scope.form = {
                kind: [{
                    name: 'Bug',
                    value: true
                }, {
                    name: 'Task',
                    value: false
                }, {
                    name: 'RFE',
                    value: false
                }, {
                    name: 'Other',
                    value: false
                }],
                status: [{
                    name: 'New',
                    value: false
                }, {
                    name: 'Verify',
                    value: false
                }, {
                    name: 'Test',
                    value: false
                }, {
                    name: 'Fix',
                    value: false
                }, {
                    name: 'Ship',
                    value: false
                }, {
                    name: 'Closed',
                    value: false
                }, {
                    name: 'Will not fix',
                    value: false
                }, {
                    name: 'External',
                    value: false
                }],
                severity: [{
                    name: 'P1 - Catastrophic',
                    value: false
                }, {
                    name: 'P2 - Critical',
                    value: false
                }, {
                    name: 'P3 - Major',
                    value: false
                }, {
                    name: 'P4 - Minor',
                    value: false
                }, {
                    name: 'P5 - Aesthetic',
                    value: false
                }, {
                    name: 'Performance',
                    value: false
                }],
                q: '',
                facets: {},
                assignTo: '', //currentUser.username,
                submittedBy: '',
                category: '',
                version: '',
                fixedin: '',
                tofixin: ''
            };
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