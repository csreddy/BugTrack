'use strict';

describe('Service: bug', function () {

  // load the service's module
  beforeEach(module('bug.services'));

  // instantiate service
  var bug;
  beforeEach(inject(function (_bug_) {
    bug = _bug_;
  }));

  it('should do something', function () {
    expect(!!bug).toBe(true);
  });

});
