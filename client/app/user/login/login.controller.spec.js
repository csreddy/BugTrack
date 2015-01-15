'use strict';

describe('Controller: loginCtrl', function() {
    var flashServiceMock, userServiceMock;
    // load the controller's module
    beforeEach(module('user.controllers', function($provide) {
        flashServiceMock = {
            addAlert: function(type, msg) {
                return type + ' ' + msg;
            }
        };
        userServiceMock = {};
        $provide.value('Flash', flashServiceMock);
        $provide.value('User', userServiceMock);

    }));

    var UserCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope, Flash, User) {
        scope = $rootScope.$new();
        UserCtrl = $controller('loginCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function() {
        console.log('login.....');
        expect(1).toEqual(1);
    });
});