/* global describe, it */

var expect = require('expect.js');
var ticker = require('./util').ticker;
var ValueEmitter = require('../lib/ValueEmitter');


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

});
