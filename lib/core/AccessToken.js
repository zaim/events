"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var Request = _interopRequire(require("./Request"));




/**
 * Fetches access tokens and refreshes it on expiration.
 *
 * @class
 * @augments ValueEmitter
 */

var AccessToken = (function (Request) {
  /**
   * @constructor
   * @param {object} options Request options
   * @param {string} options.url access_token endpoint URL
   * @param {string} options.type grant type
   * @param {string} options.id client id
   * @param {string} options.secret client secret
   */

  function AccessToken(options) {
    if (!options || !options.id || !options.secret) {
      throw new Error("AccessToken requires \"id\" and \"secret\" options");
    }
    _get(Object.getPrototypeOf(AccessToken.prototype), "constructor", this).call(this, {
      method: "post",
      url: options.url,
      auth: {
        username: options.id,
        password: options.secret
      },
      form: {
        grant_type: options.type || "client_credentials"
      },
      interval: options.interval || 3600000,
      stopOnFail: true
    });
  }

  _inherits(AccessToken, Request);

  _prototypeProperties(AccessToken, null, {
    validate: {


      /**
       * @protected
       */

      value: function validate() {
        return this.options.auth.username && this.options.auth.password;
      },
      writable: true,
      configurable: true
    },
    parse: {


      /**
       * @protected
       */

      value: function parse(body) {
        body = JSON.parse(body);
        this.options.interval = (body.expires_in || 3600) * 1000;
        return body;
      },
      writable: true,
      configurable: true
    }
  });

  return AccessToken;
})(Request);

module.exports = AccessToken;