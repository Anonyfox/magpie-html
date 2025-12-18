import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHTML as linkedomParseHTML } from 'linkedom';

import { computeBaseForResolve, patchBaseElementHref, patchDocumentBaseURI } from './base.js';

test('swoop/env/base: without <base>, baseForResolve is finalUrl', () => {
  const { document } = linkedomParseHTML('<html><head></head><body></body></html>', {
    url: 'https://example.com/path',
  });
  const { baseForResolve } = computeBaseForResolve('https://example.com/path', document);
  assert.equal(baseForResolve.href, 'https://example.com/path');
});

test('swoop/env/base: with <base>, patches document.baseURI and base.href to absolute', () => {
  const { document } = linkedomParseHTML(
    '<html><head><base href="/beta-frontend/"></head></html>',
    {
      url: 'https://example.com/',
    },
  );
  const { baseForResolve, baseEl } = computeBaseForResolve('https://example.com/', document);
  patchDocumentBaseURI(document, baseForResolve);
  patchBaseElementHref(baseEl, baseForResolve);

  assert.equal(baseForResolve.href, 'https://example.com/beta-frontend/');
  assert.equal(String((document as any).baseURI), 'https://example.com/beta-frontend/');
  assert.equal(String((baseEl as any).href), 'https://example.com/beta-frontend/');
});
