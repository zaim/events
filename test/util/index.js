var debug = require('debug')('reddit-emit:test');

function ticker (count, done, id) {
  var total = count;
  id = id || '';
  return function (tag) {
    tag = tag || '';
    debug('tick', id, tag);
    if (--count === 0) {
      debug('boom', id);
      done();
    }
    if (count < 0) {
      throw new Error('Expected ' + total + ' ticks, but got more');
    }
  };
}

exports.ticker = ticker;
