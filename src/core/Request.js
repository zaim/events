'use strict';

import debug_ from 'debug';
import lodash from 'lodash';
import request from 'request';
import ValueEmitter from './ValueEmitter';
import pkg from '../../package.json';

debug_ = debug_('remmit:request');

var author = (typeof pkg.author === 'object') ? pkg.author.name : pkg.author;

var debug = function (req, m, ...args) {
  var url = '';
  if (req.options.url) {
    url = req.options.url;
    if (typeof req.options.url === 'object') {
      url = req.options.url.href;
    }
  }
  debug_(m, url, ...args);
};


/**
 * Send requests at intervals.
 *
 * @class
 * @augments ValueEmitter
 */

class Request extends ValueEmitter {

  /**
   * @constructor
   * @param {object} options Same options as `request` with additional:
   * @param {number} options.interval
   * @param {array}  options.failStatus
   */

  constructor (options) {
    if (!options) {
      throw new Error('Request requires the "options" argument');
    }

    super();

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

  validate () {
    return true;
  }


  /**
   * Parse the response body. To override in subclass.
   *
   * Default implementation uses JSON.parse.
   *
   * @protected
   * @param {string} body
   * @returns {boolean}
   */

  parse (body) {
    return JSON.parse(body);
  }


  /**
   * Fetch the URL.
   */

  fetch (poll) {
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
      debug(this, 'fetching');
      return Request.go(this.options, this._callback.bind(this));
    }

    return false;
  }


  /**
   * Start polling the URL.
   */

  poll (interval) {
    if (typeof interval !== 'undefined') {
      this.options.interval = interval;
    }
    this.fetch(true);
    return this;
  }


  /**
   * Stop polling the URL.
   */

  stop () {
    debug(this, 'stopping poll');
    this._clear();
    this._poll = false;
  }


  /**
   * Returns true if in poll mode
   */

  isPolling () {
    return this._poll;
  }


  /**
   * @private
   */

  _clear () {
    if (this._timer) {
      debug(this, 'clearing timer');
      clearTimeout(this._timer);
      this._timer = null;
    }
  }


  /**
   * @private
   */

  _predicate () {
    debug(this, 'predicate: url');
    if (!this.options.url) {
      throw new Error('Request requires the "url" option');
    }
    return true;
  }


  /**
   * @private
   */

  _callback (err, resp, body) {
    debug(this, 'response', err, resp && resp.statusCode, body && body.length);

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
      debug(this, 'interval', this.options.interval);
      this._timer = setTimeout(this.fetch.bind(this), this.options.interval);
    }
  }


  /**
   * @private
   */

  _error (err) {
    if (this.options.stopOnFail) {
      this.stop();
    }
  }

}


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


function match (code) {
  return function (regexp) {
    return String(code).search(regexp) !== -1;
  };
}


export default Request;
