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
    var q;

    if (options.qs) {
      q = Endpoint.stringifyQuery(options.qs);
      if (/\?/.test(uri)) {
        uri = uri.replace(/&+$/, '') + '&' + q;
      } else {
        uri = uri + '?' + q;
      }
    }

    uri = url.parse(uri, true);
    options = lodash.assign({}, options, { uri: uri, url: uri });

    super(options);

    this.options.headers = this.options.headers || {};

    lodash.assign(this.options.headers, {
      authorization: null
    });

    lodash.assign(this.options, {
      method: 'get',
      stopOnFail: true
    });

    if (tokens) {
      this.setTokenEmitter(tokens);
    }

    this.path = Endpoint.makePath(this.options.uri);
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
