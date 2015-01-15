var util = require('util');
var debug = require('debug')('reddit-emit:request');
var lodash = require('lodash');
var request = require('request');
var ValueEmitter = require('./ValueEmitter');
var pkg = require('../../package.json');

var author = (typeof pkg.author === 'object') ? pkg.author.name : pkg.author;


module.exports = Request;

util.inherits(Request, ValueEmitter);


/**
 * Create `request` function with default headers:
 *
 *     user-agent: '<pkg.name>/<pkg.version> by <pkg.author>'
 *
 * @returns {function}
 */

Request.go = request.defaults({
  headers: {
    'user-agent': pkg.name + '/' + pkg.version + ' by ' + author
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

function Request (options) {
  ValueEmitter.call(this);

  if (!options) {
    throw new Error('Request requires the "options" argument');
  }

  options = lodash.cloneDeep(options);
  options.interval = options.interval || 0;
  options.failStatus = options.failStatus || [/^[^2]/];

  this.on('error', this._error);

  this.options = options;
  this._poll = false;
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

Request.prototype.validate = function () {
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

Request.prototype.parse = function (body) {
  return JSON.parse(body);
};


/**
 * Fetch the URL.
 */

Request.prototype.fetch = function (poll) {
  // enable/disable polling if `poll` arg given
  if (typeof poll !== 'undefined') {
    this._poll = poll;
  }

  try {
    // don't throw errors here, instead
    // emit them as events because
    // `fetch` might be called async-ly
    this._predicate();
  } catch (e) {
    this.emit('error', e);
    return false;
  }

  if (this.validate()) {
    // always clear timer before sending request
    // in case `fetch` is called while we are
    // already waiting on a timeout (TODO test)
    this._clear();
    debug('fetching', this.options.url);
    return Request.go(this.options, this._callback.bind(this));
  }

  return false;
};


/**
 * Start polling the URL.
 */

Request.prototype.poll = function (interval) {
  if (typeof interval !== 'undefined') {
    this.options.interval = interval;
  }
  this.fetch(true);
  return this;
};


/**
 * Stop polling the URL.
 */

Request.prototype.stop = function () {
  debug('stopping poll');
  this._clear();
  this._poll = false;
};


/**
 * Returns true if in poll mode
 */

Request.prototype.isActive = function () {
  return this._poll;
};


/**
 * @private
 */

Request.prototype._clear = function () {
  if (this._timer) {
    debug('clearing timer');
    clearTimeout(this._timer);
    this._timer = null;
  }
};


/**
 * @private
 */

Request.prototype._predicate = function () {
  debug('predicate: url', this.options.url);
  if (!this.options.url) {
    throw new Error('Request requires the "url" option');
  }
  return true;
};


/**
 * @private
 */

Request.prototype._callback = function (err, resp, body) {
  debug('response', err, resp && resp.statusCode, body && body.length);

  if (resp) {
    // always emit response, even on error
    this.emit('response', resp);
    // check for non-200 errors
    if (!err && lodash.any(this.options.failStatus, match(resp.statusCode))) {
      err = new Error('Request: request responded with ' + resp.statusCode);
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
    err.response = resp;
    // emit error *after* stopping timer
    this.emit('error', err);
  } else {
    // everything ok? emit parsed body
    this.emit('data', body);
  }

  // only setTimeout if in 'poll' mode and interval > 0
  if (this._poll && this.options.interval) {
    debug('interval', this.options.interval);
    this._timer = setTimeout(this.fetch.bind(this), this.options.interval);
  }
};


/**
 * @private
 */

Request.prototype._error = function (err) {
  if (this.options.stopOnFail) {
    this.stop();
  }
};


function match (code) {
  return function (regexp) {
    return String(code).search(regexp) !== -1;
  };
}
