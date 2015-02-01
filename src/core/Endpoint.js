'use strict';

import qs from 'querystring';
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

  constructor (options, tokens) {
    if (!options || (!options.uri && !options.url)) {
      throw new Error('Endpoint requires the "url" option');
    }

    var uri = options.uri || options.url;

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

    super(lodash.assign({}, options, { uri: uri, url: uri }));

    lodash.assign(this.options, {
      headers: lodash.assign(this.options.headers || {}, {
        authorization: null
      }),
      method: 'get',
      stopOnFail: true
    });

    Object.defineProperty(this, 'path', {
      configurable: false,
      enumerable: false,
      value: Endpoint.makePath(this.options.uri),
      writable: false
    });

    ['href', 'pathname', 'query'].forEach((key) => {
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: false,
        get () {
          return this.options.uri[key];
        }
      });
    });

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
   * Util function to stringify query string objects.
   *
   * Difference from built-in `querystring` module is
   * that the query keys are sorted before stringify,
   * this allows the qs to be used as a unique key.
   *
   * @static
   * @param {object} query
   * @returns {string}
   */

  static stringifyQuery (query) {
    var keys = Object.keys(query).sort();
    var pairs = keys.map((k) => qs.escape(k) + '=' + qs.escape(query[k]));
    return pairs.join('&');
  }


  /**
   * Util function to make pathname+search key for given URI.
   *
   * @static
   * @param {string|object} uri
   * @param {object} query
   * @returns {string}
   */

  static makePath (uri, query) {
    var qstr = '';
    var qobj = query || {};
    if (!lodash.isObject(uri)) {
      uri = url.parse(uri, true);
    }
    if (!lodash.isEmpty(uri.query)) {
      qobj = lodash.assign({}, uri.query, qobj);
    }
    if (!lodash.isEmpty(qobj)) {
      qstr = '?' + Endpoint.stringifyQuery(qobj);
    }
    return uri.pathname + qstr;
  }

}


export default Endpoint;
