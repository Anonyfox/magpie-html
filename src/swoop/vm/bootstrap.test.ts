import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import {
  defineWindowInContext,
  ensureRealmFunctionIntrinsic,
  installRealmWrappers,
} from './bootstrap.js';

test('swoop/vm/bootstrap: installs realm wrappers that call delegates', () => {
  const g: any = {
    __swoop_setTimeout: () => 123,
    __swoop_fetch: (u: string) => `ok:${u}`,
  };
  const context = vm.createContext(g);
  defineWindowInContext(context);
  ensureRealmFunctionIntrinsic(context);
  installRealmWrappers(context);

  const t = vm.runInContext('setTimeout(() => {}, 0)', context);
  assert.equal(t, 123);

  const r = vm.runInContext('fetch("x")', context);
  assert.equal(r, 'ok:x');
});
