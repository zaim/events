'use strict';

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
    var self = this;

    if (!options || !options.url) {
      throw new Error('Endpoint requires the "url" option');
    }

    options.url = url.parse(options.url);
    super(options);

    this.options.headers = this.options.headers || {};

    lodash.assign(this.options.headers, {
      authorization: null
    });

    lodash.assign(this.options, {
      method: 'get',
      stopOnFail: true
    });

    this._onTokens = function (data) {
      if (data && data.token_type && data.access_token) {
        debug('set tokens', data);
        self.options.headers.authorization =
          data.token_type + ' ' + data.access_token;
        if (self.isPolling()) {
          debug('refetching');
          self.fetch();
        }
      }
    };

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
    this._tokenEmitter.value('data', this._onTokens);
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

}
