'use strict';

var app = angular.module('user.services', []);

app.service('User', ['$http', 'RESTURL', '$location', 'Flash',

    function($http, RESTURL, $location, Flash) {

        // create a new user
        this.create = function(username, payload) {
            var uri = '/user/' + username + '.json';
            return $http({
                method: 'PUT',
                url: RESTURL + '/v1/documents?uri=' + uri + '&collection=users',
                data: payload
            });
        };

        // check if user exists
        this.isExist = function(user) {
            //  var uri = '/user/' + username + '.json';
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/search?q="' + user.username + '"' + '&collection=users'
            });
        };

        // get all users
        this.getUsers = function() {
            return $http({
                method: 'GET',
                url: RESTURL + '/v1/search?collection=users'
            });
        };


        this.getInfo = function() {
            return $http({
                method: 'GET',
                url: '/userinfo'
            });
        };

        this.getCurrentUserInfo = function() {
            return this.getInfo().then(function(response) {
                return response.data;
            }, function(response) {
                $location.path('/login');
                Flash.addAlert('warning', response.data.message);
            });
        };

        this.login = function(userCredentials) {
            return  $http({
                method: 'POST',
                url: '/login',
                data: userCredentials
            });
        };

        this.saveDefaultQuery = function(searchCriteria) {
            return $http({
                method: 'PUT',
                url: '/api/user/savedefaultquery',
                data: searchCriteria
            });
        };

        this.getDefaultSearch = function() {
                
        };

    }
]);