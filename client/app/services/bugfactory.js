'use strict';

var app = angular.module('bug.factory', []);
app.constant('RESTURL', 'http://' + location.hostname + ':' + location.port);

app.factory('bugFactory', function($http, RESTURL) {
    // Service logic

    // Public API here
    return {
        getBugs: function(q) {
            if (q === undefined || q === null) {
                q = '';
            }

            console.log('q = ' + q);
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/search?format=json&q=' + q + '&collection=bugs'
            });
        },
        getBug: function(uri) {
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/documents?uri=2' + uri
            });
        }
    };
});