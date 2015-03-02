'use strict';

describe('Controller: configCtrl', function() {

    var configCtrl, scope, ConfigServiceMock, FlashServiceMock;

    // load the controller's module
    beforeEach(module('config.controllers'));
    beforeEach(function() {
        ConfigServiceMock = {
            get: function() {
                return 'hello';
            }
        };

        FlashServiceMock = {
            addAlert: function(alertType, message) {
                return 'from Flash';
            }
        };
    });



    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        configCtrl = $controller('configCtrl', {
            $scope: scope,
            Config: ConfigServiceMock,
            Flash: FlashServiceMock
        });
    }));

    it('should ...', function() {
     //   spyOn(ConfigServiceMock, 'get').addCallThrough();
      //  spyOn(FlashServiceMock, 'addAlert').addCallThrough();

        expect(1).toEqual(1);
    });
});