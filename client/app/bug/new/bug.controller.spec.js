'use strict';

describe('Controller: newBugCtrl', function() {

    var newBugCtrl, scope;
    var config, currentUser, bugId;

    // load the controller's module
    beforeEach(module('bug.controllers'));
    // load services
    beforeEach(module('bug.services'));
    beforeEach(module('user.services'));
    beforeEach(module('config.services'));
    beforeEach(module('flash.services'));

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
        
        newBugCtrl = $controller('newBugCtrl', {
            $scope: scope,
            config:config,
            currentUser: currentUser,
            bugId:bugId
        });
    }));

    it('should ...', function() {
        console.log('bugId', bugId);
        console.log('currentUser', currentUser);
        expect(bugId).toEqual(1);
    });

    it('it should create a new bug', function() {
        scope.createNewBug();
    });
});