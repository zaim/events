"use strict";

var util = require("util");
var Endpoint = require("../core/Endpoint");


module.exports = Subreddit;

util.inherits(Subreddit, Endpoint);


function Subreddit() {
  Endpoint.apply(this, arguments);
}

// TODO