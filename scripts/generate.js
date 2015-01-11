var lodash = require('lodash');
var snooform = require('snooform');


function main () {
  var varRegex = /\$([a-z]+)/g;
  var out = process.stdout;

  snooform.api().done(function (api) {
    out.write('[\n');
    lodash(api).sortBy('path').each(parseEndpoint);
    out.write(']\n');
  });

  function parseEndpoint (endpoint, i, api) {
    var params = [];
    var last = i === api.length - 1;
    var tab = '  ';

    endpoint.re = '^' + endpoint.path.replace(varRegex, _replacer) + '$';

    if (params.length) {
      endpoint.parameters = params;
    }

    out.write(
      JSON.stringify(endpoint, null, tab.length).replace(/^/gm, tab) +
      (last ? '' : ',') +
      '\n'
    );

    function _replacer (m, n) {
      params.push(n);
      return '([^/]+)';
    }
  }
}

if (require.main === module) {
  main();
}
