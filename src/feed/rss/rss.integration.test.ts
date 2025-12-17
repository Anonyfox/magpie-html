import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getFeed } from '../../test-helpers.js';
import { isRSS, parseRSS } from './parse.js';

describe('RSS Integration Tests - Real World Feeds', () => {
  describe('RND.de RSS Feed', () => {
    it('should parse wirtschaft category feed', () => {
      const feedFile = getFeed('rnd.de', 'wirtschaft-category.rss.xml');
      assert.ok(feedFile, 'Should find RND feed');

      assert.ok(isRSS(feedFile.content), 'Should be detected as RSS');

      const feed = parseRSS(feedFile.content);

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
      const feedFile = getFeed('rnd.de', 'wirtschaft-category.rss.xml');
      assert.ok(feedFile, 'Should find RND feed');

      const feed = parseRSS(feedFile.content);

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
      const feedFile = getFeed('faz.net', 'aktuell.rss.xml');
      assert.ok(feedFile, 'Should find FAZ feed');

      const feed = parseRSS(feedFile.content);

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
      const feedFile = getFeed('sueddeutsche.de', 'alles.rss.xml');
      assert.ok(feedFile, 'Should find Süddeutsche feed');

      const feed = parseRSS(feedFile.content);

      assert.ok(feed.channel);
      assert.ok(feed.items.length > 0);

      // Check basic structure
      const firstItem = feed.items[0];
      assert.ok(firstItem.title || firstItem.description, 'Item must have title or description');
    });
  });

  describe('n-tv.de RSS Feed', () => {
    it('should parse main feed', () => {
      const feedFile = getFeed('n-tv.de', 'main.rss.xml');
      assert.ok(feedFile, 'Should find n-tv feed');

      const feed = parseRSS(feedFile.content);

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
      const feedFile = getFeed('lto.de', 'main.rss.xml');
      assert.ok(feedFile, 'Should find LTO feed');

      const feed = parseRSS(feedFile.content);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);

      const firstItem = feed.items[0];
      assert.ok(firstItem.link);
    });
  });

  describe('TechCrunch RSS Feed', () => {
    it('should parse tech news feed', () => {
      const feedFile = getFeed('techcrunch.com', 'main.rss.xml');
      assert.ok(feedFile, 'Should find TechCrunch feed');

      const feed = parseRSS(feedFile.content);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);

      // TechCrunch likely has categories
      const itemsWithCategories = feed.items.filter(
        (item) => item.category && item.category.length > 0,
      );
      assert.ok(itemsWithCategories.length > 0, 'Should have items with categories');
    });
  });

  describe('GoodNews.eu RSS Feed', () => {
    it('should parse positive news feed', () => {
      const feedFile = getFeed('goodnews.eu', 'main.rss.xml');
      assert.ok(feedFile, 'Should find GoodNews feed');

      const feed = parseRSS(feedFile.content);

      assert.ok(feed.channel.title);
      assert.ok(feed.items.length > 0);
    });
  });

  describe('React.dev RSS Feed', () => {
    it('should parse React blog feed', () => {
      const feedFile = getFeed('react.dev', 'blog.rss.xml');
      assert.ok(feedFile, 'Should find React blog feed');

      const feed = parseRSS(feedFile.content);

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
    it('should parse all RSS feeds without errors', async () => {
      const { getRSSFeeds } = await import('../../test-helpers.js');
      const rssFeeds = getRSSFeeds();

      assert.ok(rssFeeds.length > 0, 'Should have RSS feeds in cache');

      for (const feedFile of rssFeeds) {
        // Should parse without throwing
        const feed = parseRSS(feedFile.content);

        // All feeds should have basic structure
        assert.ok(feed.version, `${feedFile.relativePath}: should have version`);
        assert.ok(feed.channel, `${feedFile.relativePath}: should have channel`);
        assert.ok(feed.channel.title, `${feedFile.relativePath}: should have channel title`);
        assert.ok(feed.channel.link, `${feedFile.relativePath}: should have channel link`);
        assert.ok(
          feed.channel.description,
          `${feedFile.relativePath}: should have channel description`,
        );
        assert.ok(Array.isArray(feed.items), `${feedFile.relativePath}: should have items array`);
      }
    });

    it('should handle varying RSS structures gracefully', () => {
      const testFeeds = [
        { domain: 'rnd.de', name: 'wirtschaft-category.rss.xml' },
        { domain: 'faz.net', name: 'aktuell.rss.xml' },
        { domain: 'react.dev', name: 'blog.rss.xml' },
      ];

      const parsedFeeds = testFeeds.map(({ domain, name }) => {
        const feedFile = getFeed(domain, name);
        assert.ok(feedFile, `Should find feed: ${domain}/${name}`);
        return parseRSS(feedFile.content);
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
      assert.ok(
        hasNamespaces.some((has) => has),
        'At least one feed should use namespaces',
      );
    });
  });
});
