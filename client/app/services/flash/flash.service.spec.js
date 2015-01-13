'use strict';

describe('Service: Flash', function () {

  // load the service's module
  beforeEach(module('flash.services'));

  // instantiate service
  var flash;
  beforeEach(inject(function (_Flash_) {
    flash = _Flash_;
  }));

  it('should do something', function () {
    expect(!!flash).toBe(true);
  });

  it('should flash the passed message', function() {
     flash.addAlert('success','hello world');
  });

});
