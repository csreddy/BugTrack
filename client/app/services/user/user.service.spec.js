'use strict';

describe('Service: User', function () {

  // load the service's module
  beforeEach(module('user.services', function($provide) {
    $provide.value('RESTURL', 'http://localhost:8003/v1/documents?uri=');
    $provide.value('Flash', {});
  }));

  // instantiate service
  var user, resturl, flash;
  beforeEach(inject(function (_User_, RESTURL, Flash) {
    user = _User_;
    resturl = RESTURL;
    flash = Flash;
  }));

  it('should do something', function () {
    expect(!!user).toBe(true);
  });

  it('should login user sucessfully', function(done) {
      var statuscode;
       user.login({username: 'sreddy', password: 'admin'});
      user.login({username: 'sreddy', password: 'admin'}).then(function(response) {
        console.log('===========',response.code);
        expect(response.code).toEqual(200);  
      });
  });

it('should throw invalid password error', function() {
  user.login({username: 'sreddy', password: 'wrong'}).then(function(response) {
        console.log('===========',response.code);
        expect(response.code).toEqual(201);  
      });
});

});
