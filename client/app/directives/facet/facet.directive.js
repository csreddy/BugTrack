'use strict';

angular.module('facet.directive', [])
    .directive('facet', function() {
        return {
            templateUrl: 'app/directives/facet/facet.html',
            restrict: 'E',
            require: 'ngModel',
            scope: {
                ngModel: '='
            },
            link: function(scope, element, attrs, ngModel) {
                console.log('facet directive', scope.ngModel);
                var facetItems = scope.ngModel;
                element.append("<ul class='list-unstyled'>");
                for (var i = 0; i < facetItems.length; i++) {
                    var parent = element.find('ul');
                    parent.append("<li style='margin-left: 10px'>");
                    parent = element.find("li:nth-child(" + i + ")");

                    parent.append("<label style='xsm-label'>");
                    parent.append("<input type='checkbox' name='statusFacet' value='" + JSON.stringify(facetItems[i]) + "'>");
                    parent.append("<span class='badge bg-olive pull-right'>" + facetItems[i].count + "</span>");
                    parent.append('&nbsp;&nbsp;' + facetItems[i].name);
                }

                function getObjectIndex(array, name) {
                    var index = -1;
                    for (var i = 0; i < array.length; i++) {
                        if (array[i].name === name) {
                            index = i;
                        }
                    }
                    return index;
                }

                scope.$watch(function() {
                    var index = getObjectIndex(facetItems, element.attr('value', 'statusFacet'));
                    console.log('index', index);
                    });


                element.bind('click', function() {
                    console.log('Need to change the model value but dont know how to yet');
                    console.log(ngModel.$modelValue);
                    scope.$apply(function() {
                        ngModel.$setViewValue();
                    });
                });

            }
        };
    });