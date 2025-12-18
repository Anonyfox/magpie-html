import assert from 'node:assert/strict';
import test from 'node:test';

import { waitForSettle } from './wait.js';

test('swoop/wait: timeout strategy waits until deadline', async () => {
  let now = 0;
  const sleep = async (ms: number) => {
    now += ms;
  };
  const res = await waitForSettle({
    strategy: 'timeout',
    deadlineMs: 10,
    idleTimeMs: 0,
    pollIntervalMs: 1,
    sleep,
    now: () => now,
    getPendingFetches: () => 0,
    getPendingScriptLoads: () => 0,
    getLastAsyncActivityAt: () => 0,
  });
  assert.equal(res.timedOut, true);
  assert.equal(now, 10);
});

test('swoop/wait: networkidle waits for quiet period after async activity', async () => {
  let now = 0;
  let pendingFetches = 1;
  let lastAsync = 0;
  const sleep = async (ms: number) => {
    now += ms;
    // simulate fetch finishes at t=5
    if (now >= 5 && pendingFetches === 1) {
      pendingFetches = 0;
      lastAsync = now;
    }
  };
  const res = await waitForSettle({
    strategy: 'networkidle',
    deadlineMs: 50,
    idleTimeMs: 10,
    pollIntervalMs: 1,
    sleep,
    now: () => now,
    getPendingFetches: () => pendingFetches,
    getPendingScriptLoads: () => 0,
    getLastAsyncActivityAt: () => lastAsync,
  });
  assert.equal(res.timedOut, false);
  assert.ok(now >= 15);
});
