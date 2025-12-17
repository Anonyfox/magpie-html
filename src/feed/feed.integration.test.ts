import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAtomFeeds, getFeed, getJSONFeeds, getRSSFeeds } from '../test-helpers.js';
import { detectFormat, parseFeed, parseFeedNormalized } from './index.js';

describe('Unified Feed Parser Integration Tests', () => {
  describe('Auto-detection with real feeds', () => {
    it('should detect and parse real RSS feeds', () => {
      const testFeeds = [
        { domain: 'techcrunch.com', name: 'main.rss.xml' },
        { domain: 'n-tv.de', name: 'main.rss.xml' },
        { domain: 'react.dev', name: 'blog.rss.xml' },
      ];

      for (const { domain, name } of testFeeds) {
        const feed = getFeed(domain, name);
        assert.ok(feed, `Should find feed: ${domain}/${name}`);

        const content = feed.content;

        // Should detect as RSS
        assert.equal(detectFormat(content), 'rss', `${feed.relativePath}: Should detect as RSS`);

        // Should parse successfully
        const result = parseFeed(content);
        assert.equal(result.feed.format, 'rss', `${feed.relativePath}: Should be RSS format`);
        assert.ok(result.feed.title, `${feed.relativePath}: Should have title`);
        assert.ok(result.feed.items.length > 0, `${feed.relativePath}: Should have items`);
      }
    });

    it('should detect and parse real Atom feeds', () => {
      const testFeeds = [
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml' },
        { domain: 'golem.de', name: 'main.atom.xml' },
      ];

      for (const { domain, name } of testFeeds) {
        const feed = getFeed(domain, name);
        assert.ok(feed, `Should find feed: ${domain}/${name}`);

        const content = feed.content;

        // Should detect as Atom
        assert.equal(detectFormat(content), 'atom', `${feed.relativePath}: Should detect as Atom`);

        // Should parse successfully
        const result = parseFeed(content);
        assert.equal(result.feed.format, 'atom', `${feed.relativePath}: Should be Atom format`);
        assert.ok(result.feed.title, `${feed.relativePath}: Should have title`);
        assert.ok(result.feed.items.length > 0, `${feed.relativePath}: Should have items`);
      }
    });

    it('should detect and parse real JSON Feeds', () => {
      const testFeeds = [
        { domain: 'daringfireball.net', name: 'main.json' },
        { domain: 'inessential.com', name: 'main.json' },
        { domain: 'www.manton.org', name: 'main.json' },
      ];

      for (const { domain, name } of testFeeds) {
        const feed = getFeed(domain, name);
        assert.ok(feed, `Should find feed: ${domain}/${name}`);

        const content = feed.content;

        // Should detect as JSON Feed
        assert.equal(
          detectFormat(content),
          'json-feed',
          `${feed.relativePath}: Should detect as JSON Feed`,
        );

        // Should parse successfully
        const result = parseFeed(content);
        assert.equal(
          result.feed.format,
          'json-feed',
          `${feed.relativePath}: Should be JSON Feed format`,
        );
        assert.ok(result.feed.title, `${feed.relativePath}: Should have title`);
        assert.ok(result.feed.items.length > 0, `${feed.relativePath}: Should have items`);
      }
    });
  });

  describe('Normalized output consistency', () => {
    it('should provide consistent interface across all formats', () => {
      const testFeeds = [
        { domain: 'techcrunch.com', name: 'main.rss.xml', format: 'rss' as const },
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml', format: 'atom' as const },
        { domain: 'daringfireball.net', name: 'main.json', format: 'json-feed' as const },
      ];

      for (const { domain, name, format } of testFeeds) {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);

        const feed = parseFeedNormalized(feedFile.content);

        // All should have same basic structure
        assert.equal(feed.format, format, `${feedFile.relativePath}: Format should match`);
        assert.ok(feed.title, `${feedFile.relativePath}: Should have title`);
        assert.ok(Array.isArray(feed.items), `${feedFile.relativePath}: Should have items array`);

        // All items should have id
        for (const item of feed.items) {
          assert.ok(item.id, `${feedFile.relativePath}: Each item should have id`);
        }
      }
    });

    it('should normalize dates to ISO 8601', () => {
      const testFeeds = [
        { domain: 'techcrunch.com', name: 'main.rss.xml' }, // RSS uses RFC 822
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml' }, // Atom uses ISO 8601
        { domain: 'daringfireball.net', name: 'main.json' }, // JSON Feed uses ISO 8601
      ];

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      for (const { domain, name } of testFeeds) {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);

        const feed = parseFeedNormalized(feedFile.content);

        for (const item of feed.items) {
          if (item.published) {
            assert.ok(
              isoDateRegex.test(item.published),
              `${feedFile.relativePath}: Published date should be ISO 8601`,
            );
          }
          if (item.modified) {
            assert.ok(
              isoDateRegex.test(item.modified),
              `${feedFile.relativePath}: Modified date should be ISO 8601`,
            );
          }
        }
      }
    });

    it('should handle content fields consistently', () => {
      const testFeeds = [
        { domain: 'techcrunch.com', name: 'main.rss.xml' },
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml' },
        { domain: 'daringfireball.net', name: 'main.json' },
      ];

      for (const { domain, name } of testFeeds) {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);

        const feed = parseFeedNormalized(feedFile.content);

        for (const item of feed.items) {
          // Should have at least one content field
          const hasContent = item.contentHtml || item.contentText || item.summary || item.title;
          assert.ok(hasContent, `${feedFile.relativePath}: Item should have some content`);
        }
      }
    });
  });

  describe('Original data preservation', () => {
    it('should preserve format-specific data', () => {
      const testFeeds = [
        { domain: 'techcrunch.com', name: 'main.rss.xml' },
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml' },
        { domain: 'daringfireball.net', name: 'main.json' },
      ];

      for (const { domain, name } of testFeeds) {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);

        const result = parseFeed(feedFile.content);

        // Should have original data
        assert.ok(result.original, `${feedFile.relativePath}: Should preserve original data`);

        // Original should have format-specific structure
        assert.equal(
          typeof result.original,
          'object',
          `${feedFile.relativePath}: Original should be object`,
        );
      }
    });
  });

  describe('Cross-format compatibility', () => {
    it('should handle feeds with different item counts', () => {
      const testFeeds = [
        { domain: 'techcrunch.com', name: 'main.rss.xml' },
        { domain: 'daringfireball.net', name: 'main.json' },
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml' },
      ];

      for (const { domain, name } of testFeeds) {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);

        const feed = parseFeedNormalized(feedFile.content);

        assert.ok(feed.items.length >= 0, `${feedFile.relativePath}: Should handle any item count`);

        // Verify each item has required fields
        for (const item of feed.items) {
          assert.ok(item.id, `${feedFile.relativePath}: Item must have id`);
          assert.equal(
            typeof item.id,
            'string',
            `${feedFile.relativePath}: Item id must be string`,
          );
        }
      }
    });

    it('should handle feeds with various optional fields', () => {
      const testFeeds = [
        { domain: 'daringfireball.net', name: 'main.json' }, // Has authors, icons
        { domain: 'blog.rust-lang.org', name: 'main.atom.xml' }, // Has authors, links
        { domain: 'techcrunch.com', name: 'main.rss.xml' }, // Has images, categories
      ];

      for (const { domain, name } of testFeeds) {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);

        const feed = parseFeedNormalized(feedFile.content);

        // Just verify it parses without error
        // Optional fields may or may not be present
        assert.ok(feed, `${feedFile.relativePath}: Should parse successfully`);
      }
    });
  });

  describe('Robustness', () => {
    it('should handle all cached feeds without errors', () => {
      // Get all feeds dynamically from cache
      const rssFeeds = getRSSFeeds();
      const atomFeeds = getAtomFeeds();
      const jsonFeeds = getJSONFeeds();
      const allFeeds = [...rssFeeds, ...atomFeeds, ...jsonFeeds];

      assert.ok(allFeeds.length > 0, 'Should have feeds in cache');

      let successCount = 0;
      for (const feedFile of allFeeds) {
        try {
          const feed = parseFeedNormalized(feedFile.content);
          assert.ok(feed.title, `${feedFile.relativePath}: Should have title`);
          assert.ok(Array.isArray(feed.items), `${feedFile.relativePath}: Should have items array`);
          successCount++;
        } catch (error) {
          assert.fail(`Failed to parse ${feedFile.relativePath}: ${error}`);
        }
      }

      assert.equal(successCount, allFeeds.length, 'All feeds should parse successfully');
    });
  });
});
