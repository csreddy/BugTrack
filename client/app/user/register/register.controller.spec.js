'use strict';

describe('Controller: registerCtrl', function () {

  // load the controller's module
  beforeEach(module('user.controllers'));

  var RegisterCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    RegisterCtrl = $controller('registerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
