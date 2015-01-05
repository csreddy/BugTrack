'use strict';

var app = angular.module('bugConfig.services', []);
app.constant('RESTURL', 'http://' + location.hostname + ':' + location.port);

app.factory('bugConfigFactory', ['$http', 'RESTURL',
    function($http, RESTURL) {
        // Service logic
        function updateConfiguration(payload) {
            return $http({
                method: 'PUT',
                url: RESTURL + '/v1/documents?uri=config.json',
                data: payload
            });
        }

        function getBugs(q) {
            if (q === undefined || q === null) {
                q = '';
            }

            console.log('q = ' + q);
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/search?format=json&q=' + q + '&collection=bugs'
            });
        }

        function getBug(uri) {
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/documents?uri=' + uri
            });
        }


        function getConfig() {
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/documents?uri=config.json'
            });
        }

        function insertConfig(payload) {
            return $http({
                method: 'PUT',
                url: RESTURL + '/v1/documents?uri=config.json',
                data: payload
            });
        }

        // Public API here
        return {
            insertConfig: function(payload) {
                console.log('inside insertConfig', payload);
                insertConfig(payload);
            },

            updateConfiguration: function(payload) {
                return updateConfiguration(payload);
            },
            getBugs: function(q) {
                return getBugs(q);
            },
            getBug: function(uri) {
                return getBug(uri);
            },
            getConfig: function() {
                return getConfig();
            }
        };
    }
]);