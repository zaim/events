"use strict";

var _toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _get = function get(object, property, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    return desc.value;
  } else {
    var getter = desc.get;
    if (getter === undefined) {
      return undefined;
    }
    return getter.call(receiver);
  }
};

var _inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) subClass.__proto__ = superClass;
};

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

var debug_ = _interopRequire(require("debug"));

var lodash = _interopRequire(require("lodash"));

var request = _interopRequire(require("request"));

var ValueEmitter = _interopRequire(require("./ValueEmitter"));

var pkg = _interopRequire(require("../../package.json"));

debug_ = debug_("remmit:request");

var author = typeof pkg.author === "object" ? pkg.author.name : pkg.author;

var debug = function (req, m) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  var url = "";
  if (req.options.url) {
    url = req.options.url;
    if (typeof req.options.url === "object") {
      url = req.options.url.href;
    }
  }
  debug_.apply(undefined, [m, url].concat(_toArray(args)));
};


/**
 * Send requests at intervals.
 *
 * @class
 * @augments ValueEmitter
 */

var Request = (function (ValueEmitter) {
  /**
   * @constructor
   * @param {object} options Same options as `request` with additional:
   * @param {number} options.interval
   * @param {array}  options.failStatus
   */

  function Request(options) {
    if (!options) {
      throw new Error("Request requires the \"options\" argument");
    }

    _get(Object.getPrototypeOf(Request.prototype), "constructor", this).call(this);

    options = lodash.cloneDeep(options);
    options.interval = options.interval || 0;
    options.failStatus = options.failStatus || [/^[^2]/];

    this.on("error", this._error);

    this.options = options;
    this._poll = false;
    this._timer = null;
    this._predicate();
  }

  _inherits(Request, ValueEmitter);

  _prototypeProperties(Request, null, {
    validate: {


      /**
       * Validate current options object. To override in subclass.
       *
       * Default implementation always return true.
       *
       * @protected
       * @returns {boolean}
       */

      value: function validate() {
        return true;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    parse: {


      /**
       * Parse the response body. To override in subclass.
       *
       * Default implementation uses JSON.parse.
       *
       * @protected
       * @param {string} body
       * @returns {boolean}
       */

      value: function parse(body) {
        return JSON.parse(body);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    fetch: {


      /**
       * Fetch the URL.
       */

      value: function fetch(poll) {
        // enable/disable polling if `poll` arg given
        if (typeof poll !== "undefined") {
          this._poll = poll;
        }

        try {
          // don't throw errors here, instead
          // emit them as events because
          // `fetch` might be called async-ly
          this._predicate();
        } catch (e) {
          this.emit("error", e);
          return false;
        }

        if (this.validate()) {
          // always clear timer before sending request
          // in case `fetch` is called while we are
          // already waiting on a timeout (TODO test)
          this._clear();
          debug(this, "fetching");
          return Request.go(this.options, this._callback.bind(this));
        }

        return false;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    poll: {


      /**
       * Start polling the URL.
       */

      value: function poll(interval) {
        if (typeof interval !== "undefined") {
          this.options.interval = interval;
        }
        this.fetch(true);
        return this;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    stop: {


      /**
       * Stop polling the URL.
       */

      value: function stop() {
        debug(this, "stopping poll");
        this._clear();
        this._poll = false;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    isPolling: {


      /**
       * Returns true if in poll mode
       */

      value: function isPolling() {
        return this._poll;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _clear: {


      /**
       * @private
       */

      value: function Clear() {
        if (this._timer) {
          debug(this, "clearing timer");
          clearTimeout(this._timer);
          this._timer = null;
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _predicate: {


      /**
       * @private
       */

      value: function Predicate() {
        debug(this, "predicate: url");
        if (!this.options.url) {
          throw new Error("Request requires the \"url\" option");
        }
        return true;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _callback: {


      /**
       * @private
       */

      value: function Callback(err, resp, body) {
        debug(this, "response", err, resp && resp.statusCode, body && body.length);

        if (resp) {
          // always emit response, even on error
          this.emit("response", resp);
          // check for non-200 errors
          if (!err && lodash.any(this.options.failStatus, match(resp.statusCode))) {
            err = new Error("Request: request responded with " + resp.statusCode);
          }
        }

        if (!err) {
          // parse body, catching any parse errors
          try {
            body = this.parse(body);
          } catch (e) {
            err = e;
          }
        }

        if (err) {
          // attach response to error object
          err.response = resp;
          // emit error *after* stopping timer
          this.emit("error", err);
        } else {
          // everything ok? emit parsed body
          this.emit("data", body);
        }

        // only setTimeout if in 'poll' mode and interval > 0
        if (this._poll && this.options.interval) {
          debug(this, "interval", this.options.interval);
          this._timer = setTimeout(this.fetch.bind(this), this.options.interval);
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    _error: {


      /**
       * @private
       */

      value: function Error(err) {
        if (this.options.stopOnFail) {
          this.stop();
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Request;
})(ValueEmitter);




/**
 * Create `request` function with default headers:
 *
 *     user-agent: '<pkg.name>/<pkg.version> by <pkg.author>'
 *
 * @returns {function}
 */

Request.go = request.defaults({
  headers: {
    "user-agent": pkg.name + "/" + pkg.version + " by " + author
  }
});


function match(code) {
  return function (regexp) {
    return String(code).search(regexp) !== -1;
  };
}


module.exports = Request;