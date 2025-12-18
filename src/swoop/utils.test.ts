import assert from 'node:assert/strict';
import test from 'node:test';

import { isNodeRuntime, normalizeInit, sleep } from './utils.js';

test('swoop/utils: isNodeRuntime() is true under node', () => {
  assert.equal(isNodeRuntime(), true);
});

test('swoop/utils: sleep() resolves', async () => {
  const start = Date.now();
  await sleep(5);
  assert.ok(Date.now() >= start);
});

test('swoop/utils: normalizeInit() applies defaults', () => {
  const n = normalizeInit();
  assert.equal(n.engine, 'vm');
  assert.equal(n.executeScripts, true);
  assert.equal(n.timeout, 3000);
  assert.equal(n.waitStrategy, 'networkidle');
  assert.equal(n.idleTime, 250);
  assert.equal(n.pollInterval, 25);
  assert.equal(n.maxScripts, 64);
  assert.equal(n.forwardConsole, false);
  assert.equal(n.permissiveShims, true);
  assert.equal(n.debugFetch, false);
  assert.equal(n.debugProbes, false);
  assert.deepEqual(n.pluck, {});
});

test('swoop/utils: normalizeInit() respects overrides', () => {
  const n = normalizeInit({
    engine: 'vm',
    executeScripts: false,
    timeout: 123,
    waitStrategy: 'timeout',
    idleTime: 1,
    pollInterval: 2,
    maxScripts: 3,
    forwardConsole: true,
    permissiveShims: false,
    debugFetch: true,
    debugProbes: true,
    pluck: { timeout: 999 },
  });
  assert.equal(n.engine, 'vm');
  assert.equal(n.executeScripts, false);
  assert.equal(n.timeout, 123);
  assert.equal(n.waitStrategy, 'timeout');
  assert.equal(n.idleTime, 1);
  assert.equal(n.pollInterval, 2);
  assert.equal(n.maxScripts, 3);
  assert.equal(n.forwardConsole, true);
  assert.equal(n.permissiveShims, false);
  assert.equal(n.debugFetch, true);
  assert.equal(n.debugProbes, true);
  assert.deepEqual(n.pluck, { timeout: 999 });
});
