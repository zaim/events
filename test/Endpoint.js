'use strict';

/* global describe, it */

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


  it('should parse the url and set path property', function () {
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

});
