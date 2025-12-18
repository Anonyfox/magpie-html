import assert from 'node:assert/strict';
import test from 'node:test';

import { emitDebugProbes, installDebugProbes } from './probes.js';

test('swoop/probes: installs stats and emits debug snapshot', () => {
  const globalObj: any = {
    document: {
      querySelector: () => null,
      documentElement: null,
    },
    Node: () => {},
    Element: () => {},
    MutationObserver: class {
      observe() {}
    },
  };
  globalObj.Node.prototype = {};
  globalObj.Element.prototype = {};

  installDebugProbes({
    globalObj,
    hostSetTimeout: () => {},
  });

  let emitted = '';
  emitDebugProbes(globalObj, (args) => {
    emitted = String(args[0]) + String(args[1]);
  });
  assert.ok(emitted.includes('[swoop probes]'));
});
