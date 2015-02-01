"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var qs = _interopRequire(require("querystring"));

var url = _interopRequire(require("url"));

var debug = _interopRequire(require("debug"));

var lodash = _interopRequire(require("lodash"));

var Request = _interopRequire(require("./Request"));

debug = debug("remmit:endpoint");


/**
 * Does endpoint polling. Set a source AccessToken using
 * `setTokenEmitter` method - the requests will use access
 * tokens emitted by it.
 *
 * @class
 * @augments Request
 */

var Endpoint = (function (Request) {
  /**
   * @constructor
   * @param {object} options
   * @param {string} options.url The endpoint URL (required)
   * @param {AccessToken} tokens
   */

  function Endpoint(options, tokens) {
    var _this = this;
    if (!options || !options.uri && !options.url) {
      throw new Error("Endpoint requires the \"url\" option");
    }

    var uri = options.uri || options.url;

    if (!lodash.isObject(uri)) {
      uri = url.parse(uri, true);
    }

    // merge both queries in the uri string and options object
    if (options.qs) {
      uri.query = lodash.merge(uri.query || {}, options.qs);
    }

    // if there is a qs, re-stringify uri to sort by keys
    if (!lodash.isEmpty(uri.query)) {
      uri.search = "?" + Endpoint.stringifyQuery(uri.query);
      uri.path = uri.pathname + uri.search;
      uri.href = url.format(uri);
    }

    _get(Object.getPrototypeOf(Endpoint.prototype), "constructor", this).call(this, lodash.assign({}, options, { uri: uri, url: uri }));

    lodash.assign(this.options, {
      headers: lodash.assign(this.options.headers || {}, {
        authorization: null
      }),
      method: "get",
      stopOnFail: true
    });

    Object.defineProperty(this, "path", {
      configurable: false,
      enumerable: false,
      value: Endpoint.makePath(this.options.uri),
      writable: false
    });

    ["href", "pathname", "query"].forEach(function (key) {
      Object.defineProperty(_this, key, {
        configurable: false,
        enumerable: false,
        get: function get() {
          return this.options.uri[key];
        }
      });
    });

    if (tokens) {
      this.setTokenEmitter(tokens);
    }
  }

  _inherits(Endpoint, Request);

  _prototypeProperties(Endpoint, {
    stringifyQuery: {


      /**
       * Util function to stringify query string objects.
       *
       * Difference from built-in `querystring` module is
       * that the query keys are sorted before stringify,
       * this allows the qs to be used as a unique key.
       *
       * @static
       * @param {object} query
       * @returns {string}
       */

      value: function stringifyQuery(query) {
        var keys = Object.keys(query).sort();
        var pairs = keys.map(function (k) {
          return qs.escape(k) + "=" + qs.escape(query[k]);
        });
        return pairs.join("&");
      },
      writable: true,
      configurable: true
    },
    makePath: {


      /**
       * Util function to make pathname+search key for given URI.
       *
       * @static
       * @param {string|object} uri
       * @param {object} query
       * @returns {string}
       */

      value: function makePath(uri, query) {
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
    validate: {


      /**
       * @protected
       */

      value: function validate() {
        debug("check options", this.options.headers);
        return !!this.options.headers.authorization;
      },
      writable: true,
      configurable: true
    },
    setTokenEmitter: {


      /**
       * Set the AccessToken source.
       *
       * @param   {AccessToken} emitter
       * @listens AccessToken#data
       * @returns {Endpoint} self
       */

      value: function setTokenEmitter(emitter) {
        if (this._tokenEmitter) {
          this._tokenEmitter.removeListener("data", this._onTokens);
        }
        emitter.value("data", this._onTokens, this);
        var current = emitter.getValue("data");
        if (current) {
          this._onTokens.apply(this, current);
        }
        this._tokenEmitter = emitter;
        return this;
      },
      writable: true,
      configurable: true
    },
    query: {


      /**
       * Update Endpoint query string.
       *
       * The next call to fetch() will use this new query string.
       *
       * @param {object} qs
       * @returns {Endpoint} self
       */

      value: function query(qs) {
        this.options.qs = qs;
        return this;
      },
      writable: true,
      configurable: true
    },
    _onTokens: {


      /**
       * @private
       */

      value: function _onTokens(data) {
        var newAuth;
        var currentAuth = this.options.headers.authorization;

        if (data && data.token_type && data.access_token) {
          debug("set tokens", data);
          newAuth = data.token_type + " " + data.access_token;
          this.options.headers.authorization = newAuth;
          if (newAuth !== currentAuth && this.isPolling()) {
            debug("refetching");
            this.fetch();
          }
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Endpoint;
})(Request);

module.exports = Endpoint;