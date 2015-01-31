'use strict';

// Core classes
import AccessToken from './core/AccessToken';
import Endpoint from './core/Endpoint';
import Engine from './core/Engine';
import Engine from './core/Engine';
import Request from './core/Request';
import ValueEmitter from './core/ValueEmitter';
import Watcher from './core/Watcher';

// Default Endpoint subclasses
import Subreddit from './endpoints/Subreddit';
import Thread from './endpoints/Thread';


/**
 * Wrapper for instansiating `Engine` with
 * pre-registered endpoint subclasses.
 */

function Reddit (...args) {
  var engine = new Engine(...args);
  Thread.register(engine);
  Subreddit.register(engine);
  return engine;
}

export default Reddit;

// Also make available all core classes
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
