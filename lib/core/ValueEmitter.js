var Emitter = require('eventemitter3');
var util = require('util');
var lodash = require('lodash');
var emit = Emitter.prototype.emit;


module.exports = ValueEmitter;

util.inherits(ValueEmitter, Emitter);


/**
 * An EventEmitter that saves the last data of events.
 *
 * Use the `value` method to attach an event listener,
 * if the listened event was previously fired, will
 * immediately execute the callback with the last data.
 *
 * @class
 * @augments EventEmitter
 */

function ValueEmitter () {
  Emitter.apply(this, arguments);
  this._savedEvents = {};
}


/**
 * @override
 */

ValueEmitter.prototype.emit = function () {
  var args = lodash.toArray(arguments);
  var event = args[0];
  var params = args.slice(1);
  this._savedEvents[event] = params;
  return emit.apply(this, args);
};


/**
 * Attach an event listener.
 *
 * If the event was previously fired, will immediately
 * execute the callback with the last data.
 *
 * @param {string} event
 * @param {function} callback
 * @returns {ValueEmitter} self
 */

ValueEmitter.prototype.value = function (event, callback, once) {
  var self = this;
  var params;
  if (this._savedEvents[event]) {
    params = this._savedEvents[event];
    setImmediate(function () {
      callback.apply(self, params);
    });
    if (once) {
      return;
    }
  }
  this[once ? 'once' : 'on'](event, callback);
  return this;
};


/**
 * Attach event listener once.
 */

ValueEmitter.prototype.valueOnce = function (event, callback) {
  return this.value(event, callback, true);
};


/**
 * Clear the current value for given event or all events.
 *
 * @param {string} event If falsy, will clear all event values.
 */

ValueEmitter.prototype.clear = function (event) {
  if (event && this._savedEvents.hasOwnProperty(event)) {
    delete this._savedEvents[event];
  } else {
    this._savedEvents = {};
  }
};
