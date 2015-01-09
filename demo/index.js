var lodash = require('lodash');
var rddt = require('../');
var count = 0;

var secrets;
var tokens;
var thread;

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

tokens = new rddt.TokenEmitter({
  url: 'https://www.reddit.com/api/v1/access_token',
  id: secrets.clientID,
  secret: secrets.clientSecret
});

thread = new rddt.Endpoint({
  url: 'https://oauth.reddit.com/r/javascript/new.json',
  interval: 5000
});

tokens.on('error', printError);
tokens.fetch();

thread.on('data', printPosts);
thread.on('error', printError);
thread.setTokenEmitter(tokens);
thread.fetch();

function printPosts (thing) {
  console.log('---------- ' + (++count) + ' ----------');
  lodash(thing.data.children)
    .pluck('data')
    .each(function (post, i) {
      console.log((i + 1) + ') ' + post.title);
    });

  if (count === 10) {
    thread.stop();
    tokens.stop();
  }
}

function printError (err) {
  console.error('---------- ERROR ----------');
  console.error('Message: ' + err.message);
  if (err.response) {
    console.error('Body: ' + err.response.body);
  }
}
