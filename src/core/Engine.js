'use strict';

import url from 'url';
import debug from 'debug';
import lodash from 'lodash';
import Emitter from 'eventemitter3';
import Token from './AccessToken';
import Endpoint from './Endpoint';

debug = debug('remmit:engine');

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
   * Get an endpoint request object,
   * if it is not yet activated,
   * activate it.
   *
   * No polling or fetching is done.
   *
   * @param {object|string} options
   * @param {object} query
   * @returns {Endpoint}
   */

  endpoint (options, query) {
    options = this._parseOptions(options, query);

    var {Class, path, key} = options;
    var endpoint = this._endpoints[key];

    if (!endpoint) {
      debug('activate endpoint', key, options);
      options.url = 'https://oauth.reddit.com' + path;
      options.Class = undefined;
      options.path = undefined;
      endpoint = this._endpoints[key] = (new Class(options, this.tokens, this))
        .on('error', (v) => this.emit('error', v, endpoint))
        .on('response', (v) => this.emit('response', v, endpoint))
        .on('data', (v) => this.emit('data', v, endpoint))
        .on('changed', (v) => this.emit('changed', v, endpoint));
    }

    return endpoint;
  }


  /**
   * Get an endpoint request object,
   * if it is not yet activated,
   * returns `undefined`.
   *
   * @param {object|string} options
   * @param {object} query
   * @returns {Endpoint|undefined}
   */

  get (options, query) {
    options = this._parseOptions(options, query);
    return this._endpoints[options.key];
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
      this.tokens.valueOnce('data', () => ep.fetch());
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
   * @param {object|string} path
   * @param {object} query
   * @returns {boolean}
   */

  isActive (options, query) {
    return !!this.get(options, query);
  }


  /**
   * Check if the path is an endpoint that is actively polling.
   *
   * @param {string} path
   * @param {object} query
   * @returns {boolean}
   */

  isPolling (path, query) {
    var ep = this.get(path, query);
    return ep && ep.isPolling();
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
    return [].concat(this._subclasses);
  }


  /**
   * Parse and normalize an endpoint options object.
   *
   * @private
   * @param {object|string} options
   * @param {object} query
   * @returns {EndpointOptions}
   */

  _parseOptions (options, query) {
    if (!this.tokens) {
      throw new Error('Engine: call .start() before accessing endpoints');
    }

    if (lodash.isString(options)) {
      options = { path: options };
    } else {
      options = lodash.cloneDeep(options);
    }

    options.qs = options.query = options.query || query;
    options.path = Engine.fixPath(options.path);

    if (this.config.registeredOnly && !this.isRegistered(options.path)) {
      throw new Error('No endpoint registered for path: ' + options.path);
    }

    var Class = this._findSubclass(options.path);
    var norm = Class.normalizePath || lodash.identity;

    options.Class = Class;
    options.path = norm(options.path);
    options.key = Engine.pathKey(options.path, options.query);

    return options;
  }


  /**
   * @private
   */

  _findSubclass (path) {
    var result = lodash(this._subclasses).find((rc) => rc[0].test(path));
    return result ? result[1] : Endpoint;
  }


  /**
   * Util function to normalize API paths.
   *
   * Make sure it starts with a slash, and ends with .json;
   * doesn't mangle query strings.
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


  /**
   * Util function to make pathname+search key for given URI.
   *
   * @static
   * @param {string|object} uri
   * @param {object} query
   * @returns {string}
   */

  static pathKey (uri, query) {
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


export default Engine;
