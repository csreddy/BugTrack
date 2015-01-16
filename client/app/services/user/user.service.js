'use strict';

var app = angular.module('user.services', []);

app.service('User', ['$http', '$location', 'Flash',

    function($http, $location, Flash) {

        // create a new user
        this.create = function(payload) {
            return $http({
                method: 'POST',
                url: '/api/user/create',
                data: payload
            });
        };

        // check if user exists
        this.isExist = function(user) {

        };

        // get all users
        this.getUsers = function() {

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
            return $http({
                method: 'POST',
                url: '/login',
                data: userCredentials
            });
        };

        this.logout = function() {
            return $http({
                method: 'GET',
                url: '/logout',
            });
        };

        this.saveDefaultQuery = function(searchCriteria) {
            return $http({
                method: 'PUT',
                url: '/api/user/savedefaultquery',
                data: searchCriteria
            });
        };

    }
]);