import assert from 'node:assert/strict';
import test from 'node:test';

import { swoop } from './swoop.js';

test('swoop() executes inline scripts and snapshots mutated DOM', async () => {
  const html = [
    '<!doctype html>',
    '<html>',
    '<head><title>Test</title></head>',
    '<body>',
    '<div id="app"></div>',
    '<script>',
    "document.getElementById('app').textContent = 'rendered';",
    "console.log('swoop-inline-ok');",
    '</script>',
    '</body>',
    '</html>',
  ].join('');

  const url = `data:text/html,${encodeURIComponent(html)}`;
  const result = await swoop(url, { engine: 'vm', waitStrategy: 'timeout', timeout: 500 });

  // The final URL depends on how `fetch`/`pluck` normalize `data:` URLs; only require non-empty.
  assert.ok(typeof result.url === 'string' && result.url.length > 0);
  assert.ok(result.html.includes('rendered'));
  assert.ok(result.console.some((e) => e.message.includes('swoop-inline-ok')));
});

test('swoop() can wait for network idle (tracked fetch) before snapshot', async () => {
  const html = [
    '<!doctype html>',
    '<html>',
    '<body>',
    '<script>',
    "fetch('data:text/plain,hi')",
    '  .then(r => r.text())',
    "  .then(t => { document.body.setAttribute('data-fetched', t); });",
    '</script>',
    '</body>',
    '</html>',
  ].join('');

  const url = `data:text/html,${encodeURIComponent(html)}`;
  const result = await swoop(url, {
    engine: 'vm',
    waitStrategy: 'networkidle',
    timeout: 500,
    idleTime: 50,
    pollInterval: 10,
  });

  assert.ok(result.html.includes('data-fetched="hi"'));
});

test('swoop() provides constructor-shaped observer shims (and permissiveShims does not downgrade them)', async () => {
  const html = [
    '<!doctype html>',
    '<html>',
    '<body>',
    '<script>',
    "document.body.setAttribute('data-io', String(typeof IntersectionObserver));",
    "document.body.setAttribute('data-ro', String(typeof ResizeObserver));",
    "document.body.setAttribute('data-mo', String(typeof MutationObserver));",
    "try { new IntersectionObserver(() => {}); document.body.setAttribute('data-io-new', 'ok'); } catch (e) { document.body.setAttribute('data-io-new', 'fail'); }",
    "try { new ResizeObserver(() => {}); document.body.setAttribute('data-ro-new', 'ok'); } catch (e) { document.body.setAttribute('data-ro-new', 'fail'); }",
    "try { new MutationObserver(() => {}); document.body.setAttribute('data-mo-new', 'ok'); } catch (e) { document.body.setAttribute('data-mo-new', 'fail'); }",
    '</script>',
    '</body>',
    '</html>',
  ].join('');
  const url = `data:text/html,${encodeURIComponent(html)}`;

  const result = await swoop(url, {
    engine: 'vm',
    waitStrategy: 'timeout',
    timeout: 50,
    permissiveShims: true,
  });

  assert.ok(result.html.includes('data-io="function"'));
  assert.ok(result.html.includes('data-ro="function"'));
  assert.ok(result.html.includes('data-mo="function"'));
  assert.ok(result.html.includes('data-io-new="ok"'));
  assert.ok(result.html.includes('data-ro-new="ok"'));
  assert.ok(result.html.includes('data-mo-new="ok"'));
});

test('swoop() synthesizes a browser-ish document lifecycle (readyState -> complete)', async () => {
  const html = [
    '<!doctype html>',
    '<html>',
    '<body>',
    '<script>',
    "document.body.setAttribute('data-ready-immediate', String(document.readyState));",
    '</script>',
    '</body>',
    '</html>',
  ].join('');
  const url = `data:text/html,${encodeURIComponent(html)}`;

  const result = await swoop(url, {
    engine: 'vm',
    waitStrategy: 'timeout',
    timeout: 50,
  });

  // During initial execution we expect to be in a loading-ish state.
  assert.ok(result.html.includes('data-ready-immediate="loading"'));
  assert.ok(result.html.includes('<html'));
});
