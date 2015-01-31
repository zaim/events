'use strict';

import Endpoint from '../core/Endpoint';


class Subreddit extends Endpoint {
  // TODO

  static register (engine) {
    var p = '[^/]+';
    var r = new RegExp(`/r/${p}/(?:hot|new|top|controversial)(?:/|\\.json)?`);
    engine.register(r, Subreddit);
  }
}


export default Subreddit;
