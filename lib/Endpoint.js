var util = require('util');
var debug = require('debug')('res:endpoint');
var lodash = require('lodash');
var Refresh = require('./Refresh');


module.exports = Endpoint;

util.inherits(Endpoint, Refresh);


/**
 * Does endpoint polling. Set a source TokenEmitter using
 * `setTokenEmitter` method - the requests will use access
 * tokens emitted by it.
 *
 * @class
 * @augments Refresh
 * @param {object} options
 * @param {string} options.url The endpoint URL (required)
 */

function Endpoint (options) {
  var self = this;

  Refresh.call(this, options);

  this._options.headers = this._options.headers || {};

  lodash.assign(this._options.headers, {
    authorization: null
  });

  lodash.assign(this._options, {
    method: 'get',
    stopOnFail: true
  });

  this._onTokens = function (data) {
    if (data && data.token_type && data.access_token) {
      debug('set tokens', data);
      self._options.headers.authorization =
        data.token_type + ' ' + data.access_token;
      if (self._active) {
        self.fetch();
      }
    }
  };
}


/**
 * @private
 */

Endpoint.prototype._predicate = function () {
  debug('check options', this._options.headers);
  return !!this._options.headers.authorization;
};


/**
 * @private
 */

Endpoint.prototype._parse = function (body) {
  try {
    body = JSON.parse(body);
  } catch (e) {
    this.emit('error', e);
    return;
  }
  return body;
};


/**
 * Set the TokenEmitter source.
 *
 * @param   {TokenEmitter} emitter
 * @listens TokenEmitter#data
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
