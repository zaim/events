// TODO: a better demo :)

'use strict';

var lodash = require('lodash');
var remmit = require('../');
var count = 0;

var secrets;
var engine;
var id = process.argv.slice(2)[0] || '1byn1l';

try {
  secrets = require('./secrets.json');
} catch (e) {
  console.log(
    'File "demo/secrets.json" created. Fill in your client ID and secret.'
  );
  require('fs').writeFileSync(
    __dirname + '/secrets.json',
    JSON.stringify({ clientID: '', clientSecret: '' }, null, 2)
  );
  process.exit(1);
}

engine = new remmit.Reddit(secrets);
engine.on('error', printError);
engine.start();

console.log('ID: ' + id + '\n');

engine
  .endpoint('/comments/' + id + '.json')
  .query({ sort: 'new', limit: 25 })
  .on('data', printComments)
  .on('error', printError)
  .poll(5000);


function printComments (thing) {
  console.log('---------- ' + (++count) + ' ----------\n');
  lodash(thing.comments)
    .filter(function (c) {
      return c.kind === 't1';
    })
    .each(function (c, i) {
      console.log((i + 1) + ') ' + c.author + ': ' + c.body + '\n');
    });

  if (count === 5) {
    console.error('---------- STOP ----------');
    engine.stop();
  }
}

function printError (err) {
  console.error('---------- ERROR ----------');
  console.error('Message: ' + err.message);
  if (err.response) {
    console.error('Body: ' + err.response.body);
  }
}
