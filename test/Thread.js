/* global describe, it */

var fs = require('fs');
var expect = require('expect.js');
var Thread = require('../lib/endpoints/Thread');


describe('Thread', function () {

  var content = fs.readFileSync(__dirname + '/fixtures/2ro6nw.json');

  it('should parse and flatten response object', function () {
    var thread = new Thread({ url: '/comments/test.json' });
    var parsed = thread.parse(content);
    expect(parsed.post).to.be.an('object');
    expect(parsed.comments).to.be.an('array');
    parsed.comments.forEach(function __checkComment (comment) {
      if (comment.replies) {
        expect(comment.replies).to.be.an('array');
        comment.replies.forEach(__checkComment);
      }
    });
  });

});
