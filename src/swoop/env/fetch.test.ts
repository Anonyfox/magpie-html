import assert from 'node:assert/strict';
import test from 'node:test';

import { installFetchShim } from './fetch.js';

test('swoop/env/fetch: resolves relative URLs against base', async () => {
  const globalObj: any = {};
  const calls: string[] = [];

  const shim = installFetchShim({
    globalObj,
    hostFetch: async (url: any) => {
      calls.push(String(url));
      return new Response('ok');
    },
    baseForResolveHref: 'https://example.com/base/',
    remainingMs: () => 1000,
    hostSetTimeout: (cb) => setTimeout(cb, 0),
    hostClearTimeout: (h) => clearTimeout(h),
    noteAsyncActivity: () => {},
    debugFetch: false,
    recordDebug: () => {},
    queueMicrotask: (cb) => queueMicrotask(cb),
  });

  await globalObj.__swoop_fetch('./x', {});
  assert.deepEqual(calls, ['https://example.com/base/x']);
  assert.equal(shim.getPendingFetches(), 0);
});
