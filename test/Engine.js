/* global describe, it, beforeEach, afterEach */

var debug = require('debug')('reddit-emit:test:engine');
var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./util').ticker;
var Engine = require('../');


describe('Engine', function () {

  describe('start()', function () {

    it('should throw error on missing options', function () {
      var engine = new Engine();
      expect(engine.start.bind(engine)).to.throwError(
        'Engine requires the "clientID" config'
      );
      expect(engine.start.bind(engine, { clientSecret:'x' })).to.throwError(
        'Engine requires the "clientID" config'
      );
      expect(engine.start.bind(engine, { clientID:'x' })).to.throwError(
        'Engine requires the "clientSecret" config'
      );
    });


    it('should pipe AccessToken error and data events', function (done) {
      var tick, error, token, scope, engine;

      tick = ticker(2, function () {
        scope.done();
        engine.tokens.stop();
        done();
      });

      error = { message:'from-access-token' };
      token = { access_token:'test', token_type:'bearer' };

      scope = nock('https://www.reddit.com/')
        .post('/api/v1/access_token')
        .reply(200, token);

      engine = new Engine({
        clientID: 'testclientid',
        clientSecret: 'testclientsecret'
      });

      engine.on('error', function (e) {
        expect(e).to.eql(error);
        tick();
      });

      engine.on('token', function (t) {
        expect(t).to.eql(token);
        tick();
      });

      engine.start();
      engine.tokens.emit('error', error);
    });

  });


  describe('endpoint()', function () {
    var token, scope, engine;

    token = { access_token:'test', token_type:'bearer' };

    beforeEach(function () {
      scope = nock('https://www.reddit.com/')
        .post('/api/v1/access_token')
        .reply(200, token);
      engine = new Engine({
        clientID: 'testclientid',
        clientSecret: 'testclientsecret'
      });
      engine.start();
    });

    afterEach(function () {
      scope.done();
      engine.tokens.stop();
    });


    it('should throw error when engine not started', function () {
      var engine = new Engine();
      expect(engine.endpoint.bind(engine)).to.throwError(
        'Engine: call .start() before accessing endpoints'
      );
    });


    it('should create Endpoint object with correct options', function () {
      var endpoints = [
        ['/r/pics/new.json', '/r/pics/new.json'],
        ['r/pics/new.json/', '/r/pics/new.json'],
        ['r/pics/new.json',  '/r/pics/new.json'],
        ['/r/pics/new', '/r/pics/new.json'],
        ['r/pics/new/', '/r/pics/new.json'],
        ['r/pics/new',  '/r/pics/new.json']
      ];
      endpoints.forEach(function (test) {
        var ep = engine.endpoint(test[0]);
        expect(ep.options.url).to.eql('https://oauth.reddit.com' + test[1]);
      });
    });


    it('should return same Endpoint objects when url is reused', function () {
      var endpoints = [
        '/r/javascript/hot.json',
        'r/javascript/hot.json/',
        'r/javascript/hot.json',
        '/r/javascript/hot',
        'r/javascript/hot/',
        'r/javascript/hot'
      ].map(function (path) {
        return engine.endpoint(path);
      });
      endpoints.reduce(function (ep1, ep2) {
        expect(ep1).to.be(ep2);
        return ep1;
      }, endpoints[0]);
    });


    it('should pipe Endpoint error, response and data events', function (done) {
      var tick, error, data, epscope, ep;

      error = { message: 'error-from-endpoint' };
      data = { value: 'data-from-endpoint' };

      tick = ticker(3, function () {
        epscope.done();
        done();
      });

      epscope = nock('https://oauth.reddit.com')
        .get('/r/programming/new.json')
        .reply(200, data);

      ep = engine.endpoint('/r/programming/new.json');

      engine.on('error', function (err) {
        debug(err);
        expect(err).to.eql(error);
        tick('error');
      });

      engine.on('response', function (resp) {
        debug(resp.body);
        expect(resp.body).to.eql(JSON.stringify(data));
        tick('response');
      });

      engine.on('data', function (d) {
        debug(data);
        expect(d).to.eql(data);
        tick('data');
      });

      ep.options.headers.authorization =
        token.token_type + ' ' + token.access_token;
      ep.fetch();
      ep.emit('error', error);
    });

  });

});
