'use strict';

/* global describe, it */

var expect = require('expect.js');
var ticker = require('./_util').ticker;
var ValueEmitter = require('../lib/core/ValueEmitter');


describe('ValueEmitter', function () {

  it('should receive last event', function (done) {
    var emitter, data;

    emitter = new ValueEmitter();

    data = [
      { test: 'data1' },
      { test: 'data2' },
      { test: 'data3' }
    ];

    emitter.emit('data', data[0], {});
    emitter.emit('data', data[1], {});
    emitter.emit('data', data[2], {});

    emitter.value('data', function (d, o) {
      expect(this).to.be(emitter);
      expect(d).to.be(data[data.length - 1]);
      expect(o).to.eql({});
      done();
    });
  });


  it('should continue to receive later events', function (done) {
    var tick, emitter, data;

    emitter = new ValueEmitter();

    data = [
      { index: 0 },
      { index: 1 },
      { index: 2 },
      { index: 3 },
      { index: 4 },
      { index: 5 },
      { index: 6 }
    ];

    tick = ticker(data.length + 4, done);

    // listener #1
    emitter.value('data', function (d) {
      expect(d.index).to.be.above(-1);
      tick();
    });

    emitter.emit('data', data[0]);  // -> #1
    emitter.emit('data', data[1]);  // -> #1
    emitter.emit('data', data[2]);  // -> #1
    emitter.emit('data', data[3]);  // -> #1, #2

    // listener #2
    emitter.value('data', function (d) {
      expect(d.index).to.be.above(2);
      tick();
    });

    emitter.emit('data', data[4]);  // -> #1, #2
    emitter.emit('data', data[5]);  // -> #1, #2
    emitter.emit('data', data[6]);  // -> #1, #2
  });


  describe('valueOnce()', function () {

    it('should only call listener once', function (done) {
      var emitter = new ValueEmitter();

      emitter.valueOnce('data', function () {
        done();
      });

      emitter.emit('data', {});
      emitter.emit('data', {});
      emitter.emit('data', {});
    });

  });


  describe('clear()', function () {

    it('should clear event data', function (done) {
      var tick = ticker(2, done);
      var emitter = new ValueEmitter();

      emitter.emit('data', 'data1');
      emitter.emit('data', 'data2');
      emitter.emit('data', 'data3');
      emitter.emit('event', 'event1');
      emitter.emit('event', 'event2');
      emitter.emit('event', 'event3');

      emitter.valueOnce('data', function (d) {
        expect(d).to.be('data3');
        tick();
      });

      emitter.clear('data');

      emitter.valueOnce('data', function () {
        expect().fail('should not be called');
      });

      emitter.valueOnce('event', function (d) {
        expect(d).to.be('event3');
        tick();
      });
    });


    it('should clear all data', function (done) {
      var tick = ticker(2, done);
      var emitter = new ValueEmitter();

      emitter.emit('data', 'data1');
      emitter.emit('data', 'data2');
      emitter.emit('data', 'data3');
      emitter.emit('event', 'event1');
      emitter.emit('event', 'event2');
      emitter.emit('event', 'event3');

      emitter.valueOnce('data', function (d) {
        expect(d).to.be('data3');
        tick();
      });

      emitter.valueOnce('event', function (d) {
        expect(d).to.be('event3');
        tick();
      });

      emitter.clear();

      emitter.value('data', function () {
        expect().fail('"data" listener should not be called');
      });

      emitter.value('event', function () {
        expect().fail('"event" listener should not be called');
      });
    });

  });


  describe('getValue()', function () {

    it('should get the current value', function () {
      var emitter = new ValueEmitter();
      expect(emitter.getValue('data')).to.be.an('undefined');
      emitter.emit('data', 'data1');
      expect(emitter.getValue('data')).to.eql(['data1']);
    });

  });


});
