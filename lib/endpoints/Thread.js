var util = require('util');
var Endpoint = require('../core/Endpoint');


module.exports = Thread;

util.inherits(Thread, Endpoint);


function Thread () {
  Endpoint.apply(this, arguments);
}

// TODO
