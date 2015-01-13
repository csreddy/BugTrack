'use strict';

var app = angular.module('search.services', []);

app.service('Search', ['$http',
    function($http) {
        this.bugs = function() {
            return $http({
                method: 'GET',
                url: '/api/search/all'
            });
        };

        this.search = function(searchCriteria) {
            return $http({
                method: 'POST',
                url: '/api/search',
                data: searchCriteria
            });
        };

    } 
]);