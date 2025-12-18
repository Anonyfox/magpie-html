import assert from 'node:assert/strict';
import test from 'node:test';

import { installXMLHttpRequest } from './xhr.js';

test('swoop/env/xhr: basic GET loads responseText and calls onload', async () => {
  let loaded = false;
  const globalObj: any = {};

  installXMLHttpRequest({
    globalObj,
    resolveUrl: (u) => u,
    remainingMs: () => 1000,
    hostSetTimeout: (cb, _ms) => {
      // don't actually timeout in this test
      return setTimeout(cb, 0);
    },
    hostClearTimeout: (h) => clearTimeout(h),
    fetch: async (url: any) => {
      assert.equal(String(url), 'https://example.com/hi');
      return new Response('ok');
    },
  });

  const xhr = new globalObj.XMLHttpRequest();
  xhr.open('GET', 'https://example.com/hi', true);
  xhr.onload = () => {
    loaded = true;
  };
  xhr.send();

  // wait a tick for async send()
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(xhr.status, 200);
  assert.equal(xhr.responseText, 'ok');
  assert.equal(loaded, true);
});
