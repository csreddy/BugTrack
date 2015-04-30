'use strict';

var app = angular.module('modal.services', []);

app.service('modalService', ['$modal',
    function($modal) {

        var modalDefaults = {
            backdrop: true,
            keyboard: true,
            modalFade: true,
            templateUrl: 'components/modal/modal.html',
        };
 
        var modalOptions = {
            showCloseButton: true,
            showActionButton: true,
            closeButtonText: 'Close',
            actionButtonText: 'OK',
            headerText: 'Proceed?',
            bodyText: 'Perform this action?'
        };


        this.showModal = function(customModalDefaults, customModalOptions) {
            if (!customModalDefaults) customModalDefaults = {};
            customModalDefaults.backdrop = 'static';
            return this.show(customModalDefaults, customModalOptions);
        };


        this.show = function(customModalDefaults, customModalOptions) {
            //Create temp objects to work with since we're in a singleton service
            var tempModalDefaults = {};
            var tempModalOptions = {};

            //Map angular-ui modal custom defaults to modal defaults defined in service
            angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

            //Map modal.html $scope custom properties to defaults defined in service
            angular.extend(tempModalOptions, modalOptions, customModalOptions);

            if (!tempModalDefaults.controller) {
                tempModalDefaults.controller = function($rootScope, $scope, $modalInstance) {
                    $scope.modalOptions = tempModalOptions;
                    $scope.modalOptions.ok = function(result) {
                        $modalInstance.close(result);
                    };
                    $scope.modalOptions.close = function(result) {
                        $modalInstance.dismiss('cancel');
                    };

                    $scope.newItem = {
                        title:'',
                        tofixin: '',
                        assignTo: {name: '', username: '', email: ''}
                    };

                    $scope.newQuery = {
                        name: '',
                        description: '',
                        query: {}
                    };

                    $scope.originalBug = {id: null, comment: ''};
                    $scope.notABug = {comment: ''};
                    $scope.editTitle = {newTitle: null};

                    $scope.$watch('newItem', function() {
                        //console.log('newSubTask', $scope.newSubTask);
                         $rootScope.$broadcast('newItem', $scope.newItem);
                    }, true);

                    $scope.$watch('newQuery', function() {
                        //console.log('newSubTask', $scope.newSubTask);
                         $rootScope.$broadcast('newQuery', $scope.newQuery);
                    }, true);

                   $scope.$watch('originalBug', function() {
                      //  console.log('originalBug',$scope.originalBug);
                        $rootScope.$broadcast('originalBug', $scope.originalBug);
                   }, true);

                   $scope.$watch('notABug', function() {
                      //  console.log('notABug',$scope.notABug);
                        $rootScope.$broadcast('notABug', $scope.notABug.comment);
                   }, true);

                   $scope.$watch('editTitle', function() {
                       // console.log('editTitle',$scope.editTitle);
                        $rootScope.$broadcast('editTitle', $scope.editTitle.newTitle);
                   }, true);

                };
            }

            return $modal.open(tempModalDefaults).result;
        };
    }
]);