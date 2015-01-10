var util = require('util');
var debug = require('debug')('res:refresh');
var lodash = require('lodash');
var request = require('request');
var ValueEmitter = require('./ValueEmitter');
var pkg = require('../package.json');


module.exports = Refresh;

util.inherits(Refresh, ValueEmitter);


/**
 * Create `request` function with default headers:
 *
 *     user-agent: '<pkg.name>/<pkg.version> by <pkg.author>'
 *
 * @returns {function}
 */

Refresh.fetch = request.defaults({
  headers: {
    'user-agent': pkg.name + '/' + pkg.version + ' by ' + pkg.author
  }
});


/**
 * Send requests at intervals.
 *
 * @class
 * @augments ValueEmitter
 * @param {object} options Same options as `request` with additional:
 * @param {number} options.interval
 * @param {array}  options.failStatus
 */

function Refresh (options) {
  ValueEmitter.call(this);

  if (!options) {
    throw new Error('Refresh requires the "options" argument');
  }

  options = lodash.cloneDeep(options);
  options.interval = options.interval || 3000;
  options.failStatus = options.failStatus || [/^[^2]/];

  this.options = options;
  this._active = false;
  this._timer = null;
  this._predicate();
}


/**
 * Validate current options object. To override in subclass.
 *
 * Default implementation always return true.
 *
 * @protected
 * @returns {boolean}
 */

Refresh.prototype.validate = function () {
  return true;
};


/**
 * Parse the response body. To override in subclass.
 *
 * Default implementation uses JSON.parse.
 *
 * @protected
 * @param {string} body
 * @returns {boolean}
 */

Refresh.prototype.parse = function (body) {
  return JSON.parse(body);
};


/**
 * Start fetching the URL.
 */

Refresh.prototype.fetch = function () {
  this._active = true;
  try {
    // don't throw errors here, instead
    // emit them as events because
    // `fetch` might be called async-ly
    this._predicate();
  } catch (e) {
    this.emit('error', e);
    return;
  }
  if (this.validate()) {
    debug('fetching', this.options.url);
    clearTimeout(this._timer);
    this._timer = null;
    Refresh.fetch(this.options, this._callback.bind(this));
  }
};


/**
 * Stop fetching the URL.
 */

Refresh.prototype.stop = function () {
  clearTimeout(this._timer);
  this._active = false;
  this._timer = null;
};


/**
 * @private
 */

Refresh.prototype._predicate = function () {
  if (!this.options.url) {
    throw new Error('Refresh requires the "url" option');
  }
  return true;
};


/**
 * @private
 */

Refresh.prototype._callback = function (err, resp, body) {
  debug('response', err, resp && resp.statusCode, body && body.length);
  if (resp) {
    // always emit response, even on error
    this.emit('response', resp);
    // check for non-200 errors
    if (!err && lodash.any(this.options.failStatus, match(resp))) {
      err = new Error('Refresh: request responded with ' + resp.statusCode);
    }
  }
  if (!err) {
    // parse body, catching any parse errors
    try {
      body = this.parse(body);
    } catch (e) {
      err = e;
    }
  }
  if (err) {
    // attach response to error object
    // stop timer if stopOnFail=true
    err.response = resp;
    if (this.options.stopOnFail) {
      this.stop();
    }
    // emit error *after* stopping timer
    this.emit('error', err);
  } else {
    // everything ok? emit parsed body
    this.emit('data', body);
  }
  // re-set the timeout
  this._wait();
};


/**
 * @private
 */

Refresh.prototype._wait = function () {
  if (this._active) {
    debug('interval=' + this.options.interval);
    this._timer = setTimeout(
      this.fetch.bind(this), this.options.interval || 1000
    );
  }
};


function match (resp) {
  return function (regexp) {
    return String(resp.statusCode).search(regexp) !== -1;
  };
}
