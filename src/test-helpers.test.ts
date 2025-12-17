import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  getArticle,
  getAtomFeeds,
  getCache,
  getFeed,
  getHomepage,
  getJSONFeeds,
  getRSSFeeds,
} from './test-helpers.js';

describe('Test Helpers - Cache Dictionary', () => {
  describe('loadCache', () => {
    it('should discover all domains', () => {
      const cache = getCache();
      const domains = cache.getDomains();

      assert.ok(domains.length > 0, 'Should find at least one domain');
      assert.ok(domains.includes('techcrunch.com'), 'Should include techcrunch.com');
      assert.ok(domains.includes('blog.rust-lang.org'), 'Should include blog.rust-lang.org');
    });

    it('should load all feeds', () => {
      const cache = getCache();
      const feeds = cache.getAllFeeds();

      assert.ok(feeds.length > 0, 'Should find at least one feed');

      // Check that feeds have correct structure
      for (const feed of feeds) {
        assert.ok(feed.name, 'Feed should have name');
        assert.ok(feed.relativePath, 'Feed should have relative path');
        assert.ok(feed.absolutePath, 'Feed should have absolute path');
        assert.equal(typeof feed.content, 'string', 'Feed content should be string');
        assert.ok(feed.content.length > 0, 'Feed content should not be empty');
      }
    });

    it('should load all articles', () => {
      const cache = getCache();
      const articles = cache.getAllArticles();

      assert.ok(articles.length > 0, 'Should find at least one article');

      for (const article of articles) {
        assert.ok(article.name.endsWith('.html'), 'Article should be HTML file');
        assert.ok(article.content.length > 0, 'Article content should not be empty');
      }
    });

    it('should load all homepages', () => {
      const cache = getCache();
      const homepages = cache.getAllHomepages();

      assert.ok(homepages.length > 0, 'Should find at least one homepage');

      for (const homepage of homepages) {
        assert.equal(homepage.name, 'homepage.html', 'Homepage should be named homepage.html');
        assert.ok(homepage.content.length > 0, 'Homepage content should not be empty');
      }
    });
  });

  describe('getCache', () => {
    it('should return singleton instance', () => {
      const cache1 = getCache();
      const cache2 = getCache();

      assert.equal(cache1, cache2, 'Should return same instance');
    });

    it('should allow domain lookup', () => {
      const cache = getCache();
      const techcrunch = cache.get('techcrunch.com');

      assert.ok(techcrunch, 'Should find techcrunch.com');
      assert.equal(techcrunch.domain, 'techcrunch.com');
      assert.ok(techcrunch.feeds.size > 0, 'Should have feeds');
    });

    it('should return undefined for unknown domain', () => {
      const cache = getCache();
      const unknown = cache.get('nonexistent-domain.com');

      assert.equal(unknown, undefined, 'Should return undefined for unknown domain');
    });
  });

  describe('getFeed', () => {
    it('should get specific feed by domain and name', () => {
      const feed = getFeed('techcrunch.com', 'main.rss.xml');

      assert.ok(feed, 'Should find feed');
      assert.equal(feed.name, 'main.rss.xml');
      assert.ok(feed.content.includes('<rss'), 'Should be RSS content');
    });

    it('should return undefined for unknown feed', () => {
      const feed = getFeed('techcrunch.com', 'nonexistent.xml');

      assert.equal(feed, undefined, 'Should return undefined');
    });
  });

  describe('getArticle', () => {
    it('should get specific article by domain and name', () => {
      const article = getArticle('techcrunch.com', 'google-upi-card-india.html');

      assert.ok(article, 'Should find article');
      assert.equal(article.name, 'google-upi-card-india.html');
      assert.ok(article.content.includes('<html'), 'Should be HTML content');
    });

    it('should return undefined for unknown article', () => {
      const article = getArticle('techcrunch.com', 'nonexistent.html');

      assert.equal(article, undefined, 'Should return undefined');
    });
  });

  describe('getHomepage', () => {
    it('should get homepage by domain', () => {
      const homepage = getHomepage('techcrunch.com');

      assert.ok(homepage, 'Should find homepage');
      assert.equal(homepage.name, 'homepage.html');
      assert.ok(homepage.content.includes('<html'), 'Should be HTML content');
    });

    it('should return undefined for domain without homepage', () => {
      const homepage = getHomepage('nonexistent-domain.com');

      assert.equal(homepage, undefined, 'Should return undefined');
    });
  });

  describe('getRSSFeeds', () => {
    it('should filter only RSS feeds', () => {
      const rssFeeds = getRSSFeeds();

      assert.ok(rssFeeds.length > 0, 'Should find RSS feeds');

      for (const feed of rssFeeds) {
        assert.ok(feed.name.endsWith('.rss.xml'), 'Should only include RSS feeds');
        assert.ok(feed.content.includes('<rss'), 'Should contain RSS content');
      }
    });

    it('should include known RSS feeds', () => {
      const rssFeeds = getRSSFeeds();
      const feedPaths = rssFeeds.map((f) => f.relativePath);

      assert.ok(
        feedPaths.includes('techcrunch.com/feeds/main.rss.xml'),
        'Should include techcrunch RSS feed',
      );
    });
  });

  describe('getAtomFeeds', () => {
    it('should filter only Atom feeds', () => {
      const atomFeeds = getAtomFeeds();

      assert.ok(atomFeeds.length > 0, 'Should find Atom feeds');

      for (const feed of atomFeeds) {
        assert.ok(feed.name.endsWith('.atom.xml'), 'Should only include Atom feeds');
        assert.ok(feed.content.includes('</feed>'), 'Should contain Atom content');
      }
    });

    it('should include known Atom feeds', () => {
      const atomFeeds = getAtomFeeds();
      const feedPaths = atomFeeds.map((f) => f.relativePath);

      assert.ok(
        feedPaths.includes('blog.rust-lang.org/feeds/main.atom.xml'),
        'Should include Rust blog Atom feed',
      );
    });
  });

  describe('getJSONFeeds', () => {
    it('should filter only JSON Feeds', () => {
      const jsonFeeds = getJSONFeeds();

      assert.ok(jsonFeeds.length > 0, 'Should find JSON Feeds');

      for (const feed of jsonFeeds) {
        assert.ok(feed.name.endsWith('.json'), 'Should only include JSON feeds');
        const parsed = JSON.parse(feed.content);
        assert.ok(parsed.version, 'Should have JSON Feed version');
        assert.ok(parsed.items, 'Should have items array');
      }
    });

    it('should include known JSON Feeds', () => {
      const jsonFeeds = getJSONFeeds();
      const feedPaths = jsonFeeds.map((f) => f.relativePath);

      assert.ok(
        feedPaths.includes('daringfireball.net/feeds/main.json'),
        'Should include Daring Fireball JSON feed',
      );
    });
  });

  describe('Lazy loading', () => {
    it('should lazy load content', () => {
      const cache = getCache();
      const techcrunch = cache.get('techcrunch.com');
      const feed = techcrunch?.feeds.get('main.rss.xml');

      assert.ok(feed, 'Should find feed');

      // Access content multiple times - should use cached value
      const content1 = feed.content;
      const content2 = feed.content;

      assert.equal(content1, content2, 'Should return same content');
      assert.ok(content1.length > 0, 'Content should not be empty');
    });
  });

  describe('Path handling', () => {
    it('should provide correct relative paths', () => {
      const feed = getFeed('blog.rust-lang.org', 'main.atom.xml');

      assert.ok(feed, 'Should find feed');
      assert.equal(feed.relativePath, 'blog.rust-lang.org/feeds/main.atom.xml');
    });

    it('should provide absolute paths', () => {
      const feed = getFeed('techcrunch.com', 'main.rss.xml');

      assert.ok(feed, 'Should find feed');
      assert.ok(feed.absolutePath.includes('cache'), 'Absolute path should include cache dir');
      assert.ok(
        feed.absolutePath.endsWith('main.rss.xml'),
        'Absolute path should end with filename',
      );
    });
  });

  describe('Domain structure', () => {
    it('should organize feeds by domain', () => {
      const cache = getCache();
      const rustBlog = cache.get('blog.rust-lang.org');

      assert.ok(rustBlog, 'Should find Rust blog domain');
      assert.equal(rustBlog.domain, 'blog.rust-lang.org');
      assert.ok(rustBlog.feeds.size >= 2, 'Should have multiple feeds');
      assert.ok(rustBlog.feeds.has('main.atom.xml'), 'Should have main feed');
      assert.ok(rustBlog.feeds.has('inside-rust.atom.xml'), 'Should have inside-rust feed');
    });

    it('should organize articles by domain', () => {
      const cache = getCache();
      const techcrunch = cache.get('techcrunch.com');

      assert.ok(techcrunch, 'Should find TechCrunch domain');
      assert.ok(techcrunch.articles.size > 0, 'Should have articles');
    });

    it('should handle homepage per domain', () => {
      const cache = getCache();
      const reactDev = cache.get('react.dev');

      assert.ok(reactDev, 'Should find react.dev domain');
      assert.ok(reactDev.homepage, 'Should have homepage');
      assert.equal(reactDev.homepage.name, 'homepage.html');
    });
  });
});
