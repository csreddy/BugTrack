'use strict';

var should = require('should');
var app = require('../../app');
var _ = require('lodash')
var request = require('supertest');
var setup = require('../../../setup/test_setup');

describe('GET /api/configure', function() {

    before(function() {
        console.log('--------- setup -------');
        setup.loadConfig();
        setup.loadUsers();
        setup.loadSearchOptions();
    });

    it('should return Object from config.json content', function(done) {
        request(app)
            .get('/api/configure')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Object);
                done();
            });
    });

    it('should throw error when config.json not found', function(done) {
        // TODO
        done();
    })

});


describe('PUT /api/configure/update', function() {
    it('should throw error when added empty value', function(done) {
        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'add',
                category: 'kind',
                items: ''
            })
            .expect(500)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('cannot update config with empty value');
                done();
            })
    });

    it('should throw error when delete empty items', function(done) {
        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'delete',
                category: 'kind'
            })
            .expect(500)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('cannot update config with empty value');
                done();
            })
    });

    it('should add new item to kind', function(done) {
        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'add',
                category: 'kind',
                items: 'test'
            })
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');

                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        res.body.kind.should.containEql("test");
                    })
                done();
            })
    });

    it('should remove item from kind', function(done) {
        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'delete',
                category: 'kind',
                items: ['test']
            })
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');

                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        res.body.kind.should.not.containEql("test");
                    })
                done();
            })
    });

    it('should add new item to users', function(done) {
        var user = {
            "username": "testuser",
            "email": "testuser@marklogic.com",
            "name": "Test User"
        };

        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'add',
                category: 'users',
                items: user
            })
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');

                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        res.body.users.should.containEql(user);
                    })
                done();
            })
    });

    it('should add a new group', function(done) {
        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'add',
                category: 'groups',
                items: 'testGroup1'
            })
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');

                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        res.body.groups.should.containEql({
                            label: 'testGroup1',
                            value: 'testGroup1',
                            children: []
                        });
                    })
                done();
            });
    });

    it('should add a new group', function(done) {
        request(app)
            .put('/api/configure/update')
            .send({
                operation: 'add',
                category: 'groups',
                items: 'testGroup2'
            })
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');

                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        res.body.groups.should.containEql({
                            label: 'testGroup2',
                            value: 'testGroup2',
                            children: []
                        });
                    })
                done();
            });
    });

});


describe('PUT /api/configure/adduserstogroup', function() {

    it('should add users to the testGroup1', function(done) {

        var data = {
            group: "testGroup1",
            users: [{
                username: 'tuser1',
                email: 'tuser1@marklogic.com',
                name: 'Test User1'
            }, {
                username: 'tuser2',
                email: 'tuser2@marklogic.com',
                name: 'Test User2'
            }]
        }

        request(app)
            .put('/api/configure/adduserstogroup')
            .send(data)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');
                // verify that config.json is updated correctly
                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        var groups = res.body.groups;
                        var index = _.findIndex(groups, function(group) {
                            return group.label == data.group
                        })
                        res.body.groups[index].children.should.containEql({
                            label: 'Test User1',
                            value: {
                                username: 'tuser1',
                                email: 'tuser1@marklogic.com',
                                name: 'Test User1'
                            },
                            parent: 'testGroup1'
                        });
                        res.body.groups[index].children.should.containEql({
                            label: 'Test User2',
                            value: {
                                username: 'tuser2',
                                email: 'tuser2@marklogic.com',
                                name: 'Test User2'
                            },
                            parent: 'testGroup1'
                        });
                        done();
                    })

            });
    });

    it('should add users to the testGroup2', function(done) {

        var data = {
            group: "testGroup2",
            users: [{
                username: 'tuser3',
                email: 'tuser3@marklogic.com',
                name: 'Test User3'
            }, {
                username: 'tuser4',
                email: 'tuser4@marklogic.com',
                name: 'Test User4'
            }]
        }

        request(app)
            .put('/api/configure/adduserstogroup')
            .send(data)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');
                // verify that config.json is updated correctly
                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        var groups = res.body.groups;
                        var index = _.findIndex(groups, function(group) {
                            return group.label == data.group
                        })
                        res.body.groups[index].children.should.containEql({
                            label: 'Test User3',
                            value: {
                                username: 'tuser3',
                                email: 'tuser3@marklogic.com',
                                name: 'Test User3'
                            },
                            parent: 'testGroup2'
                        });
                        res.body.groups[index].children.should.containEql({
                            label: 'Test User4',
                            value: {
                                username: 'tuser4',
                                email: 'tuser4@marklogic.com',
                                name: 'Test User4'
                            },
                            parent: 'testGroup2'
                        });
                        done();
                    })
            });
    });

    it('should a add group to another group', function(done) {
        var data = {
            group: "testGroup1",
            users: ["group1", "group2"]
        };

        request(app)
            .put('/api/configure/adduserstogroup')
            .send(data)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.eql('config updated');
                // verify that config.json is updated correctly
                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        if (err) return done(err);
                        var groups = res.body.groups;
                        var index = _.findIndex(groups, function(g) {
                            return g.label == data.group
                        })
                        var index2 = _.findIndex(groups[index].children, function(g) {
                            return g.label == data.users[0];
                        });

                        res.body.groups[index].children[index2].label.should.eql('group1');
                        res.body.groups[index].children[index2 + 1].label.should.eql('group2');
                        done();
                    })
            });

    })

});



describe('PUT /api/configure/removeusersfromgroup', function() {
    it('should remove users from the same group', function(done) {
        var data = {
            users: [{
                label: 'Test User1',
                value: {
                    username: 'tuser1',
                    email: 'tuser1@marklogic.com',
                    name: 'Test User1'
                },
                parent: 'testGroup1',
                ancestors: [],
                selected: true
            }, {
                label: 'Test User2',
                value: {
                    username: 'tuser2',
                    email: 'tuser2@marklogic.com',
                    name: 'Test User2'
                },
                parent: 'testGroup1',
                ancestors: [],
                selected: true
            }]
        };
        request(app)
            .put('/api/configure/removeusersfromgroup')
            .send(data)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        var groups = res.body.groups;
                        // verfiy first user
                        var index = _.findIndex(groups, function(group) {
                            return group.label == data.users[0].parent
                        })
                        res.body.groups[index].children.should.not.containEql({
                            label: 'Test User1',
                            value: {
                                username: 'tuser1',
                                email: 'tuser1@marklogic.com',
                                name: 'Test User1'
                            },
                            parent: 'testGroup1'
                        });
                        res.body.groups[index].children.should.not.containEql({
                            label: 'Test User2',
                            value: {
                                username: 'tuser2',
                                email: 'tuser2@marklogic.com',
                                name: 'Test User2'
                            },
                            parent: 'testGroup1'
                        });
                        done();
                    })
            })

    })


    it('should remove users from multiple groups', function(done) {
        var data = {
            users: [{
                label: 'Test User1',
                value: {
                    username: 'tuser1',
                    email: 'tuser1@marklogic.com',
                    name: 'Test User1'
                },
                parent: 'testGroup1',
                ancestors: [],
                selected: true
            }, {
                label: 'Test User3',
                value: {
                    username: 'tuser2',
                    email: 'tuser2@marklogic.com',
                    name: 'Test User2'
                },
                parent: 'testGroup2',
                ancestors: [],
                selected: true
            }]
        };
        request(app)
            .put('/api/configure/removeusersfromgroup')
            .send(data)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                request(app)
                    .get('/api/configure')
                    .end(function(err, res) {
                        var groups = res.body.groups;
                        // verfiy first user
                        var index = _.findIndex(groups, function(group) {
                            return group.label == data.users[0].parent
                        })
                        res.body.groups[index].children.should.not.containEql({
                            label: 'Test User1',
                            value: {
                                username: 'tuser1',
                                email: 'tuser1@marklogic.com',
                                name: 'Test User1'
                            },
                            parent: 'testGroup1'
                        });
                        res.body.groups[index].children.should.not.containEql({
                            label: 'Test User3',
                            value: {
                                username: 'tuser3',
                                email: 'tuser3@marklogic.com',
                                name: 'Test User3'
                            },
                            parent: 'testGroup2'
                        });
                        done();
                    })
            })


    });

    it('should remove a group from the group', function(done) {
       
    });

    it('should remove multiple groups from the same group', function(done) {
        done()
    });

    it('should remove multiple groups from different groups', function(done) {
        done()
    })


})