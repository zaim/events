/* global describe, it */

var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./util').ticker;
var AccessToken = require('../lib/core').AccessToken;


describe('AccessToken', function () {

  it('should send correct request', function (done) {
    var tick, tokens, scope, emitter;

    tick = ticker(2, function () {
      emitter.stop();
      scope.done();
      done();
    });

    tokens = {
      access_token: 'testtoken',
      token_type: 'bearer',
      expires_in: 1
    };

    scope = nock('https://www.reddit.com/')
      .post('/api/v1/access_token')
      .reply(200, tokens);

    emitter = new AccessToken({
      url: 'https://www.reddit.com/api/v1/access_token',
      id: 'testclientid',
      secret: 'testclientsecret',
      type: 'testcredentials'
    });

    emitter.on('response', function (res) {
      var req = res.request;
      var body = req.body.toString();
      expect(body).to.be('grant_type=testcredentials');
      expect(req.headers.authorization).to.match(/^Basic /);
      expect(req.headers['user-agent']).to.be.ok();
      tick();
    });

    emitter.on('data', function (body) {
      expect(body).to.eql(tokens);
      tick();
    });

    emitter.fetch();
  });


  it('should adjust interval based on expires_in', function (done) {
    var tick, scope, emitter, start;

    this.timeout(3500);

    tick = ticker(3, function () {
      var elapsed = Date.now() - start;
      expect(elapsed).to.be.above(3000);
      emitter.stop();
      scope.done();
      done();
    });

    scope = nock('https://www.reddit.com/')
      .post('/api/v1/access_token')
      .reply(200, { expires_in: 2 })  //   2
      .post('/api/v1/access_token')
      .reply(200, { expires_in: 1 })  // + 1 = 3 seconds max
      .post('/api/v1/access_token')
      .reply(200, { expires_in: 9 }); // this interval should be ignored

    emitter = new AccessToken({
      url: 'https://www.reddit.com/api/v1/access_token',
      id: 'testclientid',
      secret: 'testclientsecret',
      type: 'testcredentials'
    });

    emitter.on('response', tick);

    start = Date.now();
    emitter.poll();
  });


  it('should throw error on missing options', function () {
    expect(function () {
      AccessToken.call({});
    }).to.throwError(/^AccessToken requires "id" and "secret" options/);
  });

});
