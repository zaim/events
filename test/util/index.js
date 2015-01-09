var debug = require('debug')('res:test');

function ticker (count, done, tag) {
  var total = count;
  tag = tag ? tag + ':' : '';
  return function () {
    debug(tag + 'tick ' + count);
    if (--count === 0) {
      debug(tag + 'boom 0');
      done();
    }
    if (count < 0) {
      throw new Error('Expected ' + total + ' ticks, but got more');
    }
  };
}

exports.ticker = ticker;
