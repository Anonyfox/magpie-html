import assert from 'node:assert/strict';
import test from 'node:test';

import { createScriptLoader } from './loader.js';

function makeScriptEl(src: string, type?: string) {
  const listeners: Record<string, number> = {};
  return {
    tagName: 'SCRIPT',
    src: '',
    type: type ?? '',
    getAttribute: (name: string) => {
      if (name === 'src') return src;
      if (name === 'type') return type ?? null;
      return null;
    },
    dispatchEvent: (ev: any) => {
      listeners[String(ev?.type)] = (listeners[String(ev?.type)] ?? 0) + 1;
      return true;
    },
    __listeners: listeners,
  };
}

test('swoop/scripts/loader: resolves src against base and executes classic scripts', async () => {
  const head: any = {
    appendChild(node: any) {
      return node;
    },
  };
  const globalObj: any = {
    document: { head, body: null },
    Event: class {
      constructor(public type: string) {}
    },
  };

  const calls: string[] = [];
  const loader = createScriptLoader({
    globalObj,
    pageUrlHref: 'https://example.com/page',
    baseForResolveHref: 'https://example.com/base/',
    remainingMs: () => 1000,
    hostSetTimeout: (cb) => cb(),
    totalBudgetMs: 10,
    maxDebugEvents: 100,
    debug: () => {},
    onError: () => {},
    noteAsyncActivity: () => {},
    fetchText: async (url: string) => {
      calls.push(`fetch:${url}`);
      return 'console.log(1)';
    },
    runClassicScript: (_code: string, filename: string) => {
      calls.push(`run:${filename}`);
    },
    runModuleScript: async () => {},
  });

  loader.install();
  const el = makeScriptEl('./x.js');
  head.appendChild(el);

  // load is async (fetchText await), even though scheduling is immediate in this test
  await new Promise((r) => setTimeout(r, 0));

  assert.deepEqual(calls, [
    'fetch:https://example.com/base/x.js',
    'run:https://example.com/base/x.js',
  ]);
  assert.equal(loader.getPendingScriptLoads(), 0);
});

test('swoop/scripts/loader: module scripts call runModuleScript', async () => {
  const head: any = {
    appendChild(node: any) {
      return node;
    },
  };
  const globalObj: any = {
    document: { head, body: null },
    Event: class {
      constructor(public type: string) {}
    },
  };

  const calls: string[] = [];
  const loader = createScriptLoader({
    globalObj,
    pageUrlHref: 'https://example.com/page',
    baseForResolveHref: 'https://example.com/base/',
    remainingMs: () => 1000,
    hostSetTimeout: (cb) => cb(),
    totalBudgetMs: 10,
    maxDebugEvents: 100,
    debug: () => {},
    onError: () => {},
    noteAsyncActivity: () => {},
    fetchText: async () => 'x',
    runClassicScript: () => {},
    runModuleScript: async (url: string) => {
      calls.push(url);
    },
  });

  loader.install();
  const el = makeScriptEl('./m.js', 'module');
  head.appendChild(el);
  assert.deepEqual(calls, ['https://example.com/base/m.js']);
});

test('swoop/scripts/loader: setAttribute("src") triggers load', async () => {
  const head: any = {
    appendChild(node: any) {
      return node;
    },
  };
  const ElementProto: any = {
    setAttribute(name: string, value: string) {
      (this as any)[`attr:${name}`] = value;
    },
  };
  const globalObj: any = {
    document: { head, body: null },
    Element: { prototype: ElementProto },
    Event: class {
      constructor(public type: string) {}
    },
  };

  const calls: string[] = [];
  const loader = createScriptLoader({
    globalObj,
    pageUrlHref: 'https://example.com/page',
    baseForResolveHref: 'https://example.com/base/',
    remainingMs: () => 1000,
    hostSetTimeout: (cb) => cb(),
    totalBudgetMs: 10,
    maxDebugEvents: 100,
    debug: () => {},
    onError: () => {},
    noteAsyncActivity: () => {},
    fetchText: async (url: string) => {
      calls.push(url);
      return 'x';
    },
    runClassicScript: () => {},
    runModuleScript: async () => {},
  });
  loader.install();

  const scriptEl: any = {
    tagName: 'SCRIPT',
    getAttribute: (n: string) => (n === 'src' ? (scriptEl as any)['attr:src'] : null),
    dispatchEvent: () => true,
  };
  Object.setPrototypeOf(scriptEl, ElementProto);

  // inserted without src, then src set later
  head.appendChild(scriptEl);
  scriptEl.setAttribute('src', './late.js');

  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(calls, ['https://example.com/base/late.js']);
});
