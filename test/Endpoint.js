/* global describe, it */

var debug = require('debug')('reddit-emit:test:endpoint');
var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./_util').ticker;
var Engine = require('../lib/core');
var ValueEmitter = Engine.ValueEmitter;
var Endpoint = Engine.Endpoint;


describe('Endpoint', function () {

  it('should not send request without auth header', function (done) {
    var scope, endpoint;

    scope = nock('https://oauth.reddit.com/')
      .get('/comments/test')
      .reply(500, {});

    endpoint = new Endpoint({
      url: 'https://oauth.reddit.com/comments/test'
    });

    endpoint.on('response', function () {
      expect().fail('should not have sent request');
    });

    endpoint.fetch();

    setTimeout(function () {
      nock.cleanAll();
      done();
    }, 10);
  });


  it('should send correct auth header', function (done) {
    var scope, token, endpoint;

    scope = nock('https://oauth.reddit.com/')
      .get('/comments/test')
      .reply(200, {});

    token = new ValueEmitter();
    token.emit('data', {
      token_type: 'bearer',
      access_token: 'testtoken'
    });

    endpoint = new Endpoint({
      url: 'https://oauth.reddit.com/comments/test'
    });

    endpoint.on('response', function (resp) {
      expect(resp.request.headers.authorization).to.be(
        'bearer testtoken'
      );
      endpoint.stop();
      scope.done();
      done();
    });

    endpoint.setTokenEmitter(token);
    endpoint.poll();
  });


  it('should update auth header on new tokens', function (done) {
    var tick, scope, token, endpoint, timer, count = 0;

    tick = ticker(10, function () {
      clearTimeout(timer);
      endpoint.stop();
      scope.done();
      done();
    });

    scope = nock('https://oauth.reddit.com/')
      .get('/comments/test')
      .times(10)
      .reply(200, {});

    token = new ValueEmitter();

    endpoint = new Endpoint({
      url: 'https://oauth.reddit.com/comments/test',
      interval: 10
    });

    endpoint.on('response', checkToken);
    endpoint.setTokenEmitter(token);
    endpoint.poll();

    emitToken();

    function checkToken (resp) {
      var auth = resp.request.headers.authorization;
      var token = auth.split(' ')[1];
      var num = parseInt(token.split('-')[1], 10);
      debug(count, auth);
      expect(num).to.be.below(count + 1);
      tick();
    }

    function emitToken () {
      token.emit('data', {
        token_type: 'bearer',
        access_token: 'testtoken-' + (++count)
      });
      timer = setTimeout(emitToken, 20);
    }
  });

});
