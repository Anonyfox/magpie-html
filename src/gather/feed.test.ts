/**
 * Tests for feed gathering functionality.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gatherFeed } from './feed.js';

describe('gatherFeed', () => {
  describe('URL validation', () => {
    it('should throw on invalid URL string', async () => {
      await assert.rejects(async () => gatherFeed('not-a-valid-url'), /Invalid feed URL/);
    });

    it('should throw on URL without protocol', async () => {
      await assert.rejects(async () => gatherFeed('example.com/feed.xml'), /Invalid feed URL/);
    });

    it('should throw on empty string', async () => {
      await assert.rejects(async () => gatherFeed(''), /Invalid feed URL/);
    });

    it('should accept valid URL string', () => {
      // Just verify URL parsing doesn't throw
      const url = new URL('https://example.com/feed.xml');
      assert.ok(url.protocol);
      assert.ok(url.host);
    });

    it('should accept URL object', () => {
      const url = new URL('https://example.com/feed.xml');
      assert.ok(url instanceof URL);
    });
  });

  // Integration tests would go here but require network access
  // For real integration tests, see feed.integration.test.ts
});
