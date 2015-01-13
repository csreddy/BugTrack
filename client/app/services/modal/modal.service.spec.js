'use strict';

describe('Service: modal', function () {

  // load the service's module
  beforeEach(module('modal.services'));

  // instantiate service
  var modal;
  beforeEach(inject(function (_modal_) {
    modal = _modal_;
  }));

  it('should do something', function () {
    expect(!!modal).toBe(true);
  });

});
