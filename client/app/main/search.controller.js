'user strict';

var app = angular.module('search.controllers', []);

app.controller('searchCtrl', ['$rootScope', '$scope', '$location', '$filter', 'Search', 'Flash', 'currentUser', 'User', 'config',
    function($rootScope, $scope, $location, $filter, Search, Flash, currentUser, User, config) {
        $scope.home = "Home page";
        $scope.form = {};
        $scope.bugs = [];
        $scope.currentPage = 1;
        $scope.config = angular.copy(config);
        $scope.userDefaultSearch = true;
        $scope.nvfe = false;
        $scope.itemsPerPage = $scope.form.itemsPerPage = 20;

        // if the user has default query then set the $scope.form to user's default query
        // otherwise initialize with app default query
        $scope.defaultSearchCriteria = function() {
            if (Object.keys(currentUser.savedQueries.default).length === 0) {
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
                        name: ' P3 - Major',
                        value: false
                    }, {
                        name: 'P4 - Minor',
                        value: false
                    }, {
                        name: 'P5 - Aesthetic',
                        value: false
                    }, {
                        name: ' Performance',
                        value: false
                    }],
                    q: '',
                    facets: {},
                    assignTo: currentUser.username,
                    submittedBy: '',
                    category: '',
                    version: '',
                    fixedin: '',
                    tofixin: ''
                };
                $scope.search(1, $scope.itemsPerPage);

            } else {
                $scope.form = angular.copy(currentUser.savedQueries.default);
                console.log('user has default search....');
                $scope.search(1, $scope.itemsPerPage);
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


        // toggle advanced search visibility
        $scope.showMore = true;
        $scope.showAdvancedSearch = function() {
            if ($scope.showMore) {
                $scope.showMore = false;
            } else {
                $scope.showMore = true;
            }
        };

        $scope.setAssignedTo = function(assignTo) {
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
        };

        $scope.search = function(startIndex, itemsPerPage) {
            $scope.form.startIndex = startIndex || 1;
            $scope.form.itemsPerPage = itemsPerPage || $scope.itemsPerPage;
            console.log($scope.form);
            return Search.search($scope.form).success(function(response) {
                console.log(response);
                processResult(response);
                console.log('FACETS', $scope.facets);
                console.log('RESULT', response[0].report);
                //   Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(error) {
                Flash.addAlert('danger', error + ' :error occured');
            });
        };



        // clear form. returns all bugs by default.
        // will change to return tasks, rfes and others when 
        // they are implemented
        $scope.clear = function() {
            console.log('clear fields');
            $scope.form.q = '';
            $scope.form.kind[0].value = true;
            $scope.form.status = config.status;
            $scope.form.severity = config.severity;
            $scope.form.submittedBy = $scope.form.assignTo = $scope.form.category = $scope.form.version = $scope.form.fixedin = $scope.form.tofixin = '';
            $scope.form.facets= {};
            $scope.search(1, $scope.itemsPerPage);
        };


        // filter results based on facets
        $scope.filter = function(facetKind, facet) {
            console.log('$scope.form', $scope.form);
            $scope.form.facets[facetKind] = facet;
            $scope.form.startIndex = 1;
            $scope.form.itemsPerPage = $scope.itemsPerPage;
            return Search.search($scope.form).success(function(response) {
                processResult(response);
                angular.element("ul[name='" + facetKind + "']").hide();
            //    Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(response) {
                Flash.addAlert('danger', response.status + ' :error occured');
            });
        };


        // remove filter 
        $scope.unfilter = function(facetKind) {
            delete $scope.form.facets[facetKind];
            $scope.form.startIndex = 1;
            $scope.form.itemsPerPage = $scope.itemsPerPage;
            console.log('$scope.form from removeFacet', $scope.form);
            return Search.search($scope.form).success(function(response) {
                console.log(response);
                processResult(response);
                angular.element("ul[name='" + facetKind + "']").show();
              //  Flash.addAlert('success', 'Returned ' + ($scope.results.length - 1) + ' results');
            }).error(function(response) {
                Flash.addAlert('danger', response.status + ' :error occured');
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
        $scope.setPage = function(pageNo) {
            $scope.currentPage = pageNo;
            console.log('Page changed to: ' + $scope.currentPage);
            var begin = (($scope.currentPage -1 )  * $scope.itemsPerPage + 1);
             $scope.form.startIndex = begin;
            console.log('$scope.form', $scope.form);
            $scope.search(begin, $scope.itemsPerPage);
        };

        // for table column sorting
        var orderBy = $filter('orderBy');
        $scope.order = function(predicate, reverse) {
            $scope.bugs = orderBy($scope.bugs, predicate, reverse);
        };

        $scope.saveUserDefaultSearch = function() {
            if (!$scope.form.userDefaultSearch) {
                console.log('saved......');
                User.saveDefaultQuery($scope.form).success(function(response) {
                    $scope.userDefaultSearch = true;
                    console.log(response);
                }).error(function(error) {
                    console.log(error);
                });
            }
        };

        $scope.$watchCollection('bugList', function() {
            getBugDetails();
        }, true);


        $scope.$watchCollection('form', function() {
            $scope.prettyForm = JSON.stringify($scope.form, null, 6);
        }, true);


        // watch if user default query is changed
        $scope.$watch('form', function() {
            // console.log('hey, search query changed!' + JSON.stringify($scope.form));
            // console.log('default user query', JSON.stringify(currentUser.savedQueries.default));
            if (angular.equals($scope.form, currentUser.savedQueries.default)) {
                console.log('user default search unchanged');
                $scope.userDefaultSearch = true;
            } else {
                console.log('user default search changed');
                $scope.userDefaultSearch = false;
            }

        }, true);


        $scope.saveUserDefaultSearch = function() {
            if (!$scope.form.userDefaultSearch) {
                console.log('saved......');
                User.saveDefaultQuery($scope.form).success(function(response) {
                    $scope.userDefaultSearch = true;
                    console.log(response);
                }).error(function(error) {
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


      /* private functions  */
      function processResult (searchResult) {
                $scope.results = searchResult;
                $scope.bugList = searchResult.slice(1);
                $scope.facets = searchResult[0].facets;
                removeEmptyFacets($scope.facets);
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

        // remove empty value facets which would always be the first item in the array
        function removeEmptyFacets(facets) {
            angular.forEach(facets, function(v, k) {
                if (v.facetValues.length > 0 && v.facetValues[0].value === '') {
                    v.facetValues.shift();
                }
            });
        }


    }
]);