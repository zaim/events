'use strict';

/* global describe, it */

var fs = require('fs');
var expect = require('expect.js');
var jiff = require('jiff');
var lodash = require('lodash');
var Thread = require('../lib/endpoints/Thread');


describe('Thread', function () {

  it('should parse and flatten response object', function () {
    var data = fs.readFileSync(__dirname + '/fixtures/2ro6nw.json');
    var thread = new Thread({ url: '/comments/test.json' });
    var parsed = thread.parse(data);
    expect(parsed.post).to.be.an('object');
    expect(parsed.post.kind).to.be('t3');
    expect(parsed.comments).to.be.an('array');
    parsed.comments.forEach(function __checkComment (comment) {
      if (comment.replies) {
        expect(comment.kind).to.be('t1');
        expect(comment.replies).to.be.an('array');
        comment.replies.forEach(__checkComment);
      }
    });
  });

  it('should emit correct change events', function (done) {
    var current, next, thread;

    current = {
      post: {
        id: 't3_name',
        ups: 10,
        downs: 3,
        score: 7,
        kind: 't3'
      },
      comments: [
        { id: 't1_comment1',
          ups: 1,
          downs: 0,
          score: 1,
          body: 'test1',
          kind: 't1'
        },
        { id: 't1_comment2',
          ups: 1,
          downs: 0,
          score: 1,
          body: 'test2',
          kind: 't1'
        },
        { id: 't1_comment3',
          ups: 1,
          downs: 0,
          score: 1,
          body: 'test3',
          kind: 't1',
          replies: [
            { id: 't1_comment3_1',
              ups: 1,
              downs: 0,
              score: 1,
              body: 'test3_1',
              kind: 't1'
            },
            { id: 't1_comment3_2',
              ups: 1,
              downs: 0,
              score: 1,
              body: 'test3_2',
              kind: 't1'
            }
          ]
        }
      ]
    };

    next = lodash.cloneDeep(current);
    next.post.ups += 10;
    next.post.downs += 9;
    next.post.score = next.post.ups - next.post.downs;
    next.comments[0].ups += 8;
    next.comments[0].downs += 7;
    next.comments[0].score = next.comments[0].ups - next.comments[0].downs;
    next.comments[1].ups += 6;
    next.comments[1].downs += 5;
    next.comments[1].score = next.comments[1].ups - next.comments[1].downs;
    next.comments[2].replies[0].ups += 4;
    next.comments[2].replies[0].downs += 3;
    next.comments[2].replies[0].score = next.comments[2].replies[0].ups +
      next.comments[2].replies[0].downs;

    thread = new Thread({ url: '/comments/test.json' });
    thread.on('changed', function (ops) {
      var patched = jiff.patch(ops, current);
      expect(patched).to.not.be(next);
      expect(patched).to.eql(next);
      done();
    });
    thread.emit('data', current);
    thread.emit('data', next);
  });

});
