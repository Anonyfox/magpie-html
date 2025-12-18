import assert from 'node:assert/strict';
import test from 'node:test';

import { createNavigationShims } from './navigation.js';

test('swoop/env/navigation: location updates URL and emits onNavigate', () => {
  const pageUrl = new URL('https://example.com/a');
  const seen: string[] = [];
  const { location } = createNavigationShims({
    pageUrl,
    onNavigate: (href) => seen.push(href),
  });

  location.pathname = '/b';
  assert.equal(String(location.href), 'https://example.com/b');
  assert.deepEqual(seen, ['https://example.com/b']);
});

test('swoop/env/navigation: history.pushState updates URL and calls onPopState', () => {
  const pageUrl = new URL('https://example.com/a');
  const pops: unknown[] = [];
  const { history, location } = createNavigationShims({
    pageUrl,
    onPopState: (s) => pops.push(s),
  });

  history.pushState({ x: 1 }, '', '/c');
  assert.equal(String(location.href), 'https://example.com/c');
  assert.deepEqual(pops, [{ x: 1 }]);
});
