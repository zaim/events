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
        var uri = '/r/pics/new.json?a=1&limit=25&test=qs';
        var qs = { test: 'qs', limit: 25 };
        var endpoints = [
          '/r/pics/new.json?a=1',
          'r/pics/new.json/?a=1',
          'r/pics/new.json?a=1',
          '/r/pics/new?a=1',
          'r/pics/new/?a=1',
          'r/pics/new?a=1',
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


      it('should pipe error, response, data and changed events', function (done) {
        var tick, error, data, epscope, ep;

        error = { message: 'error-from-endpoint' };
        data = { value: 'data-from-endpoint' };

        tick = ticker(4, function () {
          epscope.done();
          done();
        });

        epscope = nock('https://oauth.reddit.com')
          .get('/r/programming/new.json')
          .reply(200, data);

        ep = engine.endpoint('/r/programming/new.json');

        engine.on('error', function (err, eep) {
          debug(err);
          expect(err).to.eql(error);
          expect(eep).to.be(ep);
          tick('error');
        });

        engine.on('response', function (resp, eep) {
          debug(resp.body);
          expect(resp.body).to.eql(JSON.stringify(data));
          expect(eep).to.be(ep);
          tick('response');
        });

        engine.on('data', function (d, eep) {
          debug(data);
          expect(d).to.eql(data);
          expect(eep).to.be(ep);
          tick('data');
        });

        engine.on('changed', function (patch, eep) {
          debug(patch);
          expect(patch).to.eql([]);
          expect(eep).to.be(ep);
          tick('changed');
        });

        ep.options.headers.authorization =
          token.token_type + ' ' + token.access_token;
        ep.fetch();
        ep.emit('error', error);
        ep.emit('changed', []);
      });


      it('should use correct custom subclass', function () {
        function CustomA () { Endpoint.apply(this, arguments); }
        function CustomB () { Endpoint.apply(this, arguments); }

        util.inherits(CustomA, Endpoint);
        util.inherits(CustomB, Endpoint);

        engine.register(/\/r\/[^\/]+\/(new|hot|top)\.json/, CustomA);
        engine.register(/\/r\/[^\/]+\/comments\/[^\/]+\.json/, CustomB);

        var customA1 = engine.endpoint('/r/programming/new.json');
        var customA2 = engine.endpoint('/r/programming/hot.json');
        var customA3 = engine.endpoint('/r/programming/top.json');
        var customB1 = engine.endpoint('/r/javascript/comments/id123.json');
        var customB2 = engine.endpoint('/r/pics/comments/id456.json');
        var normal = engine.endpoint('/about/me.json');

        expect(customA1).to.be.a(CustomA);
        expect(customA2).to.be.a(CustomA);
        expect(customA3).to.be.a(CustomA);
        expect(customB1).to.be.a(CustomB);
        expect(customB2).to.be.a(CustomB);
        expect(normal).to.be.an(Endpoint);
        expect(normal).to.not.be.a(CustomA);
        expect(normal).to.not.be.a(CustomB);
      });

    });


    describe('fetch()', function () {

      it('should fetch data', function (done) {
        var data, epscope;

        data = { value: 'data-from-endpoint' };

        epscope = nock('https://oauth.reddit.com')
          .get('/r/programming/new.json')
          .reply(200, data);

        engine.fetch('/r/programming/new.json', null, function (d) {
          expect(d).to.eql(data);
          epscope.done();
          done();
        });
      });

    });


    describe('poll()', function () {

      it('should fetch data and start polling', function (done) {
        var tick, data, epscope, ep;

        function check (d) {
          expect(d).to.eql(data);
          tick();
        }

        tick = ticker(4, function () {
          ep.stop();
          epscope.done();
          done();
        });

        data = { value: 'data-from-endpoint' };

        epscope = nock('https://oauth.reddit.com')
          .get('/r/programming/new.json')
          .times(3)
          .reply(200, data);

        engine.config.interval = 50;

        ep = engine.poll('/r/programming/new.json', null, check);
        ep.on('data', check);
      });

    });


    describe('isRegistered()', function () {

      it('should return true for custom endpoints', function () {
        function Custom () { Endpoint.apply(this, arguments); }
        util.inherits(Custom, Endpoint);
        engine.register(/test_random_endpoint\/[0-9]+/, Custom);
        expect(engine.isRegistered('test_random_endpoint/42')).to.be(true);
      });


      it('should return false for unknown endpoints', function () {
        expect(engine.isRegistered('/unknown/endpoint/path')).to.be(false);
      });

    });


    describe('getRegisteredEndpoints()', function () {

      it('should return array of the registry', function () {
        function Custom1 () { Endpoint.apply(this, arguments); }
        function Custom2 () { Endpoint.apply(this, arguments); }
        function Custom3 () { Endpoint.apply(this, arguments); }

        util.inherits(Custom1, Endpoint);
        util.inherits(Custom2, Endpoint);
        util.inherits(Custom3, Endpoint);

        engine.register(/\/test\/endpoint1\.json/, Custom1);
        engine.register(/\/test\/endpoint2\.json/, Custom2);
        engine.register(/\/test\/endpoint3\.json/, Custom3);

        var registry = engine.getRegisteredEndpoints();

        expect(registry).to.eql([
          [/\/test\/endpoint1\.json/, Custom1],
          [/\/test\/endpoint2\.json/, Custom2],
          [/\/test\/endpoint3\.json/, Custom3]
        ]);
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
