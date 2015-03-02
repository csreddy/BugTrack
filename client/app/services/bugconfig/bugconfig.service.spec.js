'use strict';

describe('Service: bugconfig', function () {

  // load the service's module
  beforeEach(module('config.services'));

  // instantiate service
  var bugconfig;
  beforeEach(inject(function (_bugconfig_) {
    bugconfig = _bugconfig_;
  }));

  it('should do something', function () {
    expect(!!bugconfig).toBe(true);
  });

});
