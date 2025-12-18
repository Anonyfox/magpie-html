import assert from 'node:assert/strict';
import test from 'node:test';

import { runVmEngine } from './vm.js';

test('swoop/engines/vm: snapshots DOM for empty script list (smoke)', async () => {
  const result = await runVmEngine({
    finalUrl: 'data:text/html,hi',
    html: '<!doctype html><html><body><div id="x"></div></body></html>',
    scripts: [],
    options: {
      engine: 'vm',
      pluck: {},
      executeScripts: false,
      timeout: 50,
      waitStrategy: 'timeout',
      idleTime: 10,
      pollInterval: 5,
      maxScripts: 1,
      forwardConsole: false,
      permissiveShims: true,
      debugFetch: false,
      debugProbes: false,
    },
    totalBudgetMs: 50,
    deadline: Date.now() + 50,
    hostFetch: globalThis.fetch,
  });

  assert.ok(result.snapshot.includes('<html'));
});
