'use strict';

angular.module('fullstackApp')
  .directive('searchForm', function () {
    return {
      templateUrl: 'app/directives/searchForm/searchForm.html',
      restrict: 'E',
      link: function (scope, element, attrs) {
      }
    };
  });