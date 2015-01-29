"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _get = function get(object, property, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    return desc.value;
  } else {
    var getter = desc.get;
    if (getter === undefined) {
      return undefined;
    }
    return getter.call(receiver);
  }
};

var _inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) subClass.__proto__ = superClass;
};

var lodash = require("lodash");
//var qs = require('querystring');
var Emitter = require("eventemitter3");
var Token = require("./AccessToken");
var Endpoint = require("./Endpoint");


/*
 * Global custom Endpoint subclass registry.
 */

var endpointClasses = [];



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
    register: {


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

      value: function register(uriRegex, cls) {
        endpointClasses.push([uriRegex, cls]);
        return Engine;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    fixPath: {


      /**
       * Util function to fix API paths.
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
      enumerable: true,
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
      enumerable: true,
      configurable: true
    },
    endpoint: {


      /**
       * Get an endpoint request object.
       *
       * @param {string} path
       * @param {object} query
       * @returns {Endpoint}
       */

      value: function endpoint(path, query) {
        if (!this.tokens) {
          throw new Error("Engine: call .start() before accessing endpoints");
        }

        var Class, endpoint, key;

        path = Engine.fixPath(path);
        key = Endpoint.makePath(path, query);

        if (!this._endpoints.hasOwnProperty(key)) {
          Class = this._findSubclass(path);
          endpoint = this._endpoints[key] = new Class({
            url: "https://oauth.reddit.com" + path,
            qs: query
          }, this.tokens);
          endpoint.on("error", this.emit.bind(this, "error")).on("response", this.emit.bind(this, "response")).on("data", this.emit.bind(this, "data"));
        } else {
          endpoint = this._endpoints[key];
        }

        return endpoint;
      },
      writable: true,
      enumerable: true,
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
      enumerable: true,
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
      enumerable: true,
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
      enumerable: true,
      configurable: true
    },
    isActive: {


      /**
       * Check if the path is an activated endpoint.
       *
       * @param {string} path
       * @param {object} query
       * @returns {boolean}
       */

      value: function isActive(path, query) {
        var key = Endpoint.makePath(path, query);
        return this._endpoints.hasOwnProperty(key);
      },
      writable: true,
      enumerable: true,
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
        var key = Endpoint.makePath(path, query);
        return this._endpoints.hasOwnProperty(key) && this._endpoints[key].isPolling();
      },
      writable: true,
      enumerable: true,
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
      enumerable: true,
      configurable: true
    },
    getRegisteredEndpoints: {


      /**
       * Get registered endpoint regexp and classes.
       *
       * @returns {object} An array of [RegExp, Endpoint] pairs
       */

      value: function getRegisteredEndpoints() {
        // instance registry first, to match finding order, below
        return this._subclasses.concat(endpointClasses);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _findSubclass: {


      /**
       * @private
       */

      value: function FindSubclass(path) {
        var finder, recls;

        finder = function __finder(recls) {
          return recls[0].test(path);
        };

        // find in instance registry first
        recls = lodash(this._subclasses).find(finder);

        if (!recls) {
          // next, find in global registry
          recls = lodash(endpointClasses).find(finder);
        }

        return recls ? recls[1] : Endpoint;
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Engine;
})(Emitter);

module.exports = Engine;