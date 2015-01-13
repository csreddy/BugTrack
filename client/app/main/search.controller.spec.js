'use strict';

describe('Controller: searchCtrl', function () {

  // load the controller's module
  beforeEach(module('search.controllers'));

  var searchCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    searchCtrl = $controller('searchCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
