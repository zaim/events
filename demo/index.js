var lodash = require('lodash');
var Engine = require('../');
var count = 0;

var secrets;
var engine;

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

engine = new Engine(secrets);
engine.on('error', printError);
engine.start();

engine
  .endpoint('/r/javascript/new')
  .on('data', printPosts)
  .on('error', printError)
  .poll(5000);

function printPosts (thing) {
  console.log('---------- ' + (++count) + ' ----------');
  lodash(thing.data.children)
    .pluck('data')
    .each(function (post, i) {
      console.log((i + 1) + ') ' + post.title);
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
