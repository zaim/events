"use strict";

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

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

var Endpoint = _interopRequire(require("../core/Endpoint"));

var Subreddit = (function (Endpoint) {
  function Subreddit() {
    if (Object.getPrototypeOf(Subreddit) !== null) {
      Object.getPrototypeOf(Subreddit).apply(this, arguments);
    }
  }

  _inherits(Subreddit, Endpoint);

  return Subreddit;
})(Endpoint);

module.exports = Subreddit;
// TODO