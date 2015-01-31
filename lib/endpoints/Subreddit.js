"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var Endpoint = _interopRequire(require("../core/Endpoint"));

var Subreddit = (function (Endpoint) {
  function Subreddit() {
    if (Object.getPrototypeOf(Subreddit) !== null) {
      Object.getPrototypeOf(Subreddit).apply(this, arguments);
    }
  }

  _inherits(Subreddit, Endpoint);

  _prototypeProperties(Subreddit, {
    register: {
      // TODO

      value: function register(engine) {
        var p = "[^/]+";
        var r = new RegExp("/r/" + p + "/(?:hot|new|top|controversial)(?:/|\\.json)?");
        engine.register(r, Subreddit);
      },
      writable: true,
      configurable: true
    }
  });

  return Subreddit;
})(Endpoint);

module.exports = Subreddit;