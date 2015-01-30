'use strict';

// Export core Engine class
import Engine from './core/Engine';

// Make available other core classes
import AccessToken from './core/AccessToken';
import Endpoint from './core/Endpoint';
import Engine from './core/Engine';
import Request from './core/Request';
import ValueEmitter from './core/ValueEmitter';
import Watcher from './core/Watcher';
import Thread from './endpoints/Thread';
import Subreddit from './endpoints/Subreddit';


// Register global Endpoint subclasses

// Comment threads
// e.g. "/r/javascript/comments/abc123.json"
// e.g. "/comments/xyz32.json"
Engine.register(/\/(r\/[^\/]+\/)?comments\/[^\/]+\.json/, Thread);

// Subreddits
// e.g. "/r/programming/hot.json"
Engine.register(/\/r\/[^\/]+\/(hot|new|top|controversial)\.json/, Subreddit);


export default Engine;

export {
  AccessToken,
  Endpoint,
  Engine,
  Request,
  ValueEmitter,
  Watcher,
  Thread,
  Subreddit
};
