'use strict';

describe('Directive: facet', function () {

  // load the directive's module and view
  beforeEach(module('fullstackApp'));
  beforeEach(module('app/directives/facet/facet.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<facet></facet>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the facet directive');
  }));
});