'use strict';

describe('Controller: configCtrl', function () {

  // load the controller's module
  beforeEach(module('config.controllers'));

  var ConfigureCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ConfigureCtrl = $controller('configCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
