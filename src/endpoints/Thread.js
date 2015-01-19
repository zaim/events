'use strict';

var Endpoint = require('../core/Endpoint');
var Watcher = require('../core/Watcher');
var rutil = require('./util');
var parse = Endpoint.prototype.parse;



export default class Thread extends Endpoint {

  constructor (...args) {
    super(...args);
    this.watcher = new Watcher(this);
    this.watcher.on('changed', this.emit.bind(this, 'changed'));
  }

  parse (data) {
    data = rutil.parse(parse.call(this, data));
    return {
      post: data[0].children[0],
      comments: data[1].children.map(flattenReplies)
    };
  }

}


function flattenReplies (comment) {
  if (comment.replies) {
    comment.replies = comment.replies.children.map(flattenReplies);
  }
  return comment;
}
