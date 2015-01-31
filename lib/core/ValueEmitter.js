"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var Emitter = _interopRequire(require("eventemitter3"));




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

var ValueEmitter = (function (Emitter) {
  function ValueEmitter() {
    _get(Object.getPrototypeOf(ValueEmitter.prototype), "constructor", this).call(this);
    this._savedEvents = {};
  }

  _inherits(ValueEmitter, Emitter);

  _prototypeProperties(ValueEmitter, null, {
    emit: {


      /**
       * @override
       */

      value: function emit() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var event = args[0];
        var params = args.slice(1);
        this._savedEvents[event] = params;
        return _get(Object.getPrototypeOf(ValueEmitter.prototype), "emit", this).apply(this, args);
      },
      writable: true,
      configurable: true
    },
    value: {


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

      value: function value(event, callback, context, once) {
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
        this[once ? "once" : "on"](event, callback, context);
        return this;
      },
      writable: true,
      configurable: true
    },
    valueOnce: {


      /**
       * Attach event listener once.
       */

      value: function valueOnce(event, callback, context) {
        return this.value(event, callback, context, true);
      },
      writable: true,
      configurable: true
    },
    clear: {


      /**
       * Clear the current value for given event or all events.
       *
       * @param {string} event If falsy, will clear all event values.
       */

      value: function clear(event) {
        if (event && this._savedEvents.hasOwnProperty(event)) {
          delete this._savedEvents[event];
        } else {
          this._savedEvents = {};
        }
      },
      writable: true,
      configurable: true
    },
    getValue: {


      /**
       * Get the current value
       *
       * @param {string} event
       * @returns {array}
       */

      value: function getValue(event) {
        return this._savedEvents[event];
      },
      writable: true,
      configurable: true
    }
  });

  return ValueEmitter;
})(Emitter);

module.exports = ValueEmitter;