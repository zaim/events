"use strict";

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

//var qs = require('qs');
var url = require("url");
var debug = require("debug")("remmit:endpoint");
var lodash = require("lodash");
var Request = require("./Request");


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
    if (!options || !options.uri && !options.url) {
      throw new Error("Endpoint requires the \"url\" option");
    }

    options.uri = options.url = url.parse(options.uri || options.url, true);

    _get(Object.getPrototypeOf(Endpoint.prototype), "constructor", this).call(this, options);

    this.options.headers = this.options.headers || {};

    lodash.assign(this.options.headers, {
      authorization: null
    });

    lodash.assign(this.options, {
      method: "get",
      stopOnFail: true
    });

    if (tokens) {
      this.setTokenEmitter(tokens);
    }

    this.path = this.options.url.pathname;
  }

  _inherits(Endpoint, Request);

  _prototypeProperties(Endpoint, null, {
    validate: {


      /**
       * @protected
       */

      value: function validate() {
        debug("check options", this.options.headers);
        return !!this.options.headers.authorization;
      },
      writable: true,
      enumerable: true,
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
        this._tokenEmitter = emitter;
        this._tokenEmitter.value("data", this._onTokens, this);
        return this;
      },
      writable: true,
      enumerable: true,
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
      enumerable: true,
      configurable: true
    },
    _onTokens: {


      /**
       * @private
       */

      value: function OnTokens(data) {
        if (data && data.token_type && data.access_token) {
          debug("set tokens", data);
          this.options.headers.authorization = data.token_type + " " + data.access_token;
          if (this.isPolling()) {
            debug("refetching");
            this.fetch();
          }
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Endpoint;
})(Request);

module.exports = Endpoint;