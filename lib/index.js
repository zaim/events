"use strict";

// Install ES6 polyfills
require("6to5/polyfill");

// Export core Engine class
var Engine = require("./core/Engine");

// Make available other core classes
Engine.AccessToken = require("./core/AccessToken");
Engine.Endpoint = require("./core/Endpoint");
Engine.Engine = require("./core/Engine");
Engine.Request = require("./core/Request");
Engine.ValueEmitter = require("./core/ValueEmitter");
Engine.Watcher = require("./core/Watcher");
Engine.Thread = require("./endpoints/Thread");
Engine.Subreddit = require("./endpoints/Subreddit");


// Register global Endpoint subclasses

// Comment threads
// e.g. "/r/javascript/comments/abc123.json"
// e.g. "/comments/xyz32.json"
Engine.register(/\/(r\/[^\/]+\/)?comments\/[^\/]+\.json/, Engine.Thread);

// Subreddits
// e.g. "/r/programming/hot.json"
Engine.register(/\/r\/[^\/]+\/(hot|new|top|controversial)\.json/, Engine.Subreddit);

module.exports = Engine;