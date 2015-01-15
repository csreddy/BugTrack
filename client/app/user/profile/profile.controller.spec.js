'use strict';

describe('Controller: profileCtrl', function () {

  // load the controller's module
  beforeEach(module('user.controllers'));

  var ProfileCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProfileCtrl = $controller('profileCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
