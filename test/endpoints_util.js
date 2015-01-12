/* global describe, it */

var fs = require('fs');
var expect = require('expect.js');
var rutil = require('../lib/endpoints/util');


describe('endpoints/util', function () {

  describe('isThing()', function () {

    it('should identify things', function () {
      expect(rutil.isThing({ kind:'t3' })).to.be(false);
      expect(rutil.isThing({ data:{} })).to.be(false);
      expect(rutil.isThing({ kind:'t3', data:{} })).to.be(true);
    });

  });

  describe('parse()', function () {

    var content = fs.readFileSync(__dirname + '/fixtures/2ro6nw.json');
    var json = JSON.parse(content);

    it('should parse a comments json response', function () {
      var parsed = rutil.parse(json);
      expect(parsed).to.be.an(Array);
      expect(parsed.length).to.be(2);
      parsed.forEach(function __checkThing (thing) {
        expect(thing).to.be.an('object');
        expect(thing.kind).to.be('Listing');
        expect(thing.children).to.be.an(Array);
      });
      parsed[1].children.forEach(function __checkComment (comment) {
        expect(comment.kind).to.match(/t1|more/);
        if (comment.replies) {
          expect(comment.replies).to.be.an('object');
          expect(comment.replies.children).to.be.an(Array);
          comment.replies.children.forEach(__checkComment);
        }
      });
    });

  });

});
