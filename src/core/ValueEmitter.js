'use strict';

var Emitter = require('eventemitter3');


/**
 * An EventEmitter that saves the last data of events.
 *
 * Use the `value` method to attach an event listener,
 * if the listened event was previously fired, will
 * immediately execute the callback with the last data.
 *
 * @class
 * @augments eventemitter3/EventEmitter
 */

export default class ValueEmitter extends Emitter {

  constructor () {
    super();
    this._savedEvents = {};
  }


  /**
   * @override
   */

  emit (...args) {
    var event = args[0];
    var params = args.slice(1);
    this._savedEvents[event] = params;
    return super.emit(...args);
  }


  /**
   * Attach an event listener.
   *
   * If the event was previously fired, will immediately
   * execute the callback with the last data.
   *
   * @param {string} event
   * @param {function} callback
   * @param {*} context
   * @returns {ValueEmitter} self
   */

  value (event, callback, context, once) {
    context = context || this;
    var params;
    if (this._savedEvents[event]) {
      params = this._savedEvents[event];
      setImmediate(function () {
        callback.apply(context, params);
      });
      if (once) {
        return this;
      }
    }
    this[once ? 'once' : 'on'](event, callback, context);
    return this;
  }


  /**
   * Attach event listener once.
   */

  valueOnce (event, callback, context) {
    return this.value(event, callback, context, true);
  }


  /**
   * Clear the current value for given event or all events.
   *
   * @param {string} event If falsy, will clear all event values.
   */

  clear (event) {
    if (event && this._savedEvents.hasOwnProperty(event)) {
      delete this._savedEvents[event];
    } else {
      this._savedEvents = {};
    }
  }

}
