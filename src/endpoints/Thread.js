'use strict';

import lodash from 'lodash';
import Endpoint from '../core/Endpoint';
import Watcher from '../core/Watcher';
import rutil from './util';


class ThreadWatcher extends Watcher {

  objectHash (object) {
    if (lodash.isString(object.kind) &&
        !lodash.isEmpty(object.kind) &&
        !lodash.isEmpty(object.name)) {
      return object.name + (object.kind === 'more' ? '_more' : '');
    }
    return super.objectHash(object);
  }

}


class Thread extends Endpoint {

  constructor (...args) {
    super(...args);
    this.watcher = new ThreadWatcher(this);
    this.watcher.on('changed', this.emit.bind(this, 'changed'));
  }

  parse (data) {
    var post, comments;
    data = rutil.parse(super.parse(data));
    post = data[0].children[0];
    comments = data[1].children.map(flattenReplies);
    return { post, comments };
  }

  /**
   * Register the 'thread' endpoint RegExp on an Engine
   *
   * @param {Engine} engine
   */

  static register (engine) {
    engine.register(Thread.PATH_REGEXP, Thread);
  }


  /**
   * Given a path that matches the 'thread' endpoint,
   * return a normalized, canonical path.
   *
   * Basically, any of these:
   *
   * - /r/javascript/comments/id123.json
   * - /r/javascript/comments/id123/ (trailing slash optional)
   * - /r/javascript/comments/id123/any_title_text/ (trailing slash optional)
   * - /r/javascript/comments/id123/any_title_text.json
   * - /comments/id123.json
   * - /comments/id123/ (trailing slash optional)
   * - /comments/id123/any_title_text/ (trailing slash optional)
   * - /comments/id123/any_title_text.json
   *
   * Will be normalized to:
   *
   * - /comments/xyz32.json
   *
   * @param {String} path
   */

  static normalizePath (path) {
    var match = Thread.PATH_REGEXP.exec(path);
    if (match) {
      path = `/comments/${match[1]}.json`;
    }
    return path;
  }

}


/**
 * The 'thread' endpoint path RegExp, should match:
 *
 * - /r/javascript/comments/id123.json
 * - /r/javascript/comments/id123/ (trailing slash optional)
 * - /r/javascript/comments/id123/any_title_text/ (trailing slash optional)
 * - /r/javascript/comments/id123/any_title_text.json
 * - /comments/xyz32.json
 * - /comments/xyz32/ (trailing slash optional)
 * - /comments/xyz32/any_title_text/ (trailing slash optional)
 * - /comments/xyz32/any_title_text.json
 */

Thread.PATH_REGEXP = (function(){
  var p = '[^/]+';
  var i = '[^/\.]+';
  return new RegExp(`/(?:r/${p}/)?comments/(${i})(?:/${p})?(?:/|\\.json)?`);
})();


function flattenReplies (comment) {
  if (comment.replies) {
    comment.replies = comment.replies.children.map(flattenReplies);
  }
  return comment;
}


export default Thread;
