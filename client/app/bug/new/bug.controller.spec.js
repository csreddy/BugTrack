'use strict';

describe('Controller: BugCtrl', function () {

  // load the controller's module
  beforeEach(module('bug.controllers'));

  var BugCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BugCtrl = $controller('BugCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
