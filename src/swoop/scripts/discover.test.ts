import assert from 'node:assert/strict';
import test from 'node:test';

import { discoverAndFetchScripts } from './discover.js';

test('swoop/scripts/discover: discovers inline and external scripts; filters non-js types', async () => {
  const html = [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<base href="/sub/">',
    '</head>',
    '<body>',
    '<script>console.log("a")</script>',
    '<script type="application/ld+json">{"x":1}</script>',
    '<script type="module">console.log("m")</script>',
    '<script src="./x.js"></script>',
    '</body>',
    '</html>',
  ].join('');

  const pluckStub = async (url: string) => {
    assert.equal(url, 'https://example.com/sub/x.js');
    return {
      textUtf8: async () => 'console.log("ext")',
    } as any;
  };

  const { scripts, errors } = await discoverAndFetchScripts(
    html,
    'https://example.com/page',
    {
      engine: 'vm',
      pluck: {},
      executeScripts: true,
      timeout: 1,
      waitStrategy: 'timeout',
      idleTime: 1,
      pollInterval: 1,
      maxScripts: 64,
      forwardConsole: false,
      permissiveShims: true,
      debugFetch: false,
      debugProbes: false,
    },
    pluckStub as any,
  );

  assert.equal(errors.length, 0);
  assert.equal(scripts.length, 3);
  assert.equal(scripts[0]?.kind, 'inline');
  assert.equal(scripts[1]?.kind, 'inline');
  assert.equal(scripts[2]?.kind, 'external');
  assert.equal(scripts[2]?.isModule, false);
});
