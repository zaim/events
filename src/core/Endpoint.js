'use strict';

//var qs = require('qs');
var url = require('url');
var debug = require('debug')('remmit:endpoint');
var lodash = require('lodash');
var Request = require('./Request');


/**
 * Does endpoint polling. Set a source AccessToken using
 * `setTokenEmitter` method - the requests will use access
 * tokens emitted by it.
 *
 * @class
 * @augments Request
 */

export default class Endpoint extends Request {

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

    options.uri = options.url = url.parse(options.uri || options.url, true);

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

    this.path = this.options.url.pathname;
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
    this._tokenEmitter = emitter;
    this._tokenEmitter.value('data', this._onTokens, this);
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
    if (data && data.token_type && data.access_token) {
      debug('set tokens', data);
      this.options.headers.authorization =
        data.token_type + ' ' + data.access_token;
      if (this.isPolling()) {
        debug('refetching');
        this.fetch();
      }
    }
  }

}
