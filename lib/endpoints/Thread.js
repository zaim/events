var util = require('util');
var Endpoint = require('../core/Endpoint');
var Watcher = require('../core/Watcher');
var rutil = require('./util');
var parse = Endpoint.prototype.parse;


module.exports = Thread;

util.inherits(Thread, Endpoint);


function Thread () {
  Endpoint.apply(this, arguments);
  this.watcher = new Watcher(this);
  this.watcher.on('changed', this.emit.bind(this, 'changed'));
}


Thread.prototype.parse = function (data) {
  data = rutil.parse(parse.call(this, data));
  return {
    post: data[0],
    comments: data[1]
  };
};
