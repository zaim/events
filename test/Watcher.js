/* global describe, it */

//var debug = require('debug')('reddit-emit:test:watcher');
var expect = require('expect.js');
var Emitter = require('eventemitter3');
var Watcher = require('../lib/Watcher');
var ticker = require('./util').ticker;


describe('Watcher', function () {

  it('should emit operations', function (done) {
    var data, tick, source, watcher;

    data = [
      [{ k: 'initial' }],
      [{ k: 'change-1' }],
      [{ k: 'change-2' }],
      [{ k: 'change-3' }]
    ];

    tick = ticker((data.length - 1) * 3, done);

    source = new Emitter();

    watcher = new Watcher(source);

    watcher.on('op', function (op) {
      expect(op).to.have.keys('op', 'path');
      if (op.value) {
        expect(op.value).to.have.keys('k');
      }
      tick();
    });

    data.forEach(source.emit.bind(source, 'data'));
  });

});
