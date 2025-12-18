import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHTML as linkedomParseHTML } from 'linkedom';

import { installBrowserShims } from './browser.js';

test('swoop/env/browser: installs core shims', () => {
  const { window, document } = linkedomParseHTML('<html><body><div id="x"></div></body></html>', {
    url: 'https://example.com/',
  });
  const globalObj: any = Object.create(window);
  globalObj.document = document;

  installBrowserShims({
    globalObj,
    domWindow: window,
    document,
    documentBaseUriForDom: 'https://example.com/base/',
  });

  assert.equal(typeof globalObj.matchMedia, 'function');
  assert.equal(typeof globalObj.getComputedStyle, 'function');
  assert.equal(typeof globalObj.NodeFilter?.SHOW_COMMENT, 'number');
  assert.doesNotThrow(() => new globalObj.IntersectionObserver(() => {}));
});
