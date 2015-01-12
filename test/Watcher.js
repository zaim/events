/* global describe, it */

//var debug = require('debug')('reddit-emit:test:watcher');
var expect = require('expect.js');
var jiff = require('jiff');
var Emitter = require('eventemitter3');
var Watcher = require('../').Watcher;
var ticker = require('./util').ticker;


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

});
