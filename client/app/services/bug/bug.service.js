'use strict';

var app = angular.module('bug.services', []);

app.service('BugService', function($http, RESTURL) {
    // AngularJS will instantiate a singleton by calling 'new' on this function
    this.getBugs = function(criteria) {
        return $http({
            method: 'POST',
            url: '/api/search',
            data: criteria
        });
    };


    this.getCurrentUserBugs = function(user) {
        if (user) {
        var searchCriteria = {
            kind: {
                Bug: true
            },
            assignTo: user.username,
            facets: {}
        };
        console.log('inside getCurrentUserBugs().........');
        
            return $http({
            method: 'POST',
            url: '/search',
            data: searchCriteria
        });
        }
        
    };


    this.createNewBug = function(bug, files) {
        return $http({
            url: '/new',
            method: 'POST',
            headers: {
                'Content-Type': undefined
            },
            transformRequest: function(data) {
                var form = new FormData();
                form.append('bug', angular.toJson(bug));
                for (var i = 0; i < data.files.length; i++) {
                    console.log('FORM', data.files[i]);
                    form.append('file' + i, data.files[i]);
                }
                return form;
            },
            data: {
                bug: bug,
                files: files
            }
        });
    };


    this.updateBug = function(bug, files) {
        return $http({
            url: '/new',
            method: 'POST',
            headers: {
                'Content-Type': undefined
            },
            transformRequest: function(data) {
                var form = new FormData();
                form.append('bug', angular.toJson(bug));
                for (var i = 0; i < data.files.length; i++) {
                    console.log('FORM', data.files[i]);
                    form.append('file' + i, data.files[i]);
                }
                return form;
            },
            data: {
                bug: bug,
                files: files
            }
        });
    };

    this.cloneBug = function(payload) {
        console.log('inside updateBug()');
        var payloadForUpdate = {};
        payloadForUpdate.bug = payload;
        return $http({
            method: 'POST',
            url: '/new',
            data: payloadForUpdate
        });
    };


    this.getBug = function(id) {
        return $http({
            method: 'GET',
            url: '/bug/' + id
        });
    };

    this.getBugById = function(id) {
        return $http({
            method: 'GET',
            url: '/bug/' + id
        });
    };

    this.getCount = function() {
        return $http({
            method: 'GET',
            url: '/bug/count'
        });
    };

    this.getFacets = function() {
        return $http({
            method: 'GET',
            url: '/bug/facets'
        });
    };


});