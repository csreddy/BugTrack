'use strict';

describe('Controller: configCtrl', function() {

    var configCtrl, scope;

    // load the controller's module
    beforeEach(module('config.controllers'));
    beforeEach(module('config.services'));
    beforeEach(module('flash.services'));


    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope, Config) {
        scope = $rootScope.$new();
        configCtrl = $controller('configCtrl', {
            $scope: scope,
            Config: Config
        });
    }));

    it('should add user to config', function() {
        console.log('------------------- Config -------------------');
        scope.config.users = [];
        scope.addUser('user1@email.com', 'testuser1', 'user1');
        expect(scope.config.users.length).toEqual(1);
    });

    it('should add new kind', function() {
        scope.updateConfigOptions('kind', ['hello'], 'add');

    });

});