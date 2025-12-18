import assert from 'node:assert/strict';
import test from 'node:test';

import { installAsyncEnv } from './async.js';

test('swoop/env/async: installs delegates and updates lastAsyncActivityAt', async () => {
  const globalObj: any = {
    __swoopStats: {
      timers: {
        timeoutScheduled: 0,
        timeoutFired: 0,
        intervalScheduled: 0,
        intervalFired: 0,
        rafScheduled: 0,
        rafFired: 0,
      },
    },
  };
  const env = installAsyncEnv({ globalObj, debugProbes: true });
  const before = env.getLastAsyncActivityAt();

  let fired = false;
  globalObj.__swoop_setTimeout(() => {
    fired = true;
  }, 1);

  await new Promise((r) => setTimeout(r, 10));

  assert.equal(fired, true);
  assert.ok(env.getLastAsyncActivityAt() >= before);
  env.cleanup();
});
