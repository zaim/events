"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// Core classes
var AccessToken = _interopRequire(require("./core/AccessToken"));

var Endpoint = _interopRequire(require("./core/Endpoint"));

var _coreEngine = require("./core/Engine");

var Engine = _interopRequire(_coreEngine);

var Engine = _interopRequire(_coreEngine);

var Request = _interopRequire(require("./core/Request"));

var ValueEmitter = _interopRequire(require("./core/ValueEmitter"));

var Watcher = _interopRequire(require("./core/Watcher"));

// Default Endpoint subclasses
var Subreddit = _interopRequire(require("./endpoints/Subreddit"));

var Thread = _interopRequire(require("./endpoints/Thread"));




/**
 * Wrapper for instansiating `Engine` with
 * pre-registered endpoint subclasses.
 */

var Reddit = (function (Engine) {
  function Reddit() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(Reddit.prototype), "constructor", this).apply(this, args);
    Thread.register(this);
    Subreddit.register(this);
  }

  _inherits(Reddit, Engine);

  return Reddit;
})(Engine);

exports.AccessToken = AccessToken;
exports.Endpoint = Endpoint;
exports.Engine = Engine;
exports.Reddit = Reddit;
exports.Request = Request;
exports.ValueEmitter = ValueEmitter;
exports.Watcher = Watcher;
exports.Thread = Thread;
exports.Subreddit = Subreddit;
exports.__esModule = true;