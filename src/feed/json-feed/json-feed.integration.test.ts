import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseJSONFeed } from './parse.js';

describe('JSON Feed Integration Tests', () => {
  describe('Daring Fireball Feed', () => {
    it('should parse Daring Fireball JSON Feed', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/daringfireball.net/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      // Verify feed structure
      assert.equal(result.version, '1.1');
      assert.ok(result.feed.title);
      assert.ok(result.feed.title.includes('Daring Fireball'));

      // Verify entries exist
      assert.ok(result.feed.items.length > 0, 'Should have items');

      // Verify required fields
      assert.ok(result.feed.home_page_url);
      assert.ok(result.feed.feed_url);
    });

    it('should extract authors from Daring Fireball', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/daringfireball.net/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      // Feed-level authors
      assert.ok(result.feed.authors, 'Feed should have authors');
      assert.ok(result.feed.authors.length > 0);
      assert.ok(result.feed.authors[0].name?.includes('Gruber'));
    });

    it('should extract items with content from Daring Fireball', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/daringfireball.net/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);
      const firstItem = result.feed.items[0];

      // Verify item has required fields
      assert.ok(firstItem.id);
      assert.ok(firstItem.url);

      // Daring Fireball uses content_html
      assert.ok(firstItem.content_html);

      // Should have dates
      assert.ok(firstItem.date_published);

      // Verify date is valid ISO 8601
      assert.ok(firstItem.date_published.match(/^\d{4}-\d{2}-\d{2}T/));
    });

    it('should handle external_url for linked posts', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/daringfireball.net/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      // Daring Fireball has linked posts with external_url
      const linkedPosts = result.feed.items.filter((item) => item.external_url);
      assert.ok(linkedPosts.length > 0, 'Should have linked posts');

      const linkedPost = linkedPosts[0];
      assert.ok(linkedPost.url);
      assert.ok(linkedPost.external_url);
      assert.notEqual(linkedPost.url, linkedPost.external_url);
    });
  });

  describe('Inessential Feed', () => {
    it('should parse Inessential JSON Feed', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/inessential.com/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      assert.equal(result.version, '1');
      assert.ok(result.feed.title);
      assert.ok(result.feed.items.length > 0);
    });

    it('should extract user_comment from Inessential', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/inessential.com/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      // Inessential includes a user_comment
      assert.ok(result.feed.user_comment);
      assert.ok(result.feed.user_comment.includes('feed reader'));
    });
  });

  describe('Manton.org Feed', () => {
    it('should parse Manton.org JSON Feed', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/www.manton.org/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      assert.equal(result.version, '1');
      assert.ok(result.feed.title);
      assert.ok(result.feed.items.length > 0);
    });

    it('should extract icon from Manton.org', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/www.manton.org/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);

      // Manton.org includes an icon (avatar)
      assert.ok(result.feed.icon);
      assert.ok(result.feed.icon.startsWith('http'));
    });

    it('should handle items with content_html', () => {
      const json = readFileSync(
        join(process.cwd(), 'cache/www.manton.org/feeds/main.json'),
        'utf-8',
      );

      const result = parseJSONFeed(json);
      const firstItem = result.feed.items[0];

      // Should have either content_html or content_text
      assert.ok(firstItem.content_html || firstItem.content_text);

      // Should have dates
      if (firstItem.date_published) {
        assert.ok(firstItem.date_published.match(/^\d{4}-\d{2}-\d{2}T/));
      }
    });
  });

  describe('Shape Of Feed', () => {
    it('should parse Shape Of JSON Feed', () => {
      const json = readFileSync(join(process.cwd(), 'cache/shapeof.com/feeds/main.json'), 'utf-8');

      const result = parseJSONFeed(json);

      assert.equal(result.version, '1');
      assert.ok(result.feed.title);
      assert.ok(result.feed.items.length > 0);
    });
  });

  describe('Cross-feed Consistency', () => {
    it('should parse all cached JSON Feeds without errors', () => {
      const feeds = [
        'cache/daringfireball.net/feeds/main.json',
        'cache/inessential.com/feeds/main.json',
        'cache/www.manton.org/feeds/main.json',
        'cache/shapeof.com/feeds/main.json',
      ];

      for (const feedPath of feeds) {
        const json = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseJSONFeed(json);

        // Every feed should have these required fields
        assert.ok(result.feed.title, `${feedPath}: Feed should have title`);
        assert.ok(Array.isArray(result.feed.items), `${feedPath}: Feed should have items array`);

        // Every item should have required id
        for (const item of result.feed.items) {
          assert.ok(item.id, `${feedPath}: Item should have id`);
        }
      }
    });

    it('should have consistent version detection', () => {
      const feeds = [
        { path: 'cache/daringfireball.net/feeds/main.json', expected: '1.1' },
        { path: 'cache/inessential.com/feeds/main.json', expected: '1' },
        { path: 'cache/www.manton.org/feeds/main.json', expected: '1' },
        { path: 'cache/shapeof.com/feeds/main.json', expected: '1' },
      ];

      for (const { path, expected } of feeds) {
        const json = readFileSync(join(process.cwd(), path), 'utf-8');
        const result = parseJSONFeed(json);

        assert.equal(result.version, expected, `${path}: Version should be ${expected}`);
      }
    });

    it('should preserve all standard fields', () => {
      const feeds = [
        'cache/daringfireball.net/feeds/main.json',
        'cache/inessential.com/feeds/main.json',
        'cache/www.manton.org/feeds/main.json',
        'cache/shapeof.com/feeds/main.json',
      ];

      for (const feedPath of feeds) {
        const json = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseJSONFeed(json);

        // Check that optional fields are preserved if present
        if (result.feed.home_page_url) {
          assert.ok(result.feed.home_page_url.startsWith('http'));
        }
        if (result.feed.feed_url) {
          assert.ok(result.feed.feed_url.startsWith('http'));
        }
        if (result.feed.description) {
          assert.equal(typeof result.feed.description, 'string');
        }
      }
    });

    it('should handle items with various content types', () => {
      const feeds = [
        'cache/daringfireball.net/feeds/main.json',
        'cache/www.manton.org/feeds/main.json',
      ];

      for (const feedPath of feeds) {
        const json = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseJSONFeed(json);

        for (const item of result.feed.items) {
          // Each item should have at least one content field or title
          const hasContent = item.content_html || item.content_text || item.title || item.summary;
          assert.ok(hasContent, `${feedPath}: Item should have some content`);
        }
      }
    });

    it('should validate all dates are ISO 8601', () => {
      const feeds = [
        'cache/daringfireball.net/feeds/main.json',
        'cache/www.manton.org/feeds/main.json',
      ];

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      for (const feedPath of feeds) {
        const json = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseJSONFeed(json);

        for (const item of result.feed.items) {
          if (item.date_published) {
            assert.ok(
              isoDateRegex.test(item.date_published),
              `${feedPath}: date_published should be ISO 8601`,
            );
          }
          if (item.date_modified) {
            assert.ok(
              isoDateRegex.test(item.date_modified),
              `${feedPath}: date_modified should be ISO 8601`,
            );
          }
        }
      }
    });
  });
});
