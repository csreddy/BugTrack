'use strict';

describe('Controller: UserCtrl', function () {

  // load the controller's module
  beforeEach(module('user.controllers'));

  var UserCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserCtrl = $controller('loginCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
	  console.log('login.....');
    expect(1).toEqual(1);
  });
});
