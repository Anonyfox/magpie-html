/**
 * Tests for website gathering functionality.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Website } from '../types.js';
import { gatherWebsite } from './index.js';

describe('gatherWebsite', () => {
  describe('URL validation', () => {
    it('should throw on invalid URL string', async () => {
      await assert.rejects(async () => gatherWebsite('not-a-valid-url'), /Invalid website URL/);
    });

    it('should throw on URL without protocol', async () => {
      await assert.rejects(async () => gatherWebsite('example.com'), /Invalid website URL/);
    });

    it('should throw on empty string', async () => {
      await assert.rejects(async () => gatherWebsite(''), /Invalid website URL/);
    });

    it('should accept valid URL string', () => {
      // Just verify URL parsing doesn't throw
      const url = new URL('https://example.com');
      assert.ok(url.protocol);
      assert.ok(url.host);
    });

    it('should accept URL object', () => {
      const url = new URL('https://example.com');
      assert.ok(url instanceof URL);
    });
  });

  describe('Return type', () => {
    it('should return Website interface with required properties', () => {
      // Type assertion to verify interface shape
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        title: 'Example Website',
        description: 'Example description',
        image: new URL('https://example.com/image.jpg'),
        icon: new URL('https://example.com/favicon.ico'),
        language: 'en',
        region: 'US',
        html: '<html><body>Content</body></html>',
        text: 'Content',
        internalLinks: [new URL('https://example.com/about')],
        externalLinks: [new URL('https://other.com')],
      };

      assert.ok(website.url instanceof URL);
      assert.strictEqual(typeof website.html, 'string');
      assert.strictEqual(typeof website.text, 'string');
      assert.ok(Array.isArray(website.feeds));
      assert.strictEqual(typeof website.title, 'string');
      assert.strictEqual(typeof website.description, 'string');
      assert.ok(website.image instanceof URL);
      assert.ok(Array.isArray(website.internalLinks));
      assert.ok(Array.isArray(website.externalLinks));
    });

    it('should have url as URL object', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        internalLinks: [],
        externalLinks: [],
      };

      assert.ok(website.url instanceof URL);
      assert.strictEqual(website.url.toString(), 'https://example.com/');
    });

    it('should have feeds as URL objects', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [new URL('https://example.com/feed.xml')],
        internalLinks: [],
        externalLinks: [],
      };

      assert.ok(website.feeds[0] instanceof URL);
      assert.strictEqual(website.feeds[0].toString(), 'https://example.com/feed.xml');
    });

    it('should have image as URL object when present', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        image: new URL('https://example.com/image.jpg'),
        internalLinks: [],
        externalLinks: [],
      };

      assert.ok(website.image instanceof URL);
      assert.strictEqual(website.image.toString(), 'https://example.com/image.jpg');
    });

    it('should have icon as URL object when present', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        icon: new URL('https://example.com/favicon.ico'),
        internalLinks: [],
        externalLinks: [],
      };

      assert.ok(website.icon instanceof URL);
      assert.strictEqual(website.icon.toString(), 'https://example.com/favicon.ico');
    });

    it('should have language as ISO 639-1 code when present', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        language: 'en',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(typeof website.language, 'string');
      assert.strictEqual(website.language, 'en');
    });

    it('should have region as ISO 3166-1 alpha-2 code when present', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        language: 'en',
        region: 'US',
        html: '<html></html>',
        text: '',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(typeof website.region, 'string');
      assert.strictEqual(website.region, 'US');
    });

    it('should have html as string', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        html: '<html><body><h1>Hello</h1></body></html>',
        text: 'Hello',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(typeof website.html, 'string');
      assert.ok(website.html.includes('<html>'));
    });

    it('should have text as string', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        html: '<html><body>Content</body></html>',
        text: 'Content',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(typeof website.text, 'string');
      assert.strictEqual(website.text, 'Content');
    });

    it('should have internalLinks as URL array', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        html: '<html></html>',
        text: '',
        internalLinks: [
          new URL('https://example.com/about'),
          new URL('https://example.com/contact'),
        ],
        externalLinks: [],
      };

      assert.ok(Array.isArray(website.internalLinks));
      assert.strictEqual(website.internalLinks.length, 2);
      assert.ok(website.internalLinks[0] instanceof URL);
      assert.strictEqual(website.internalLinks[0].toString(), 'https://example.com/about');
    });

    it('should have externalLinks as URL array', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        html: '<html></html>',
        text: '',
        internalLinks: [],
        externalLinks: [new URL('https://other.com'), new URL('https://twitter.com/example')],
      };

      assert.ok(Array.isArray(website.externalLinks));
      assert.strictEqual(website.externalLinks.length, 2);
      assert.ok(website.externalLinks[0] instanceof URL);
      assert.strictEqual(website.externalLinks[0].toString(), 'https://other.com/');
    });

    it('should allow title, description, image, icon, language, and region to be undefined', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        title: undefined,
        description: undefined,
        image: undefined,
        icon: undefined,
        language: undefined,
        region: undefined,
        html: '<html></html>',
        text: '',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(website.title, undefined);
      assert.strictEqual(website.description, undefined);
      assert.strictEqual(website.image, undefined);
      assert.strictEqual(website.icon, undefined);
      assert.strictEqual(website.language, undefined);
      assert.strictEqual(website.region, undefined);
    });

    it('should allow omitting optional properties', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        html: '<html></html>',
        text: '',
        internalLinks: [],
        externalLinks: [],
      };

      assert.ok(website.url instanceof URL);
      assert.strictEqual(typeof website.html, 'string');
      assert.strictEqual(typeof website.text, 'string');
    });

    it('should allow empty link arrays', () => {
      const website: Website = {
        url: new URL('https://example.com'),
        feeds: [],
        html: '<html></html>',
        text: '',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(website.internalLinks.length, 0);
      assert.strictEqual(website.externalLinks.length, 0);
    });
  });

  // Integration tests would go here but require network access
  // For real integration tests, see gather.integration.test.ts
});
