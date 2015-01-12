var util = require('util');
var lodash = require('lodash');
var Emitter = require('eventemitter3');
var Token = require('./AccessToken');
var Endpoint = require('./Endpoint');


module.exports = Engine;

util.inherits(Engine, Emitter);


/**
 * API engine
 *
 * @param {object} config
 * @param {string} config.clientID
 * @param {string} config.clientSecret
 * @param {string} config.grantType
 */

function Engine (config) {
  this.config = config;
  this.tokens = null;
  this._endpoints = {};
  this._subclasses = [];
}


/**
 * Start the API engine (fetches access tokens).
 *
 * @returns {Engine} self
 */

Engine.prototype.start = function () {
  if (!this.tokens) {
    if (!this.config.clientID) {
      throw new Error('Engine requires the "clientID" config');
    }
    if (!this.config.clientSecret) {
      throw new Error('Engine requires the "clientSecret" config');
    }

    this.tokens = new Token({
      url: 'https://www.reddit.com/api/v1/access_token',
      id: this.config.clientID,
      secret: this.config.clientSecret,
      type: this.config.grantType
    });
    this.tokens
      .on('error', this.emit.bind(this, 'error'))
      .on('data', this.emit.bind(this, 'token'));
  }

  this.tokens.poll();

  return this;
};


/**
 * Get an endpoint request object.
 *
 * @param {string} path
 * @returns {Endpoint}
 */

Engine.prototype.endpoint = function (path) {
  if (!this.tokens) {
    throw new Error('Engine: call .start() before accessing endpoints');
  }

  var Class, endpoint;

  path = path.replace(/\/+$/, '');
  path = path[0] === '/' ? path : '/' + path;
  path = path.search(/\.json$/) > 0 ? path : path + '.json';

  if (!this._endpoints.hasOwnProperty(path)) {
    Class = this._findSubclass(path);
    endpoint = this._endpoints[path] = new Class({
      url: 'https://oauth.reddit.com' + path
    }, this.tokens);
    endpoint
      .on('error', this.emit.bind(this, 'error'))
      .on('response', this.emit.bind(this, 'response'))
      .on('data', this.emit.bind(this, 'data'));
  } else {
    endpoint = this._endpoints[path];
  }

  return endpoint;
};


/**
 * Stop all polling
 */

Engine.prototype.stop = function () {
  var self = this;
  this.tokens.stop();
  Object.keys(this._endpoints).forEach(function (key) {
    self._endpoints[key].stop();
  });
};


/**
 * Register an Endpoint subclass
 *
 * @param {Array|RegExp} uriRegex
 * @param {Function} cls
 * @returns {Engine} self
 */

Engine.prototype.register = function (uriRegex, cls) {
  if (!Array.isArray(uriRegex)) {
    uriRegex = [uriRegex];
  }
  var self = this;
  uriRegex.forEach(function (re) {
    self._subclasses.push([re, cls]);
  });
  return this;
};


/**
 * @private
 */

Engine.prototype._findSubclass = function (path) {
  var recls = lodash(this._subclasses).find(function (re) {
    return re[0].test(path);
  });
  return recls ? recls[1] : Endpoint;
};
