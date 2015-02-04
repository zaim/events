"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var url = _interopRequire(require("url"));

var debug = _interopRequire(require("debug"));

var lodash = _interopRequire(require("lodash"));

var Emitter = _interopRequire(require("eventemitter3"));

var Token = _interopRequire(require("./AccessToken"));

var Endpoint = _interopRequire(require("./Endpoint"));

debug = debug("remmit:engine");

var DEFAULT_INTERVAL = 3000;



/**
 * API engine
 *
 * @class
 * @augments eventemitter3/EventEmitter
 */

var Engine = (function (Emitter) {
  /**
   * @constructor
   * @param {object} config
   * @param {string} config.clientID
   * @param {string} config.clientSecret
   * @param {string} config.grantType
   */

  function Engine(config) {
    _get(Object.getPrototypeOf(Engine.prototype), "constructor", this).call(this);
    this.config = config;
    this.tokens = null;
    this._endpoints = {};
    this._subclasses = [];
  }

  _inherits(Engine, Emitter);

  _prototypeProperties(Engine, {
    fixPath: {


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

      value: function fixPath(path) {
        var qs = "";
        if (/\?/.test(path)) {
          var _ref = path.split("?");

          var _ref2 = _slicedToArray(_ref, 2);

          path = _ref2[0];
          qs = _ref2[1];
          qs = "?" + qs;
        }
        path = path.replace(/\/+$/, "");
        path = path[0] === "/" ? path : "/" + path;
        path = /\.json$/.test(path) ? path : path + ".json";
        return path + qs;
      },
      writable: true,
      configurable: true
    },
    pathKey: {


      /**
       * Util function to make pathname+search key for given URI.
       *
       * @static
       * @param {string|object} uri
       * @param {object} query
       * @returns {string}
       */

      value: function pathKey(uri, query) {
        var qstr = "";
        var qobj = query || {};
        if (!lodash.isObject(uri)) {
          uri = url.parse(uri, true);
        }
        if (!lodash.isEmpty(uri.query)) {
          qobj = lodash.assign({}, uri.query, qobj);
        }
        if (!lodash.isEmpty(qobj)) {
          qstr = "?" + Endpoint.stringifyQuery(qobj);
        }
        return uri.pathname + qstr;
      },
      writable: true,
      configurable: true
    }
  }, {
    start: {

      /**
       * Start the API engine (fetches access tokens).
       *
       * @returns {Engine} self
       */

      value: function start() {
        if (!this.tokens) {
          if (!this.config.clientID) {
            throw new Error("Engine requires the \"clientID\" config");
          }
          if (!this.config.clientSecret) {
            throw new Error("Engine requires the \"clientSecret\" config");
          }
          this.tokens = new Token({
            url: "https://www.reddit.com/api/v1/access_token",
            id: this.config.clientID,
            secret: this.config.clientSecret,
            type: this.config.grantType
          });
          this.tokens.on("error", this.emit.bind(this, "error")).on("data", this.emit.bind(this, "token"));
        }

        if (!this.tokens.isPolling()) {
          this.tokens.poll();
        }

        return this;
      },
      writable: true,
      configurable: true
    },
    endpoint: {


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

      value: function endpoint(options, query) {
        var _this = this;
        options = this._parseOptions(options, query);

        var Class = options.Class;
        var path = options.path;
        var key = options.key;
        var endpoint = this._endpoints[key];

        if (!endpoint) {
          debug("activate endpoint", key, options);
          options.url = "https://oauth.reddit.com" + path;
          options.Class = undefined;
          options.path = undefined;
          endpoint = this._endpoints[key] = new Class(options, this.tokens, this).on("error", function (v) {
            return _this.emit("error", v, endpoint);
          }).on("response", function (v) {
            return _this.emit("response", v, endpoint);
          }).on("data", function (v) {
            return _this.emit("data", v, endpoint);
          }).on("changed", function (v) {
            return _this.emit("changed", v, endpoint);
          });
        }

        return endpoint;
      },
      writable: true,
      configurable: true
    },
    get: {


      /**
       * Get an endpoint request object,
       * if it is not yet activated,
       * returns `undefined`.
       *
       * @param {object|string} options
       * @param {object} query
       * @returns {Endpoint|undefined}
       */

      value: function get(options, query) {
        options = this._parseOptions(options, query);
        return this._endpoints[options.key];
      },
      writable: true,
      configurable: true
    },
    fetch: {


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

      value: function fetch(path, query, callback) {
        var ep = this.endpoint(path, query).valueOnce("data", callback);
        if (!ep.fetch()) {
          // wait for access tokens
          this.tokens.valueOnce("data", function () {
            return ep.fetch();
          });
        }
        return ep;
      },
      writable: true,
      configurable: true
    },
    poll: {


      /**
       * Fetch and start polling an endpoint.
       *
       * @param {string} path
       * @param {object} query
       * @param {function} callback
       * @returns {Endpoint}
       */

      value: function poll(path, query, callback) {
        var ep = this.endpoint(path, query).valueOnce("data", callback);
        var ms = this.config.interval > 0 ? this.config.interval : DEFAULT_INTERVAL;
        ep.poll(ms);
        return ep;
      },
      writable: true,
      configurable: true
    },
    stop: {


      /**
       * Stop all polling
       */

      value: function stop() {
        var self = this;
        if (this.tokens) {
          this.tokens.stop();
        }
        Object.keys(this._endpoints).forEach(function (key) {
          self._endpoints[key].stop();
        });
      },
      writable: true,
      configurable: true
    },
    register: {


      /**
       * Register an Endpoint subclass
       *
       * @param {RegExp} uriRegex
       * @param {Function} cls
       * @returns {Engine} self
       */

      value: function register(uriRegex, cls) {
        this._subclasses.push([uriRegex, cls]);
        return this;
      },
      writable: true,
      configurable: true
    },
    isRegistered: {


      /**
       * Check if the path is a registered custom endpoint.
       *
       * @param {string} path
       * @returns {boolean}
       */

      value: function isRegistered(path) {
        path = Engine.fixPath(path);
        return Endpoint !== this._findSubclass(path);
      },
      writable: true,
      configurable: true
    },
    isActive: {


      /**
       * Check if the path is an activated endpoint.
       *
       * @param {object|string} path
       * @param {object} query
       * @returns {boolean}
       */

      value: function isActive(options, query) {
        return !!this.get(options, query);
      },
      writable: true,
      configurable: true
    },
    isPolling: {


      /**
       * Check if the path is an endpoint that is actively polling.
       *
       * @param {string} path
       * @param {object} query
       * @returns {boolean}
       */

      value: function isPolling(path, query) {
        var ep = this.get(path, query);
        return ep && ep.isPolling();
      },
      writable: true,
      configurable: true
    },
    getActiveEndpoints: {


      /**
       * Get activate endpoints.
       *
       * @returns {object} A hash of uri -> Endpoint objects
       */

      value: function getActiveEndpoints() {
        return lodash.clone(this._endpoints);
      },
      writable: true,
      configurable: true
    },
    getRegisteredEndpoints: {


      /**
       * Get registered endpoint regexp and classes.
       *
       * @returns {object} An array of [RegExp, Endpoint] pairs
       */

      value: function getRegisteredEndpoints() {
        return [].concat(this._subclasses);
      },
      writable: true,
      configurable: true
    },
    _parseOptions: {


      /**
       * Parse and normalize an endpoint options object.
       *
       * @private
       * @param {object|string} options
       * @param {object} query
       * @returns {EndpointOptions}
       */

      value: function _parseOptions(options, query) {
        if (!this.tokens) {
          throw new Error("Engine: call .start() before accessing endpoints");
        }

        if (lodash.isString(options)) {
          options = { path: options };
        } else {
          options = lodash.cloneDeep(options);
        }

        options.qs = options.query = options.query || query;
        options.path = Engine.fixPath(options.path);

        if (this.config.registeredOnly && !this.isRegistered(options.path)) {
          throw new Error("No endpoint registered for path: " + options.path);
        }

        var Class = this._findSubclass(options.path);
        var norm = Class.normalizePath || lodash.identity;

        options.Class = Class;
        options.path = norm(options.path);
        options.key = Engine.pathKey(options.path, options.query);

        return options;
      },
      writable: true,
      configurable: true
    },
    _findSubclass: {


      /**
       * @private
       */

      value: function _findSubclass(path) {
        var result = lodash(this._subclasses).find(function (rc) {
          return rc[0].test(path);
        });
        return result ? result[1] : Endpoint;
      },
      writable: true,
      configurable: true
    }
  });

  return Engine;
})(Emitter);

module.exports = Engine;