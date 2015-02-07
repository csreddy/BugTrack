'use strict';

var app = angular.module('flash.services', []);

app.service('Flash', function($rootScope, $timeout) {

    $rootScope.alerts = [];

    this.addAlert = function(type, msg) {
        console.log(type, msg);
        var lastAlertMsg = '';

        // remove all other messages when success
        if (type === 'success') {
            $rootScope.alerts = [];
        }

        // get last alert msg
        if ($rootScope.alerts.length !== 0) {
            lastAlertMsg = $rootScope.alerts[$rootScope.alerts.length - 1].msg;
        }

        // push only if new alert is different from last one
        if (lastAlertMsg !== msg) {
            $rootScope.alerts.push({
                'type': type,
                'msg': msg
            });
        }

        // disappear flashes after 30 sec
        $timeout(function() {
            $rootScope.alerts.pop();
        }, 3000);
    };

    // close alert
    $rootScope.closeAlert = function(index) {
        $rootScope.alerts.splice(index, 1);
    };

    $rootScope.$on('$routeChangeSuccess', function(next, current) {
        //$rootScope.alerts = [];
    });


});