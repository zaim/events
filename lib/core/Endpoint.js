var util = require('util');
var debug = require('debug')('reddit-emit:endpoint');
var lodash = require('lodash');
var Request = require('./Request');


module.exports = Endpoint;

util.inherits(Endpoint, Request);


/**
 * Does endpoint polling. Set a source AccessToken using
 * `setTokenEmitter` method - the requests will use access
 * tokens emitted by it.
 *
 * @class
 * @augments Request
 * @param {object} options
 * @param {string} options.url The endpoint URL (required)
 * @param {AccessToken} tokens
 */

function Endpoint (options, tokens) {
  var self = this;

  Request.call(this, options);

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
}


/**
 * @protected
 */

Endpoint.prototype.validate = function () {
  debug('check options', this.options.headers);
  return !!this.options.headers.authorization;
};


/**
 * Set the AccessToken source.
 *
 * @param   {AccessToken} emitter
 * @listens AccessToken#data
 * @returns {Endpoint} self
 */

Endpoint.prototype.setTokenEmitter = function (emitter) {
  if (this._tokenEmitter) {
    this._tokenEmitter.removeListener('data', this._onTokens);
  }
  this._tokenEmitter = emitter;
  this._tokenEmitter.value('data', this._onTokens);
  return this;
};


/**
 * Update Endpoint query string.
 *
 * The next call to fetch() will use this new query string.
 *
 * @param {object} qs
 * @returns {Endpoint} self
 */

Endpoint.prototype.query = function (qs) {
  this.options.qs = qs;
  return this;
};
