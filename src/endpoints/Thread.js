'use strict';

import lodash from 'lodash';
import Endpoint from '../core/Endpoint';
import Watcher from '../core/Watcher';
import rutil from './util';

var parse = Endpoint.prototype.parse;


class ThreadWatcher extends Watcher {

  objectHash (object) {
    if (lodash.isString(object.kind) &&
        !lodash.isEmpty(object.kind) &&
        !lodash.isEmpty(object.id)) {
      return object.id;
    }
    return super.objectHash(object);
  }

}


export default class Thread extends Endpoint {

  constructor (...args) {
    super(...args);
    this.watcher = new ThreadWatcher(this);
    this.watcher.on('changed', this.emit.bind(this, 'changed'));
  }

  parse (data) {
    var post, comments;
    data = rutil.parse(parse.call(this, data));
    post = data[0].children[0];
    comments = data[1].children.map(flattenReplies);
    return { post, comments };
  }

}


function flattenReplies (comment) {
  if (comment.replies) {
    comment.replies = comment.replies.children.map(flattenReplies);
  }
  return comment;
}
