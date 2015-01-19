"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _get = function get(object, property, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    return desc.value;
  } else {
    var getter = desc.get;
    if (getter === undefined) {
      return undefined;
    }
    return getter.call(receiver);
  }
};

var _inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) subClass.__proto__ = superClass;
};

var jiff = require("jiff");
var Emitter = require("eventemitter3");


/**
 * Watches a source event emmiter for `data`
 * events, emits changes to previously
 * emitted data as JSON Patch operations.
 *
 * Uses the `jiff` module for diffing.
 *
 * @class
 * @augments eventemitter3/EventEmitter
 */

var Watcher = (function (Emitter) {
  /**
   * @constructor
   * @param {EventEmitter} source
   * @see {@link https://github.com/cujojs/jiff|jiff module}
   * @see {@link https://tools.ietf.org/html/rfc6902|JSON Patch specs}
   */

  function Watcher(source, options) {
    _get(Object.getPrototypeOf(Watcher.prototype), "constructor", this).call(this);
    this._object = null;
    this._source = source;
    this._watching = false;
    this.start();
  }

  _inherits(Watcher, Emitter);

  _prototypeProperties(Watcher, null, {
    start: {


      /**
       * Re-start a stopped Watcher.
       */

      value: function start() {
        if (!this._watching) {
          this._watching = true;
          this._source.on("data", this._onData, this);
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    stop: {


      /**
       * Stop watching for data events.
       */

      value: function stop() {
        this._watching = false;
        this._source.removeListener(this._onData);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    objectHash: {


      /**
       * The `hashFunction` function passed to
       * the `diff` function. (say 'function'
       * again, I dare you)
       *
       * Defaults to JSON.stringify.
       *
       * @param {object} o
       */

      value: function objectHash(o) {
        // default is to stringify, which is the
        // same as what `diff` defaults to
        return JSON.stringify(o);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _onData: {


      /**
       * @private
       */

      value: function OnData(data) {
        var diff;

        if (!this._object) {
          // first time data is received, clone it
          this._object = jiff.clone(data);
          return;
        }

        if (this._object === data) {
          // we got the same reference to previous
          // data, do nothing
          return;
        }

        diff = jiff.diff(this._object, data, {
          hash: this.objectHash.bind(this)
        });

        this._object = data;

        if (diff && diff.length) {
          this.emit("changed", diff);
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Watcher;
})(Emitter);

module.exports = Watcher;