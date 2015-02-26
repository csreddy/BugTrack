'use strict';

var app = angular.module('user.services', []);

app.service('User', ['$http', '$location', 'Flash',

    function($http, $location, Flash) {

        // create a new user
        this.create = function(user) {
            return $http({
                method: 'POST',
                url: '/api/user/create',
                data: user
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
                url: '/auth/local/login',
                data: userCredentials
            });
        };

        this.logout = function() {
            return $http({
                method: 'GET',
                url: '/auth/local/logout',
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