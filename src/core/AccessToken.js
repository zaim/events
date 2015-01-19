'use strict';

var util = require('util');
var Request = require('./Request');


module.exports = AccessToken;

util.inherits(AccessToken, Request);


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

function AccessToken (options) {
  if (!options || !options.id || !options.secret) {
    throw new Error('AccessToken requires "id" and "secret" options');
  }
  Request.call(this, {
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
 * @protected
 */

AccessToken.prototype.validate = function () {
  return (
    this.options.auth.username &&
    this.options.auth.password
  );
};


/**
 * @protected
 */

AccessToken.prototype.parse = function (body) {
  body = JSON.parse(body);
  this.options.interval = (body.expires_in || 3600) * 1000;
  return body;
};
