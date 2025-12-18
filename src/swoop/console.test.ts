import assert from 'node:assert/strict';
import test from 'node:test';

import { createConsoleCapture } from './console.js';

test('swoop/console: captures entries and formats error props', () => {
  const cap = createConsoleCapture(() => 123);
  const err: any = new Error('boom');
  err.code = 42;
  cap.record('error', [err]);

  assert.equal(cap.entries.length, 1);
  assert.equal(cap.entries[0]?.time, 123);
  assert.ok(cap.entries[0]?.message.includes('Error: boom'));
  assert.ok(cap.entries[0]?.message.includes('props:'));
});
