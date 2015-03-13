'use strict';

ddescribe('Service: Bug', function() {

    // load the service's module
    beforeEach(module('bug.services'));

    // instantiate service
    var Bug, httpBackend;
    var currentUser;
    beforeEach(inject(function(_Bug_, $httpBackend) {
        Bug = _Bug_;
        httpBackend = $httpBackend;
        currentUser = {
            name: 'admin',
            username: 'admin',
            email: 'admin@email.com'
        };
    }));

    // make sure no expectations were missed in your tests.
    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should have search function', function() {
        expect(angular.isFunction(Bug.search)).toBe(true);
    });

    it('should get bug count', function() {

        httpBackend.whenGET('/api/bug/count').respond({
            count: 100
        });
        Bug.count().then(function(response) {
            expect(response.data.count).toBe(100);
        });
        httpBackend.flush();

    });

    it('should get bug details', function() {
        httpBackend.whenGET('/api/bug/100').respond({
            "id": 100,
            "kind": "Bug",
            "createdAt": "2011-04-26T13:32:24.760195-07:00",
            "status": "Closed",
            "title": "This is a test bug'",
            "category": "InfoStudio UI",
            "severity": "P2 - Critical",
            "priority": {},
            "submittedBy": {
                "username": "sreddy",
                "email": "sreddy@marklogic.com",
                "name": "Sudhakar Reddy"
            },
            "assignTo": {
                "username": "nobody",
                "email": "nobody@marklogic.com",
                "name": "nobody nobody"
            },
            "description": "This is a sample bug description for the test"
        });

        Bug.get(100).then(function(response) {
            expect(response.data.id).toBe(100);
        });
        httpBackend.flush();
    });

    it('should create a new bug', function() {
        var newBug = {
            "id": 100,
            "kind": "Bug",
            "createdAt": "2011-04-26T13:32:24.760195-07:00",
            "status": "Verify",
            "title": "This is a test bug'",
            "category": "InfoStudio UI",
            "severity": "P2 - Critical",
            "priority": {},
            "submittedBy": {
                "username": "sreddy",
                "email": "sreddy@marklogic.com",
                "name": "Sudhakar Reddy"
            },
            "assignTo": {
                "username": "nobody",
                "email": "nobody@marklogic.com",
                "name": "nobody nobody"
            },
            "description": "This is a sample bug description for the test"
        };
        var files = [{
            lastModified: 1398984117000,
            lastModifiedDate: "Thu May 01 2014 15: 41: 57 GMT - 0700(PDT)",
            name: "my_img1.jpg",
            size: 1068,
            type: "image/jpeg",
            webkitRelativePath: ""
        }, {
            lastModified: 1398984117000,
            lastModifiedDate: "Thu May 01 2014 15: 41: 57 GMT - 0700(PDT)",
            name: "my_img2.jpg",
            size: 100,
            type: "image/jpeg",
            webkitRelativePath: ""
        }]

        httpBackend.whenPOST('/api/bug/new').respond(function() {
            return [200, {
                message: 'done'
            }]
        })

        Bug.create(newBug, files).then(function(response) {
            expect(response.status).toBe(200)
        });
        httpBackend.flush();
    })

    


});