// Use Engine as main core class
module.exports = exports = require('./Engine');

// Attach other core classes as well
exports.AccessToken = require('./AccessToken');
exports.Endpoint = require('./Endpoint');
exports.Request = require('./Request');
exports.Watcher = require('./Watcher');
exports.ValueEmitter = require('./ValueEmitter');
