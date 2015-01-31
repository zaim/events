"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var lodash = _interopRequire(require("lodash"));

var Endpoint = _interopRequire(require("../core/Endpoint"));

var Watcher = _interopRequire(require("../core/Watcher"));

var rutil = _interopRequire(require("./util"));

var ThreadWatcher = (function (Watcher) {
  function ThreadWatcher() {
    if (Object.getPrototypeOf(ThreadWatcher) !== null) {
      Object.getPrototypeOf(ThreadWatcher).apply(this, arguments);
    }
  }

  _inherits(ThreadWatcher, Watcher);

  _prototypeProperties(ThreadWatcher, null, {
    objectHash: {
      value: function objectHash(object) {
        if (lodash.isString(object.kind) && !lodash.isEmpty(object.kind) && !lodash.isEmpty(object.id)) {
          return object.id;
        }
        return _get(Object.getPrototypeOf(ThreadWatcher.prototype), "objectHash", this).call(this, object);
      },
      writable: true,
      configurable: true
    }
  });

  return ThreadWatcher;
})(Watcher);

var Thread = (function (Endpoint) {
  function Thread() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(Thread.prototype), "constructor", this).apply(this, args);
    this.watcher = new ThreadWatcher(this);
    this.watcher.on("changed", this.emit.bind(this, "changed"));
  }

  _inherits(Thread, Endpoint);

  _prototypeProperties(Thread, {
    register: {

      /**
       * Register the 'thread' endpoint RegExp on an Engine, should match:
       *
       * - /r/javascript/comments/id123.json
       * - /r/javascript/comments/id123/ (trailing slash optional)
       * - /r/javascript/comments/id123/any_title_text/ (trailing slash optional)
       * - /r/javascript/comments/id123/any_title_text.json
       * - /comments/xyz32.json
       * - /comments/xyz32/ (trailing slash optional)
       * - /comments/xyz32/any_title_text/ (trailing slash optional)
       * - /comments/xyz32/any_title_text.json
       *
       * @param {Engine} engine Either an engine instance, or class
       */

      value: function register(engine) {
        var p = "[^/]+";
        var r = new RegExp("/(?:r/" + p + "/)?comments/" + p + "(?:/" + p + ")?(?:/|\\.json)?");
        engine.register(r, Thread);
      },
      writable: true,
      configurable: true
    }
  }, {
    parse: {
      value: function parse(data) {
        var post, comments;
        data = rutil.parse(_get(Object.getPrototypeOf(Thread.prototype), "parse", this).call(this, data));
        post = data[0].children[0];
        comments = data[1].children.map(flattenReplies);
        return { post: post, comments: comments };
      },
      writable: true,
      configurable: true
    }
  });

  return Thread;
})(Endpoint);




function flattenReplies(comment) {
  if (comment.replies) {
    comment.replies = comment.replies.children.map(flattenReplies);
  }
  return comment;
}


module.exports = Thread;