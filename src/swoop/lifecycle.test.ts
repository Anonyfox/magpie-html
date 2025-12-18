import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { synthesizeLifecycle } from './lifecycle.js';

test('swoop/lifecycle: drives readyState to complete and dispatches key events', () => {
  const docEvents: string[] = [];
  const winEvents: string[] = [];

  const globalObj: any = {
    Event: class Event {
      constructor(public type: string) {}
    },
    document: {
      readyState: 'loading',
      dispatchEvent: (ev: any) => {
        docEvents.push(String(ev?.type));
        return true;
      },
    },
    window: {
      dispatchEvent: (ev: any) => {
        winEvents.push(String(ev?.type));
        return true;
      },
    },
    history: { state: null },
    location: { href: 'x' },
    PopStateEvent: class PopStateEvent {
      constructor(public type: string) {}
    },
    HashChangeEvent: class HashChangeEvent {
      constructor(public type: string) {}
    },
  };
  globalObj.window.window = globalObj.window;

  const context = vm.createContext(globalObj);
  synthesizeLifecycle(context, 50);

  assert.equal(globalObj.document.readyState, 'complete');
  assert.ok(docEvents.includes('DOMContentLoaded'));
  assert.ok(winEvents.includes('load'));
});
