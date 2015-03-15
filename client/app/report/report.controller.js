'use strict';

angular.module('report.controllers', [])
    .controller('reportCtrl', ['$scope', 'Task', 'config',
        function($scope, Task, config) {
            $scope.title = 'Reports';

            $scope.config = config.data;
            $scope.report = {
                version: '8.0-1'
            };

            $scope.getAllParentTasks = function(version) {
                return getAllParentTasks(version);
            };

            $scope.getSubTasks = function(taskId) {
                return getSubTasks(taskId);
            };





            function getAllParentTasks(version) {

            }

            function getSubTasks(taskId) {

            }



        }
    ]);