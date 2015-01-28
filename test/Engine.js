'use strict';

/* global describe, it, beforeEach, afterEach */

var util = require('util');
var debug = require('debug')('remmit:test:engine');
var expect = require('expect.js');
var nock = require('nock');
var ticker = require('./_util').ticker;
var Engine = require('../lib/core/Engine');
var Endpoint = require('../lib/core/Endpoint');


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


  describe('(started)', function () {
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


    describe('endpoint()', function () {

      it('should throw error when engine not started', function () {
        var engine = new Engine();
        expect(engine.endpoint.bind(engine)).to.throwError(
          'Engine: call .start() before accessing endpoints'
        );
      });


      it('should create endpoint with correct options', function () {
        var uri = '/r/pics/new.json';
        var qs = { limit: 25, test: 'qs' };
        var endpoints = [
          '/r/pics/new.json',
          'r/pics/new.json/',
          'r/pics/new.json',
          '/r/pics/new',
          'r/pics/new/',
          'r/pics/new',
        ];
        endpoints.forEach(function (test) {
          var ep = engine.endpoint(test, qs);
          expect(ep.options.url.href)
            .to.eql('https://oauth.reddit.com' + uri);
          expect(ep.options.qs).to.eql(qs);
        });
      });


      it('should return same endpoint when url is reused', function () {
        var different = engine.endpoint('/r/programming/top.json');
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
          expect(ep1).to.not.be(different);
          expect(ep2).to.be(ep1);
          return ep2;
        }, endpoints[0]);
      });


      it('should return same endpoint when url is reused with qs', function () {
        var different = engine.endpoint('/r/javascript/hot.json', { d:'x' });
        var endpoints = [
          ['/r/javascript/hot.json', { a:1, b:2, c:3 }],
          ['r/javascript/hot.json/', { b:2, c:3, a:1 }],
          ['r/javascript/hot.json', { c:3, b:2, a:1 }],
          ['/r/javascript/hot', { a:1, c:3, b:2 }],
          ['r/javascript/hot/', { b:2, a:1, c:3 }],
          ['r/javascript/hot', { c:3, a:1, b:2 }]
        ].map(function (p) {
          return engine.endpoint(p[0], p[1]);
        });
        endpoints.reduce(function (ep1, ep2) {
          expect(ep2).to.not.be(different);
          expect(ep2).to.be(ep1);
          return ep2;
        }, endpoints[0]);
      });


      it('should pipe error, response and data events', function (done) {
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


      it('should use correct custom subclass', function () {
        function Custom () { Endpoint.apply(this, arguments); }
        function Global () { Endpoint.apply(this, arguments); }

        util.inherits(Custom, Endpoint);
        util.inherits(Global, Endpoint);

        Engine.register(/\/r\/[^\/]+\/(new|hot|top)\.json/, Global);
        engine.register(/\/r\/[^\/]+\/comments\/[^\/]+\.json/, Custom);

        var thread = engine.endpoint('/r/javascript/comments/id123.json');
        var subnew = engine.endpoint('/r/programming/new.json');
        var subhot = engine.endpoint('/r/programming/hot.json');
        var subtop = engine.endpoint('/r/programming/top.json');
        var normal = engine.endpoint('/about/me.json');

        expect(thread).to.be.a(Custom);
        expect(subnew).to.be.a(Global);
        expect(subhot).to.be.a(Global);
        expect(subtop).to.be.a(Global);
        expect(normal).to.be.an(Endpoint);
        expect(normal).to.not.be.a(Custom);
        expect(normal).to.not.be.a(Global);
      });

    });


    describe('isRegistered()', function () {

      it('should return true for global endpoints', function () {
        function Global2 () { Endpoint.apply(this, arguments); }

        util.inherits(Global2, Endpoint);

        Engine.register(/\/r\/[^\/]+\/(new|hot|top)\.json/, Global2);

        ['r/javascript/hot.json/',
        'r/javascript/hot.json',
        '/r/javascript/hot',
        'r/javascript/hot/',
        'r/javascript/hot'].forEach(function (path) {
          expect(engine.isRegistered(path)).to.be(true);
        });
      });


      it('should return true for custom endpoints', function () {
        function Custom2 () { Endpoint.apply(this, arguments); }

        util.inherits(Custom2, Endpoint);

        engine.register(/test_random_endpoint\/[0-9]+/, Custom2);

        expect(engine.isRegistered('test_random_endpoint/42')).to.be(true);
      });


      it('should return false for unknown endpoints', function () {
        expect(engine.isRegistered('/unknown/endpoint/path')).to.be(false);
      });

    });


    describe('getRegisteredEndpoints()', function () {

      it('should return array of the registry', function () {
        function Custom3 () { Endpoint.apply(this, arguments); }
        function Custom4 () { Endpoint.apply(this, arguments); }
        function Global3 () { Endpoint.apply(this, arguments); }
        function Global4 () { Endpoint.apply(this, arguments); }

        util.inherits(Custom3, Endpoint);
        util.inherits(Custom4, Endpoint);
        util.inherits(Global3, Endpoint);
        util.inherits(Global4, Endpoint);

        Engine.register(/\/test\/endpoint1\.json/, Global3);
        Engine.register(/\/test\/endpoint2\.json/, Global4);
        engine.register(/\/test\/endpoint3\.json/, Custom3);
        engine.register(/\/test\/endpoint4\.json/, Custom4);

        var registry = engine.getRegisteredEndpoints();

        // Note that other `GlobalN` global classes might have
        // been registered from previous tests.
        // TODO: maybe an Engine.clearEndpoints() static function?

        var regexps = registry.map(function (reg) {
          return reg[0].toString();
        });

        var classes = registry.map(function (reg) {
          return reg[1];
        });

        expect(regexps).to.contain('/\\/test\\/endpoint1\\.json/');
        expect(regexps).to.contain('/\\/test\\/endpoint2\\.json/');
        expect(regexps).to.contain('/\\/test\\/endpoint3\\.json/');
        expect(regexps).to.contain('/\\/test\\/endpoint4\\.json/');
        expect(classes).to.contain(Global3);
        expect(classes).to.contain(Global4);
        expect(classes).to.contain(Custom3);
        expect(classes).to.contain(Custom4);
        expect(classes.indexOf(Custom3)).to.be.below(
          classes.indexOf(Global3));
      });

    });


    describe('isActive()', function () {

      it('should return active state of endpoints', function () {
        engine.endpoint('/r/programming/new.json');
        engine.endpoint('/r/pics/top.json', {limit: 10});
        expect(engine.isActive('/r/programming/new.json')).to.be(true);
        expect(engine.isActive('/r/pics/top.json')).to.be(false);
        expect(engine.isActive('/r/pics/top.json', {limit: 10})).to.be(true);
        expect(engine.isActive('/r/pics/top.json', {limit: 5})).to.be(false);
        expect(engine.isActive('/comments/post1.json')).to.be(false);
      });

    });


    describe('isPolling()', function () {

      it('should return polling state of endpoints', function () {
        var epscope, ep;

        epscope = nock('https://oauth.reddit.com')
          .get('/r/programming/new.json')
          .reply(200, {});

        ep = engine.endpoint('/r/programming/new.json');

        ep.poll(1000);
        expect(engine.isPolling('/r/programming/new.json')).to.be(true);

        ep.stop();
        expect(engine.isPolling('/r/programming/new.json')).to.be(false);
      });

    });

  });

});
