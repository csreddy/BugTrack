'use strict';

describe('Controller: viewCtrl', function() {

    var viewCtrl, scope;
    var config, currentUser, bugId;

    // load the controller's module
    beforeEach(module('bug.controllers'));
    beforeEach(module('bug.services'));
    beforeEach(module('user.services'));
    beforeEach(module('config.services'));
    beforeEach(module('flash.services'));
    beforeEach(module('modal.services'));


    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        config = {};
        bugId = 1;
        currentUser = {
            name: 'admin',
            username: 'admin',
            email: 'admin@email.com'
        };
        scope = $rootScope.$new();
        viewCtrl = $controller('viewCtrl', {
            $scope: scope,
            config: config,
            currentUser: currentUser,
            bugId: bugId
        });
    }));

    it('should ...', function() {
        expect(1).toEqual(1);
    });
});