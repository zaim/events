# remmit
> Library that uses event emitters for (semi)realtime Reddit API consumption.

**NOTE: This library is experimental and under heavy development.**

## Install

This library is not yet available on NPM. For now, you may clone it.

```
$ git clone https://github.com/zaim/remmit
```

## Example

```javascript
var Reddit = require('remmit');

var engine = new Reddit({
  clientID: 'clientid',
  clientSecret: 'secret'
});

// Call 'start' to fetch access tokens
engine.start();

// Call 'endpoint' to create a Reddit API endpoint
var endpoint = engine.endpoint('/comments/1byn1l.json')
  .query({ sort: 'new', limit: 25 })
  .on('data', printComments)
  .on('error', printError);

// Call 'poll' to start polling the endpoint at intervals
endpoint.poll(5000);
```

## Demo

There is a very simple demo script at `demo/index.js`. It simply polls a
thread and prints out comments 5 times and exits. By default it fetches the
[I was mauled by a bear](https://www.reddit.com/comments/1byn1l) AMA thread.
You can pass a different thread ID:

```
$ node demo [id]
```

## Changelog

### 0.2.0

* **Breaking change to `Thread` class:**
  - Correctly flatten comment thread (c00cf16ca1ea3fc32137a0fff8ebc11761c6f402)
* Minor update to `Endpoint` class:
  - Pass endpoint URL as either `url` or `uri` option property
* Minor update to `Engine` class:
  - `#endpoint()` now accepts a `query` argument
  - Resue same endpoint with same query strings

## License

`remmit` is [MIT-licensed](./LICENSE).
