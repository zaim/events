"use strict";

var _extends = function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      target[key] = source[key];
    }
  }

  return target;
};

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

// Export core Engine class
var Engine = _interopRequire(require("./core/Engine"));

// Make available other core classes
var AccessToken = _interopRequire(require("./core/AccessToken"));

var Endpoint = _interopRequire(require("./core/Endpoint"));

var Engine = _interopRequire(require("./core/Engine"));

var Request = _interopRequire(require("./core/Request"));

var ValueEmitter = _interopRequire(require("./core/ValueEmitter"));

var Watcher = _interopRequire(require("./core/Watcher"));

var Thread = _interopRequire(require("./endpoints/Thread"));

var Subreddit = _interopRequire(require("./endpoints/Subreddit"));




// Register global Endpoint subclasses

// Comment threads
// e.g. "/r/javascript/comments/abc123.json"
// e.g. "/comments/xyz32.json"
Engine.register(/\/(r\/[^\/]+\/)?comments\/[^\/]+\.json/, Thread);

// Subreddits
// e.g. "/r/programming/hot.json"
Engine.register(/\/r\/[^\/]+\/(hot|new|top|controversial)\.json/, Subreddit);


exports["default"] = Engine;
exports.AccessToken = AccessToken;
exports.Endpoint = Endpoint;
exports.Engine = Engine;
exports.Request = Request;
exports.ValueEmitter = ValueEmitter;
exports.Watcher = Watcher;
exports.Thread = Thread;
exports.Subreddit = Subreddit;
module.exports = _extends(exports["default"], exports);