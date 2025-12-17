import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRSS, isRSS } from './parse.js';

const CACHE_DIR = join(process.cwd(), 'cache');

describe('RSS Integration Tests - Real World Feeds', () => {
  describe('RND.de RSS Feed', () => {
    it('should parse wirtschaft category feed', () => {
      const feedPath = join(CACHE_DIR, 'rnd.de/feeds/wirtschaft-category.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      assert.ok(isRSS(feedContent), 'Should be detected as RSS');

      const feed = parseRSS(feedContent);

      // Verify structure
      assert.ok(feed.version);
      assert.ok(feed.channel);
      assert.ok(Array.isArray(feed.items));

      // Check channel metadata
      assert.ok(feed.channel.title);
      assert.ok(feed.channel.link);
      assert.ok(feed.channel.description);

      // Should have items
      assert.ok(feed.items.length > 0, 'Should have at least one item');

      // Spot-check first item
      const firstItem = feed.items[0];
      assert.ok(firstItem.title, 'First item should have title');
      assert.ok(firstItem.link, 'First item should have link');
      assert.ok(firstItem.guid, 'First item should have guid');
      assert.ok(firstItem.description, 'First item should have description');
      assert.ok(firstItem.pubDate, 'First item should have pubDate');

      // RND feed may or may not have namespaces - just verify it parsed
      console.log(`RND feed has ${feed.items.length} items`);
    });

    it('should extract specific content from known item', () => {
      const feedPath = join(CACHE_DIR, 'rnd.de/feeds/wirtschaft-category.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');
      const feed = parseRSS(feedContent);

      // Find item about Ifo-Index (if it exists in our snapshot)
      const ifoItem = feed.items.find((item) => item.title?.includes('Ifo-Index'));

      if (ifoItem) {
        assert.ok(ifoItem.title);
        assert.ok(ifoItem.link);
        assert.ok(ifoItem.description);
        assert.ok(ifoItem.pubDate);
        assert.ok(ifoItem.guid);
      }
    });
  });

  describe('FAZ.net RSS Feed', () => {
    it('should parse aktuell feed', () => {
      const feedPath = join(CACHE_DIR, 'faz.net/feeds/aktuell.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);

      // FAZ has Dublin Core and content:encoded
      const firstItem = feed.items[0];
      assert.ok(firstItem.namespaces, 'Should have namespaces');

      if (firstItem.namespaces?.dcCreator) {
        assert.ok(firstItem.namespaces.dcCreator.length > 0);
      }

      if (firstItem.namespaces?.contentEncoded) {
        assert.ok(firstItem.namespaces.contentEncoded.length > 0);
      }
    });
  });

  describe('Süddeutsche Zeitung RSS Feed', () => {
    it('should parse alles feed', () => {
      const feedPath = join(CACHE_DIR, 'sueddeutsche.de/feeds/alles.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel);
      assert.ok(feed.items.length > 0);

      // Check basic structure
      const firstItem = feed.items[0];
      assert.ok(firstItem.title || firstItem.description, 'Item must have title or description');
    });
  });

  describe('n-tv.de RSS Feed', () => {
    it('should parse main feed', () => {
      const feedPath = join(CACHE_DIR, 'n-tv.de/feeds/main.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);

      // Verify items have basic data
      for (const item of feed.items.slice(0, 5)) {
        assert.ok(item.title || item.description);
      }
    });
  });

  describe('LTO.de RSS Feed', () => {
    it('should parse legal news feed', () => {
      const feedPath = join(CACHE_DIR, 'lto.de/feeds/main.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);

      const firstItem = feed.items[0];
      assert.ok(firstItem.link);
    });
  });

  describe('TechCrunch RSS Feed', () => {
    it('should parse tech news feed', () => {
      const feedPath = join(CACHE_DIR, 'techcrunch.com/feeds/main.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);

      // TechCrunch likely has categories
      const itemsWithCategories = feed.items.filter((item) => item.category && item.category.length > 0);
      assert.ok(itemsWithCategories.length > 0, 'Should have items with categories');
    });
  });

  describe('GoodNews.eu RSS Feed', () => {
    it('should parse positive news feed', () => {
      const feedPath = join(CACHE_DIR, 'goodnews.eu/feeds/main.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);
    });
  });

  describe('React.dev RSS Feed', () => {
    it('should parse React blog feed', () => {
      const feedPath = join(CACHE_DIR, 'react.dev/feeds/blog.rss.xml');
      const feedContent = readFileSync(feedPath, 'utf-8');

      const feed = parseRSS(feedContent);

      assert.ok(feed.channel.title);
      assert.ok(feed.channel.link);
      assert.ok(feed.items.length > 0);

      // React blog should have detailed content
      const firstItem = feed.items[0];
      assert.ok(firstItem.title);
      assert.ok(firstItem.link);
    });
  });

  describe('Cross-feed consistency', () => {
    it('should parse all RSS feeds without errors', () => {
      const feeds = [
        'rnd.de/feeds/wirtschaft-category.rss.xml',
        'faz.net/feeds/aktuell.rss.xml',
        'sueddeutsche.de/feeds/alles.rss.xml',
        'n-tv.de/feeds/main.rss.xml',
        'lto.de/feeds/main.rss.xml',
        'techcrunch.com/feeds/main.rss.xml',
        'goodnews.eu/feeds/main.rss.xml',
        'react.dev/feeds/blog.rss.xml',
      ];

      for (const feedPath of feeds) {
        const fullPath = join(CACHE_DIR, feedPath);
        const content = readFileSync(fullPath, 'utf-8');

        // Should parse without throwing
        const feed = parseRSS(content);

        // All feeds should have basic structure
        assert.ok(feed.version, `${feedPath}: should have version`);
        assert.ok(feed.channel, `${feedPath}: should have channel`);
        assert.ok(feed.channel.title, `${feedPath}: should have channel title`);
        assert.ok(feed.channel.link, `${feedPath}: should have channel link`);
        assert.ok(feed.channel.description, `${feedPath}: should have channel description`);
        assert.ok(Array.isArray(feed.items), `${feedPath}: should have items array`);
      }
    });

    it('should handle varying RSS structures gracefully', () => {
      const feeds = [
        'rnd.de/feeds/wirtschaft-category.rss.xml',
        'faz.net/feeds/aktuell.rss.xml',
        'react.dev/feeds/blog.rss.xml',
      ];

      const parsedFeeds = feeds.map((feedPath) => {
        const fullPath = join(CACHE_DIR, feedPath);
        const content = readFileSync(fullPath, 'utf-8');
        return parseRSS(content);
      });

      // All should have items
      for (const feed of parsedFeeds) {
        assert.ok(feed.items.length > 0);
      }

      // Each feed may have different namespaces, but all should parse
      const hasNamespaces = parsedFeeds.map((feed) =>
        feed.items.some((item) => item.namespaces && Object.keys(item.namespaces).length > 0),
      );

      // At least one feed should have namespaces
      assert.ok(hasNamespaces.some((has) => has), 'At least one feed should use namespaces');
    });
  });
});

