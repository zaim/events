// Export core Engine class
module.exports = exports = require('./core');


//
// Register global Endpoint subclasses
//

// Comment threads
// e.g. "/r/javascript/comments/abc123.json"
// e.g. "/comments/xyz32.json"
exports.register(
  /\/(r\/[^\/]+\/)?comments\/id\.json/,
  require('./endpoints/Thread')
);

// Subreddits
// e.g. "/r/programming/hot.json"
exports.register(
  /\/r\/[^\/]+\/(hot|new|top|controversial)\.json/,
  require('./endpoints/Subreddit')
);
