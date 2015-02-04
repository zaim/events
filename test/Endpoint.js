'use strict';

/* global describe, it */

var Emitter = require('eventemitter3');
var debug = require('debug')('remmit:test:endpoint');
var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./_util').ticker;
var ValueEmitter = require('../lib/core/ValueEmitter');
var Endpoint = require('../lib/core/Endpoint');


describe('Endpoint', function () {

  it('should throw an error if url is missing', function () {
    expect(Endpoint).to.throwError(/Endpoint requires the "url" option/);
    expect(Endpoint.bind(null, {}))
      .to.throwError(/Endpoint requires the "url" option/);
  });


  it('should parse the url and properties', function () {
    var url = 'https://oauth.reddit.com/comments/test?sort=new&limit=10';
    var eurl = 'https://oauth.reddit.com/comments/test?add=1&limit=10&sort=new';
    var endpoint = new Endpoint({
      url: url,
      qs: { add: 1 }
    });
    var eq = { add: 1, sort: 'new', limit: 10 };
    expect(endpoint.options.uri).to.be.an('object');
    expect(endpoint.options.uri.query).to.eql(eq);
    expect(endpoint.options.uri).to.equal(endpoint.options.url);
    expect(endpoint.href).to.be(eurl);
    expect(endpoint.path).to.be('/comments/test?add=1&limit=10&sort=new');
    expect(endpoint.pathname).to.be('/comments/test');
    expect(endpoint.query).to.eql(eq);
  });


  it('should set key and engine properties', function () {
    var eng = new Emitter();
    var url = 'https://oauth.reddit.com/comments/test?sort=new&limit=10';
    var key = '/comments/test?limit=10&sort=new';
    var ep1 = new Endpoint({ url: url, key: key });
    var ep2 = new Endpoint({ url: url, key: key }, null, eng);
    expect(ep1.key).to.be(key);
    expect(ep1.engine).to.be.an('undefined');
    expect(ep2.key).to.be(key);
    expect(ep2.engine).to.be(eng);
  });


  it('should send request with correct query', function (done) {
    var scope, token, endpoint;

    scope = nock('https://oauth.reddit.com/')
      .get('/comments/test?limit=10&sort=new')
      .reply(500, {});

    token = new ValueEmitter();
    token.emit('data', {
      token_type: 'bearer',
      access_token: 'testtoken'
    });

    endpoint = new Endpoint({
      url: 'https://oauth.reddit.com/comments/test?limit=10',
      qs: { sort: 'new' }
    });

    endpoint.on('response', function (resp) {
      expect(resp.request.url.href).to.eql(
        'https://oauth.reddit.com/comments/test?limit=10&sort=new');
      endpoint.stop();
      scope.done();
      done();
    });

    endpoint.setTokenEmitter(token);
    endpoint.poll();
  });


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

    tick = ticker(5, function () {
      clearTimeout(timer);
      endpoint.stop();
      scope.done();
      done();
    });

    scope = nock('https://oauth.reddit.com/')
      .get('/comments/test')
      .times(5)
      .reply(200, {});

    token = new ValueEmitter();

    endpoint = new Endpoint({
      url: 'https://oauth.reddit.com/comments/test',
      interval: 5
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
      timer = setTimeout(emitToken, 10);
    }
  });


  it('should throttle polling on error', function (done) {
    var uri = '/comments/test';
    var tick, scope, token, endpoint;

    tick = ticker(10, function () {
      endpoint.stop();
      scope.done();
      done();
    });

    scope = nock('https://oauth.reddit.com/')
      .get(uri).reply(200, {})
      .get(uri).reply(200, {})
      .get(uri).reply(503, {})
      .get(uri).reply(503, {})
      .get(uri).reply(200, {})
      .get(uri).reply(200, {})
      .get(uri).reply(503, {})
      .get(uri).reply(503, {})
      .get(uri).reply(200, {})
      .get(uri).reply(200, {});

    token = new ValueEmitter();
    token.emit('data', {
      token_type: 'bearer',
      access_token: 'testtoken'
    });

    endpoint = new Endpoint({
      url: 'https://oauth.reddit.com' + uri,
      interval: 5,
      throttle: 0.1
    });

    endpoint.on('error', function () {
      expect(endpoint.options.interval).to.be.above(5);
      tick('e=' + endpoint.options.interval);
    });

    endpoint.on('data', function () {
      expect(endpoint.options.interval).to.be(5);
      tick('d=' + endpoint.options.interval);
    });

    endpoint.setTokenEmitter(token);
    endpoint.poll();
  });

});
