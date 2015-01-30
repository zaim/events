'use strict';

import lodash from 'lodash';
import Emitter from 'eventemitter3';
import Token from './AccessToken';
import Endpoint from './Endpoint';


/*
 * Global custom Endpoint subclass registry.
 */

var endpointClasses = [];

var DEFAULT_INTERVAL = 3000;



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
   * No polling or fetching is done.
   *
   * @param {string} path
   * @param {object} query
   * @returns {Endpoint}
   */

  endpoint (path, query) {
    if (!this.tokens) {
      throw new Error('Engine: call .start() before accessing endpoints');
    }

    var Class, key, endpoint, opts;

    path = Engine.fixPath(path);
    key = Endpoint.makePath(path, query);
    endpoint = this._endpoints[key];
    opts = { url: 'https://oauth.reddit.com' + path, qs: query };

    if (!endpoint) {
      Class = this._findSubclass(path);
      endpoint = this._endpoints[key] = (new Class(opts, this.tokens))
        .on('error', (v) => this.emit('error', v, endpoint))
        .on('response', (v) => this.emit('response', v, endpoint))
        .on('data', (v) => this.emit('data', v, endpoint))
        .on('changed', (v) => this.emit('changed', v, endpoint));
    }

    return endpoint;
  }


  /**
   * Fetch data from an endpoint.
   *
   * Polling is not automatically started.
   *
   * @param {string} path
   * @param {object} query
   * @param {function} callback
   * @returns {Endpoint}
   */

  fetch (path, query, callback) {
    var ep = this.endpoint(path, query).valueOnce('data', callback);
    if (!ep.fetch()) {
      // wait for access tokens
      this.tokens.once('data', () => ep.fetch());
    }
    return ep;
  }


  /**
   * Fetch and start polling an endpoint.
   *
   * @param {string} path
   * @param {object} query
   * @param {function} callback
   * @returns {Endpoint}
   */

  poll (path, query, callback) {
    var ep = this.endpoint(path, query).valueOnce('data', callback);
    var ms = this.config.interval > 0 ? this.config.interval : DEFAULT_INTERVAL;
    ep.poll(ms);
    return ep;
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
   * @param {object} query
   * @returns {boolean}
   */

  isActive (path, query) {
    var key = Endpoint.makePath(path, query);
    return this._endpoints.hasOwnProperty(key);
  }


  /**
   * Check if the path is an endpoint that is actively polling.
   *
   * @param {string} path
   * @param {object} query
   * @returns {boolean}
   */

  isPolling (path, query) {
    var key = Endpoint.makePath(path, query);
    return (
      this._endpoints.hasOwnProperty(key) &&
      this._endpoints[key].isPolling()
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
   * Get registered endpoint regexp and classes.
   *
   * @returns {object} An array of [RegExp, Endpoint] pairs
   */

  getRegisteredEndpoints () {
    // instance registry first, to match finding order, below
    return this._subclasses.concat(endpointClasses);
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
      recls = lodash(endpointClasses).find(finder);
    }

    return recls ? recls[1] : Endpoint;
  }


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
   * @static
   * @param {RegExp} uriRegex
   * @param {Function} Class
   */

  static register (uriRegex, cls) {
    endpointClasses.push([uriRegex, cls]);
    return Engine;
  }


  /**
   * Util function to fix API paths.
   *
   * @static
   * @param {string} path
   * @returns string
   */

  static fixPath (path) {
    var qs = '';
    if (/\?/.test(path)) {
      [path, qs] = path.split('?');
      qs = '?' + qs;
    }
    path = path.replace(/\/+$/, '');
    path = path[0] === '/' ? path : '/' + path;
    path = /\.json$/.test(path) ? path : path + '.json';
    return path + qs;
  }

}


export default Engine;
