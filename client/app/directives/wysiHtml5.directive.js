'use strict';
/**
 *  Module
 *
 * Description
 */
var app = angular.module('wysiHtml5.directive', ['ngResource'], function($locationProvider) {
    $locationProvider.hashPrefix('');
});

app.directive('richTextEditor', function() {
    return {
        restrict: "A",
        require: 'ngModel',
        //replace : true,
        transclude: true,
        //template : '<div><textarea></textarea></div>',
        link: function(scope, element, attrs, ctrl) {

            var textarea = element.wysihtml5({
                "html": true
            });

            var editor = textarea.data('wysihtml5').editor;

            // view -> model
            editor.on('change', function() {
                if (editor.getValue())
                    scope.$apply(function() {
                        ctrl.$setViewValue(editor.getValue());
                    });
            });

            // model -> view
            ctrl.$render = function() {
                textarea.html(ctrl.$viewValue);
                editor.setValue(ctrl.$viewValue);
            };

            ctrl.$render();
        }
    };
});