/* global describe, it */

var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./util').ticker;
var Request = require('../').Request;


describe('Request', function () {

  function getScope () {
    return nock('https://www.reddit.com/').get('/comments/test');
  }


  it('should throw error with missing options', function () {
    expect(Request).to.throwError(/Request requires the "options" argument/);
    expect(function () {
      new Request({}); // jshint ignore:line
    }).to.throwError(/Request requires the "url" option/);
  });


  it('should emit error on missing options on fetch', function (done) {
    var request = new Request({ url: 'initial' });
    request.options.url = null;
    request.on('error', function (e) {
      expect(e.message).to.match(/Request requires the "url" option/);
      done();
    });
    request.fetch();
  });


  it('should send request at intervals', function (done) {
    var tick, scope, request;

    tick = ticker(3, function () {
      request.stop();
      scope.done();
      done();
    });

    scope = getScope().times(3).reply(200, {});

    request = new Request({
      interval: 10,
      url: 'https://www.reddit.com/comments/test'
    });

    request.on('error', function (e) {
      expect().fail(e);
    });
    request.on('response', tick);

    request.poll();
  });


  it('should emit error on non-200 responses', function (done) {
    var tick, scope, request;

    tick = ticker(2, function () {
      request.stop();
      scope.done();
      done();
    });

    scope = getScope().reply(500);

    request = new Request({
      interval: 10,
      url: 'https://www.reddit.com/comments/test'
    });

    request.on('error', function (err) {
      expect(err.message).to.match(/^Request: request responded with/);
      tick();
    });

    // test 'response' event must always be fired
    request.on('response', function (resp) {
      expect(resp.statusCode).to.eql(500);
      tick();
    });

    request.fetch();
  });


  it('should still refresh on error', function (done) {
    var tick, scope, request;

    tick = ticker(3, function () {
      request.stop();
      scope.done();
      done();
    });

    scope = getScope().times(3).reply(500);

    request = new Request({
      interval: 10,
      url: 'https://www.reddit.com/comments/test'
    });

    request.on('error', tick);

    request.poll();
  });


  it('should stop refresh on error if stopOnFail=true', function (done) {
    var tick, scope, request;

    tick = ticker(2, function () {
      expect(request.isActive()).to.be(false);
      scope.done();
      done();
    });

    scope = getScope()
      .reply(200, {})
      .get('/comments/test')
      .reply(500);

    request = new Request({
      interval: 10,
      url: 'https://www.reddit.com/comments/test',
      stopOnFail: true
    });

    request.on('data', tick);
    request.on('error', tick);

    request.poll();
  });

});
