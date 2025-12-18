import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHTML as linkedomParseHTML } from 'linkedom';

import { installCookieJar } from './cookie.js';

test('swoop/env/cookie: installCookieJar appends cookies', () => {
  const { document } = linkedomParseHTML('<html></html>', { url: 'https://example.com/' });
  installCookieJar(document);
  (document as any).cookie = 'a=1';
  (document as any).cookie = 'b=2';
  assert.equal(String((document as any).cookie), 'a=1; b=2');
});
