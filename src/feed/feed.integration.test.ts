import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { detectFormat, parseFeed, parseFeedNormalized } from './index.js';

describe('Unified Feed Parser Integration Tests', () => {
  describe('Auto-detection with real feeds', () => {
    it('should detect and parse real RSS feeds', () => {
      const feeds = [
        'cache/techcrunch.com/feeds/main.rss.xml',
        'cache/n-tv.de/feeds/main.rss.xml',
        'cache/react.dev/feeds/blog.rss.xml',
      ];

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');

        // Should detect as RSS
        assert.equal(detectFormat(content), 'rss', `${feedPath}: Should detect as RSS`);

        // Should parse successfully
        const result = parseFeed(content);
        assert.equal(result.feed.format, 'rss', `${feedPath}: Should be RSS format`);
        assert.ok(result.feed.title, `${feedPath}: Should have title`);
        assert.ok(result.feed.items.length > 0, `${feedPath}: Should have items`);
      }
    });

    it('should detect and parse real Atom feeds', () => {
      const feeds = [
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
        'cache/golem.de/feeds/main.atom.xml',
      ];

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');

        // Should detect as Atom
        assert.equal(detectFormat(content), 'atom', `${feedPath}: Should detect as Atom`);

        // Should parse successfully
        const result = parseFeed(content);
        assert.equal(result.feed.format, 'atom', `${feedPath}: Should be Atom format`);
        assert.ok(result.feed.title, `${feedPath}: Should have title`);
        assert.ok(result.feed.items.length > 0, `${feedPath}: Should have items`);
      }
    });

    it('should detect and parse real JSON Feeds', () => {
      const feeds = [
        'cache/daringfireball.net/feeds/main.json',
        'cache/inessential.com/feeds/main.json',
        'cache/www.manton.org/feeds/main.json',
      ];

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');

        // Should detect as JSON Feed
        assert.equal(detectFormat(content), 'json-feed', `${feedPath}: Should detect as JSON Feed`);

        // Should parse successfully
        const result = parseFeed(content);
        assert.equal(result.feed.format, 'json-feed', `${feedPath}: Should be JSON Feed format`);
        assert.ok(result.feed.title, `${feedPath}: Should have title`);
        assert.ok(result.feed.items.length > 0, `${feedPath}: Should have items`);
      }
    });
  });

  describe('Normalized output consistency', () => {
    it('should provide consistent interface across all formats', () => {
      const feeds = [
        { path: 'cache/techcrunch.com/feeds/main.rss.xml', format: 'rss' },
        { path: 'cache/blog.rust-lang.org/feeds/main.atom.xml', format: 'atom' },
        { path: 'cache/daringfireball.net/feeds/main.json', format: 'json-feed' },
      ];

      for (const { path: feedPath, format } of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const feed = parseFeedNormalized(content);

        // All should have same basic structure
        assert.equal(feed.format, format, `${feedPath}: Format should match`);
        assert.ok(feed.title, `${feedPath}: Should have title`);
        assert.ok(Array.isArray(feed.items), `${feedPath}: Should have items array`);

        // All items should have id
        for (const item of feed.items) {
          assert.ok(item.id, `${feedPath}: Each item should have id`);
        }
      }
    });

    it('should normalize dates to ISO 8601', () => {
      const feeds = [
        'cache/techcrunch.com/feeds/main.rss.xml', // RSS uses RFC 822
        'cache/blog.rust-lang.org/feeds/main.atom.xml', // Atom uses ISO 8601
        'cache/daringfireball.net/feeds/main.json', // JSON Feed uses ISO 8601
      ];

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const feed = parseFeedNormalized(content);

        for (const item of feed.items) {
          if (item.published) {
            assert.ok(
              isoDateRegex.test(item.published),
              `${feedPath}: Published date should be ISO 8601`,
            );
          }
          if (item.modified) {
            assert.ok(
              isoDateRegex.test(item.modified),
              `${feedPath}: Modified date should be ISO 8601`,
            );
          }
        }
      }
    });

    it('should handle content fields consistently', () => {
      const feeds = [
        'cache/techcrunch.com/feeds/main.rss.xml',
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
        'cache/daringfireball.net/feeds/main.json',
      ];

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const feed = parseFeedNormalized(content);

        for (const item of feed.items) {
          // Should have at least one content field
          const hasContent = item.contentHtml || item.contentText || item.summary || item.title;
          assert.ok(hasContent, `${feedPath}: Item should have some content`);
        }
      }
    });
  });

  describe('Original data preservation', () => {
    it('should preserve format-specific data', () => {
      const feeds = [
        { path: 'cache/techcrunch.com/feeds/main.rss.xml', type: 'RSS' },
        { path: 'cache/blog.rust-lang.org/feeds/main.atom.xml', type: 'Atom' },
        { path: 'cache/daringfireball.net/feeds/main.json', type: 'JSON' },
      ];

      for (const { path: feedPath, type } of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const result = parseFeed(content);

        // Should have original data
        assert.ok(result.original, `${feedPath}: Should preserve original data`);

        // Original should have format-specific structure
        assert.equal(typeof result.original, 'object', `${feedPath}: Original should be object`);
      }
    });
  });

  describe('Cross-format compatibility', () => {
    it('should handle feeds with different item counts', () => {
      const feeds = [
        'cache/techcrunch.com/feeds/main.rss.xml',
        'cache/daringfireball.net/feeds/main.json',
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
      ];

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const feed = parseFeedNormalized(content);

        assert.ok(feed.items.length >= 0, `${feedPath}: Should handle any item count`);

        // Verify each item has required fields
        for (const item of feed.items) {
          assert.ok(item.id, `${feedPath}: Item must have id`);
          assert.equal(typeof item.id, 'string', `${feedPath}: Item id must be string`);
        }
      }
    });

    it('should handle feeds with various optional fields', () => {
      const feeds = [
        'cache/daringfireball.net/feeds/main.json', // Has authors, icons
        'cache/blog.rust-lang.org/feeds/main.atom.xml', // Has authors, links
        'cache/techcrunch.com/feeds/main.rss.xml', // Has images, categories
      ];

      for (const feedPath of feeds) {
        const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
        const feed = parseFeedNormalized(content);

        // Just verify it parses without error
        // Optional fields may or may not be present
        assert.ok(feed, `${feedPath}: Should parse successfully`);
      }
    });
  });

  describe('Performance and robustness', () => {
    it('should handle large feeds efficiently', () => {
      // Daring Fireball has a large feed (153KB)
      const content = readFileSync(
        join(process.cwd(), 'cache/daringfireball.net/feeds/main.json'),
        'utf-8',
      );

      const startTime = Date.now();
      const feed = parseFeedNormalized(content);
      const endTime = Date.now();

      assert.ok(feed.items.length > 0);
      // Should parse large feed reasonably fast (< 1 second)
      assert.ok(endTime - startTime < 1000, 'Should parse large feed in < 1 second');
    });

    it('should handle all cached feeds without errors', () => {
      const allFeeds = [
        // RSS
        'cache/techcrunch.com/feeds/main.rss.xml',
        'cache/n-tv.de/feeds/main.rss.xml',
        'cache/react.dev/feeds/blog.rss.xml',
        'cache/goodnews.eu/feeds/main.rss.xml',
        'cache/rnd.de/feeds/wirtschaft-category.rss.xml',
        // Atom
        'cache/blog.rust-lang.org/feeds/main.atom.xml',
        'cache/blog.rust-lang.org/feeds/inside-rust.atom.xml',
        'cache/golem.de/feeds/main.atom.xml',
        // JSON Feed
        'cache/daringfireball.net/feeds/main.json',
        'cache/inessential.com/feeds/main.json',
        'cache/www.manton.org/feeds/main.json',
        'cache/shapeof.com/feeds/main.json',
      ];

      let successCount = 0;
      for (const feedPath of allFeeds) {
        try {
          const content = readFileSync(join(process.cwd(), feedPath), 'utf-8');
          const feed = parseFeedNormalized(content);
          assert.ok(feed.title);
          assert.ok(Array.isArray(feed.items));
          successCount++;
        } catch (error) {
          assert.fail(`Failed to parse ${feedPath}: ${error}`);
        }
      }

      assert.equal(successCount, allFeeds.length, 'All feeds should parse successfully');
    });
  });
});
