'use strict';

describe('Directive: searchForm', function () {

  // load the directive's module and view
  beforeEach(module('fullstackApp'));
  beforeEach(module('app/directives/searchForm/searchForm.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<search-form></search-form>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the searchForm directive');
  }));
});