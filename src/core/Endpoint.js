'use strict';

import url from 'url';
import debug from 'debug';
import lodash from 'lodash';
import Request from './Request';

debug = debug('remmit:endpoint');


/**
 * Does endpoint polling. Set a source AccessToken using
 * `setTokenEmitter` method - the requests will use access
 * tokens emitted by it.
 *
 * @class
 * @augments Request
 */

class Endpoint extends Request {

  /**
   * @constructor
   * @param {object} options
   * @param {string} options.url The endpoint URL (required)
   * @param {AccessToken} tokens
   */

  constructor (options, tokens, engine) {
    if (!options || (!options.uri && !options.url)) {
      throw new Error('Endpoint requires the "url" option');
    }

    var uri = options.uri || options.url;
    var key = options.key;

    if (!lodash.isObject(uri)) {
      uri = url.parse(uri, true);
    }

    // merge both queries in the uri string and options object
    if (options.qs) {
      uri.query = lodash.merge(uri.query || {}, options.qs);
    }

    // if there is a qs, re-stringify uri to sort by keys
    if (!lodash.isEmpty(uri.query)) {
      uri.search = '?' + Endpoint.stringifyQuery(uri.query);
      uri.path = uri.pathname + uri.search;
      uri.href = url.format(uri);
    }

    super(lodash.assign({}, options, { uri:uri, url:uri, key:undefined }));

    lodash.assign(this.options, {
      headers: lodash.assign(this.options.headers || {}, {
        authorization: null
      }),
      method: 'get',
      stopOnError: false
    });

    ['href', 'path', 'pathname', 'query'].forEach((key) => {
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: false,
        get () {
          return this.options.uri[key];
        }
      });
    });

    if (key) {
      Object.defineProperty(this, 'key', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: key
      });
    }

    if (engine) {
      Object.defineProperty(this, 'engine', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: engine
      });
    }

    if (tokens) {
      this.setTokenEmitter(tokens);
    }
  }


  /**
   * @protected
   */

  validate () {
    debug('check options', this.options.headers);
    return !!this.options.headers.authorization;
  }


  /**
   * Set the AccessToken source.
   *
   * @param   {AccessToken} emitter
   * @listens AccessToken#data
   * @returns {Endpoint} self
   */

  setTokenEmitter (emitter) {
    if (this._tokenEmitter) {
      this._tokenEmitter.removeListener('data', this._onTokens);
    }
    emitter.value('data', this._onTokens, this);
    var current = emitter.getValue('data');
    if (current) {
      this._onTokens.apply(this, current);
    }
    this._tokenEmitter = emitter;
    return this;
  }


  /**
   * Update Endpoint query string.
   *
   * The next call to fetch() will use this new query string.
   *
   * @param {object} qs
   * @returns {Endpoint} self
   */

  query (qs) {
    this.options.qs = qs;
    return this;
  }


  /**
   * @private
   */

  _onTokens (data) {
    var newAuth;
    var currentAuth = this.options.headers.authorization;

    if (data && data.token_type && data.access_token) {
      debug('set tokens', data);
      newAuth = data.token_type + ' ' + data.access_token;
      this.options.headers.authorization = newAuth;
      if (newAuth !== currentAuth && this.isPolling()) {
        debug('refetching');
        this.fetch();
      }
    }
  }


  /**
   * @protected
   */

  parse (...args) {
    if (this._defaultInterval) {
      this.options.interval = this._defaultInterval;
      debug('reset poll', this.options.interval);
    }
    return super.parse(...args);
  }


  /**
   * @protected
   */

  _onError (err) {
    if (err.response && err.response.statusCode >= 500) {
      debug('error');
      var i = this.options.interval;
      var t = this.options.throttle || 0.1;
      if (i > 0) {
        this._defaultInterval = this._defaultInterval || i;
        this.options.interval = i + (i * t);
        debug('throttled poll', this.options.interval);
      }
    }
  }

}


export default Endpoint;
