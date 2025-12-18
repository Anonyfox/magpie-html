import assert from 'node:assert/strict';
import test from 'node:test';

import { installPermissiveShims } from './permissive.js';

test('swoop/env/permissive: installs storage and scrollTo', () => {
  const globalObj: any = {};
  installPermissiveShims(globalObj);
  assert.equal(typeof globalObj.localStorage?.setItem, 'function');
  globalObj.localStorage.setItem('a', '1');
  assert.equal(globalObj.localStorage.getItem('a'), '1');
  assert.equal(typeof globalObj.scrollTo, 'function');
});
