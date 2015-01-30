'use strict';

import jiff from 'jiff';
import Emitter from 'eventemitter3';


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

export default class Watcher extends Emitter {

  /**
   * @constructor
   * @param {EventEmitter} source
   * @see {@link https://github.com/cujojs/jiff|jiff module}
   * @see {@link https://tools.ietf.org/html/rfc6902|JSON Patch specs}
   */

  constructor (source, options) {
    super();
    this._object = null;
    this._source = source;
    this._watching = false;
    this.start();
  }


  /**
   * Re-start a stopped Watcher.
   */

  start () {
    if (!this._watching) {
      this._watching = true;
      this._source.on('data', this._onData, this);
    }
  }


  /**
   * Stop watching for data events.
   */

  stop () {
    this._watching = false;
    this._source.removeListener(this._onData);
  }


  /**
   * The `hashFunction` function passed to
   * the `diff` function. (say 'function'
   * again, I dare you)
   *
   * Defaults to JSON.stringify.
   *
   * @param {object} o
   */

  objectHash (o) {
    // default is to stringify, which is the
    // same as what `diff` defaults to
    return JSON.stringify(o);
  }


  /**
   * @private
   */

  _onData (data) {
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
      this.emit('changed', diff);
    }
  }

}
