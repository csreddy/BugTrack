'use strict';

angular.module('report.controllers', [])
    .controller('reportCtrl', ['$scope', '$location', 'Task', 'config', 'Flash',
        function($scope, $location, Task, config, Flash) {
            $location.search({}).replace(); // clear query params from url
            $scope.title = 'Reports';

            $scope.config = config.data;
            $scope.report = {
                version: '8.0-1'
            };

             $scope.relationTypes = [
                'Requirements Task',
                'Functional Specification Task',
                'Test Specification Task',
                'Test Automation Task',
                'Documentation Task',
                'Sub-task'
            ];

            $scope.taskList = function(version) {
            	var v = version || 'all';
                Task.getParentAndSubTasks(v).success(function(response) {
                    $scope.tasks = response;                    
                    console.log($scope.tasks);
                }).error(function(error) {
                    Flash.addAlert('danger', 'Error occurred');
                });
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