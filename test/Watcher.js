'use strict';

/* global describe, it */

//var debug = require('debug')('remmit:test:watcher');
var expect = require('expect.js');
var jiff = require('jiff');
var Emitter = require('eventemitter3');
var Watcher = require('../lib/core/Watcher');
var ticker = require('./_util').ticker;


describe('Watcher', function () {

  it('should emit operations', function (done) {
    var i = 0, initial, mutations, tick, source, watcher;

    initial = { k: 'initial' };

    mutations = [
      initial,
      { k:'change-1', arr:[1], add:'prop' },
      { k:'change-2', arr:[1,2] },
      { k:'change-3', arr:[1,2,3], extra:'value' },
      { k:'change-3', arr:[1,2], extra:'new' }
    ];

    tick = ticker(mutations.length - 1, done);

    source = new Emitter();

    watcher = new Watcher(source);

    watcher.on('changed', function (patch) {
      initial = jiff.patch(patch, initial);
      expect(initial).to.eql(mutations[++i]);
      tick();
    });

    mutations.forEach(source.emit.bind(source, 'data'));
  });


  it('should not emit operations when data is the same', function (done) {
    var mutations, tick, source, watcher;

    mutations = [
      { k:'key1', changed:false },
      { k:'key1', changed:false },
      { k:'key1', changed:false },
      { k:'key1', changed:false }
    ];

    tick = ticker(mutations.length, done);

    source = new Emitter();

    watcher = new Watcher(source);

    watcher.on('changed', function () {
      expect().fail('changed event should not fire');
    });

    source.on('data', tick);

    mutations.forEach(source.emit.bind(source, 'data'));
  });

});
