'use strict';

var lodash = require('lodash');
var qs = require('querystring');
var Emitter = require('eventemitter3');
var Token = require('./AccessToken');
var Endpoint = require('./Endpoint');


/**
 * API engine
 *
 * @class
 * @augments eventemitter3/EventEmitter
 */

class Engine extends Emitter {

  /**
   * @constructor
   * @param {object} config
   * @param {string} config.clientID
   * @param {string} config.clientSecret
   * @param {string} config.grantType
   */

  constructor (config) {
    super();
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

  start () {
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

    if (!this.tokens.isPolling()) {
      this.tokens.poll();
    }

    return this;
  }


  /**
   * Get an endpoint request object.
   *
   * @param {string} path
   * @param {object} query
   * @returns {Endpoint}
   */

  endpoint (path, query) {
    if (!this.tokens) {
      throw new Error('Engine: call .start() before accessing endpoints');
    }

    var Class, endpoint, key;

    path = Engine.fixPath(path);
    key = path + (query ? '?' + Engine.queryKey(query) : '');

    if (!this._endpoints.hasOwnProperty(key)) {
      Class = this._findSubclass(path);
      endpoint = this._endpoints[key] = new Class({
        url: 'https://oauth.reddit.com' + path,
        qs: query
      }, this.tokens);
      endpoint
        .on('error', this.emit.bind(this, 'error'))
        .on('response', this.emit.bind(this, 'response'))
        .on('data', this.emit.bind(this, 'data'));
    } else {
      endpoint = this._endpoints[key];
    }

    return endpoint;
  }


  /**
   * Stop all polling
   */

  stop () {
    var self = this;
    if (this.tokens) {
      this.tokens.stop();
    }
    Object.keys(this._endpoints).forEach(function (key) {
      self._endpoints[key].stop();
    });
  }


  /**
   * Register an Endpoint subclass
   *
   * @param {RegExp} uriRegex
   * @param {Function} cls
   * @returns {Engine} self
   */

  register (uriRegex, cls) {
    this._subclasses.push([uriRegex, cls]);
    return this;
  }


  /**
   * Check if the path is a registered custom endpoint.
   *
   * @param {string} path
   * @returns {boolean}
   */

  isRegistered (path) {
    path = Engine.fixPath(path);
    return Endpoint !== this._findSubclass(path);
  }


  /**
   * Check if the path is an activated endpoint.
   *
   * @param {string} path
   * @returns {boolean}
   */

  isActive (path) {
    path = Engine.fixPath(path);
    return this._endpoints.hasOwnProperty(path);
  }


  /**
   * Check if the path is an endpoint that is actively polling.
   *
   * @param {string} path
   * @returns {boolean}
   */

  isPolling (path) {
    path = Engine.fixPath(path);
    return (
      this._endpoints.hasOwnProperty(path) &&
      this._endpoints[path].isPolling()
    );
  }


  /**
   * Get activate endpoints.
   *
   * @returns {object} A hash of uri -> Endpoint objects
   */

  getActiveEndpoints () {
    return lodash.clone(this._endpoints);
  }


  /**
   * @private
   */

  _findSubclass (path) {
    var finder, recls;

    finder = function __finder (recls) {
      return recls[0].test(path);
    };

    // find in instance registry first
    recls = lodash(this._subclasses).find(finder);

    if (!recls) {
      // next, find in global registry
      recls = lodash(Engine._endpointClasses).find(finder);
    }

    return recls ? recls[1] : Endpoint;
  }

}


/**
 * Global custom Endpoint subclass registry.
 *
 * @protected
 */

Engine._endpointClasses = [];


/**
 * Register a global custom Endpoint class.
 *
 * When creating endpoints with the
 * Engine#endpoint() method, if the endpoint
 * URI matches `uriRegex`, we will use `Class`
 * instead of `Endpoint` as constructor.
 *
 * Individual Engine instances can also
 * register custom subclasses with the
 * Engine#register() method.
 *
 * @param {RegExp} uriRegex
 * @param {Function} Class
 */

Engine.register = function (uriRegex, cls) {
  Engine._endpointClasses.push([uriRegex, cls]);
  return Engine;
};


/**
 * Util function to fix API paths.
 */

Engine.fixPath = function (path) {
  path = path.replace(/\/+$/, '');
  path = path[0] === '/' ? path : '/' + path;
  path = path.search(/\.json$/) > 0 ? path : path + '.json';
  return path;
};


/**
 * Util function to stringify query string objects.
 */

Engine.queryKey = function (query) {
  var keys = Object.keys(query).sort();
  var pairs = keys.map((k) => qs.escape(k) + '=' + qs.escape(query[k]));
  return pairs.join('&');
};


export default Engine;
