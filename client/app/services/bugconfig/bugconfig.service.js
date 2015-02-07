'use strict';

var app = angular.module('config.services', []);

app.factory('Config', ['$http',
    function($http) {
        // Service logic
        function update(category, items, operation) {
            return $http({
                method: 'PUT',
                url: '/api/configure/update',
                data: {
                    category: category,
                    items: items,
                    operation: operation
                }
            });
        }

        function get() {
            return $http({
                method: 'GET',
                url: '/api/configure'
            });
        }

        function insert(payload) {
            return $http({
                method: 'PUT',
                url: '/api/configure/update',
                data: payload
            });
        }

        // Public API here
        return {
            insert: function(payload) {
                console.log('inside insertConfig', payload);
                insert(payload);
            },

            update: function(category, item, operation) {
                return update(category, item, operation);
            },
            get: function() {
                return get();
            }
        };
    }
]);