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

  if (!options.url) {
    throw new Error('Refresh requires the "url" option');
  }

  options.interval = options.interval || 3000;
  options.failStatus = options.failStatus || [/^[^2]/];
  options.predicate = options.predicate || lodash.constant(true);
  options.parse = options.parse || lodash.identity;

  this._options = options;
  this._active = false;
  this._timer = null;
}


/**
 * Overridable
 * @protected
 */

Refresh.prototype._predicate = function () {
  return this._options.predicate.call(this);
};


/**
 * Overridable
 * @protected
 */

Refresh.prototype._parse = function (body) {
  return this._options.parse.call(this, body);
};


/**
 * @private
 */

Refresh.prototype._callback = function (err, resp, body) {
  debug('response', err, resp && resp.statusCode, body && body.length);
  if (resp && !err) {
    if (lodash.any(this._options.failStatus, match(resp))) {
      err = new Error('Refresh: request responded with ' + resp.statusCode);
    }
  }
  if (err) {
    err.response = resp;
    if (this._options.stopOnFail) {
      this.stop();
    }
    this.emit('error', err);
  } else {
    this.emit('response', resp);
    this.emit('data', this._parse(body));
  }
  this._wait();
};


/**
 * @private
 */

Refresh.prototype._wait = function () {
  if (this._active) {
    debug('interval=' + this._options.interval);
    this._timer = setTimeout(
      this.fetch.bind(this), this._options.interval || 1000
    );
  }
};


/**
 * Start fetching the URL.
 */

Refresh.prototype.fetch = function () {
  this._active = true;
  if (this._predicate()) {
    debug('fetching', this._options.url);
    clearTimeout(this._timer);
    this._timer = null;
    Refresh.fetch(this._options, this._callback.bind(this));
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


function match (resp) {
  return function (regexp) {
    return String(resp.statusCode).search(regexp) !== -1;
  };
}
