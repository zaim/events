"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _applyConstructor = function (Constructor, args) { var instance = Object.create(Constructor.prototype); var result = Constructor.apply(instance, args); return result != null && (typeof result == "object" || typeof result == "function") ? result : instance; };

var _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

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

function Reddit() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var engine = _applyConstructor(Engine, _toArray(args));
  Thread.register(engine);
  Subreddit.register(engine);
  return engine;
}

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