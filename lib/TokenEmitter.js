var util = require('util');
var Refresh = require('./Refresh');


module.exports = TokenEmitter;

util.inherits(TokenEmitter, Refresh);


/**
 * Fetches access tokens and refreshes it on expiration.
 *
 * @class
 * @augments ValueEmitter
 * @param {object} options Request options
 * @param {string} options.url access_token endpoint URL
 * @param {string} options.type grant type
 * @param {string} options.id client id
 * @param {string} options.secret client secret
 */

function TokenEmitter (options) {
  if (!options || !options.id || !options.secret) {
    throw new Error('TokenEmitter requires "id" and "secret" options');
  }
  Refresh.call(this, {
    method: 'post',
    url: options.url,
    auth: {
      username: options.id,
      password: options.secret
    },
    form: {
      grant_type: options.type || 'client_credentials'
    },
    interval: options.interval || 3600000,
    stopOnFail: true
  });
}


/**
 * @private
 */

TokenEmitter.prototype._predicate = function () {
  return (
    this._options.auth.username &&
    this._options.auth.password
  );
};


/**
 * @private
 */

TokenEmitter.prototype._parse = function (body) {
  try {
    body = JSON.parse(body);
  } catch (e) {
    this.emit('error', e);
    return;
  }
  this._options.interval = (body.expires_in || 3600) * 1000;
  return body;
};
