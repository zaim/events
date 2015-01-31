'use strict';

/* global describe, it */

var expect = require('expect.js');
var Reddit = require('../lib');
var Engine = require('../lib/core/Engine');
var Thread = require('../lib/endpoints/Thread');
var Subreddit = require('../lib/endpoints/Subreddit');


describe('main', function () {

  it('should instanciate Engine', function () {
    var reddit = new Reddit();
    expect(reddit).to.be.an(Engine);
  });

  it('should have registered custom endpoint classes', function () {
    var reddit = new Reddit();
    var endpoints = reddit.getRegisteredEndpoints();
    var classes = endpoints.map(function (ec) {
      return ec[1];
    });
    expect(classes).to.eql([Thread, Subreddit]);
  });

});
