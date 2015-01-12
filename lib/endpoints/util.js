var lo = require('lodash');


exports.isThing = isThing;

/**
 * Checks if given object is a Reddit "thing".
 *
 * @param {object} o
 * @return {boolean}
 *
 * @see {@link https://github.com/reddit/reddit/wiki/JSON}
 */

function isThing (o) {
  return (
    lo.isString(o.kind) &&
    !lo.isEmpty(o.kind) &&
    lo.isObject(o.data)
  );
}


exports.parse = parse;

/**
 * Parse a Reddit API JSON response to a more simplified format.
 */

function parse (o) {
  var object = o;
  if (lo.isArray(o)) {
    object = lo.map(o, parse);
  } else {
    if (isThing(o)) {
      object = o.data;
      object.kind = o.kind;
      if (object.children) {
        object.children = parse(object.children);
      }
      if (object.replies) {
        object.replies = parse(object.replies);
      }
    }
  }
  return object;
}
