'use strict';

var app = angular.module('bug.services', []);
app.constant('RESTURL', 'http://' + location.hostname + ':' + location.port);

app.service('BugService', function($http, RESTURL) {
    // AngularJS will instantiate a singleton by calling 'new' on this function
    this.getBugs = function(q) {
        if (q === undefined || q === null) {
            q = '';
        }

        console.log('q = ' + q);
        return $http({
            method: 'GET',
            url: RESTURL + '/v1/search?format=json&q=' + q + '&collection=bugs&pageLength=100'
        });
    };

    this.putDocument = function(uri, payload) {
        console.log('document = ' + uri);
        return $http({
            method: 'PUT',
            url: RESTURL + '/v1/documents?uri=' + uri + '&collection=bugs',
            data: payload
        });
    };

    this.getBug = function(uri) {
        return $http({
            method: 'GET',
            url: RESTURL + '/v1/documents?uri=' + uri
        });
    };


});