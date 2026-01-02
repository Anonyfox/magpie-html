/**
 * Sitemap parser tests
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { isSitemap, parseSitemap } from './parse.js';

describe('parseSitemap', () => {
  describe('standard sitemap', () => {
    it('should parse a basic sitemap with URLs', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
          </url>
          <url>
            <loc>https://example.com/page2</loc>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.type, 'urlset');
      assert.equal(result.isIndex, false);
      assert.equal(result.sitemap.urls.length, 2);
      assert.equal(result.sitemap.urls[0].loc, 'https://example.com/page1');
      assert.equal(result.sitemap.urls[1].loc, 'https://example.com/page2');
    });

    it('should parse URLs with all optional fields', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
            <lastmod>2024-01-15T10:30:00+00:00</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.8</priority>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls.length, 1);
      const url = result.sitemap.urls[0];
      assert.equal(url.loc, 'https://example.com/page1');
      assert.equal(url.lastmod, '2024-01-15T10:30:00+00:00');
      assert.equal(url.changefreq, 'weekly');
      assert.equal(url.priority, 0.8);
    });

    it('should handle relative URLs with base URL', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>/page1</loc>
          </url>
        </urlset>`;

      const result = parseSitemap(xml, 'https://example.com/sitemap.xml');

      assert.equal(result.sitemap.urls[0].loc, 'https://example.com/page1');
    });

    it('should handle empty sitemap', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.type, 'urlset');
      assert.equal(result.sitemap.urls.length, 0);
    });
  });

  describe('sitemap index', () => {
    it('should parse a sitemap index', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sitemap1.xml</loc>
            <lastmod>2024-01-15</lastmod>
          </sitemap>
          <sitemap>
            <loc>https://example.com/sitemap2.xml</loc>
          </sitemap>
        </sitemapindex>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.type, 'sitemapindex');
      assert.equal(result.isIndex, true);
      assert.equal(result.sitemap.sitemaps.length, 2);
      assert.equal(result.sitemap.sitemaps[0].loc, 'https://example.com/sitemap1.xml');
      assert.equal(result.sitemap.sitemaps[0].lastmod, '2024-01-15');
      assert.equal(result.sitemap.sitemaps[1].loc, 'https://example.com/sitemap2.xml');
      assert.equal(result.sitemap.sitemaps[1].lastmod, undefined);
    });
  });

  describe('Google News extension', () => {
    it('should parse Google News sitemap', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
          <url>
            <loc>https://example.com/article1</loc>
            <news:news>
              <news:publication>
                <news:name>Example News</news:name>
                <news:language>en</news:language>
              </news:publication>
              <news:publication_date>2024-01-15T10:30:00+00:00</news:publication_date>
              <news:title>Breaking News Article</news:title>
            </news:news>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls.length, 1);
      const url = result.sitemap.urls[0];
      assert.ok(url.news);
      assert.equal(url.news.publication?.name, 'Example News');
      assert.equal(url.news.publication?.language, 'en');
      assert.equal(url.news.publicationDate, '2024-01-15T10:30:00+00:00');
      assert.equal(url.news.title, 'Breaking News Article');
    });

    it('should parse news keywords and stock tickers', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
          <url>
            <loc>https://example.com/article1</loc>
            <news:news>
              <news:title>Stock Market News</news:title>
              <news:keywords>stocks, market, trading</news:keywords>
              <news:stock_tickers>NASDAQ:GOOGL, NYSE:IBM</news:stock_tickers>
            </news:news>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      const news = result.sitemap.urls[0].news;
      assert.ok(news);
      assert.deepEqual(news.keywords, ['stocks', 'market', 'trading']);
      assert.deepEqual(news.stockTickers, ['NASDAQ:GOOGL', 'NYSE:IBM']);
    });

    it('should decode XML entities in title', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
          <url>
            <loc>https://example.com/article1</loc>
            <news:news>
              <news:title>Tom &amp; Jerry: A &quot;Classic&quot; Story</news:title>
            </news:news>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls[0].news?.title, 'Tom & Jerry: A "Classic" Story');
    });
  });

  describe('Image extension', () => {
    it('should parse image sitemap extension', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
          <url>
            <loc>https://example.com/page1</loc>
            <image:image>
              <image:loc>https://example.com/images/photo1.jpg</image:loc>
              <image:caption>A beautiful sunset</image:caption>
              <image:title>Sunset Photo</image:title>
              <image:geo_location>San Francisco, CA</image:geo_location>
              <image:license>https://example.com/license</image:license>
            </image:image>
            <image:image>
              <image:loc>https://example.com/images/photo2.jpg</image:loc>
            </image:image>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      const images = result.sitemap.urls[0].images;
      assert.ok(images);
      assert.equal(images.length, 2);
      assert.equal(images[0].loc, 'https://example.com/images/photo1.jpg');
      assert.equal(images[0].caption, 'A beautiful sunset');
      assert.equal(images[0].title, 'Sunset Photo');
      assert.equal(images[0].geoLocation, 'San Francisco, CA');
      assert.equal(images[1].loc, 'https://example.com/images/photo2.jpg');
    });
  });

  describe('Video extension', () => {
    it('should parse video sitemap extension', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
          <url>
            <loc>https://example.com/videos/cooking</loc>
            <video:video>
              <video:thumbnail_loc>https://example.com/thumbs/cooking.jpg</video:thumbnail_loc>
              <video:title>Cooking Tutorial</video:title>
              <video:description>Learn to cook pasta</video:description>
              <video:content_loc>https://example.com/videos/cooking.mp4</video:content_loc>
              <video:duration>300</video:duration>
              <video:rating>4.5</video:rating>
              <video:view_count>1000</video:view_count>
              <video:family_friendly>yes</video:family_friendly>
              <video:category>Cooking</video:category>
              <video:tag>pasta</video:tag>
              <video:tag>italian</video:tag>
            </video:video>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      const videos = result.sitemap.urls[0].videos;
      assert.ok(videos);
      assert.equal(videos.length, 1);
      assert.equal(videos[0].thumbnailLoc, 'https://example.com/thumbs/cooking.jpg');
      assert.equal(videos[0].title, 'Cooking Tutorial');
      assert.equal(videos[0].description, 'Learn to cook pasta');
      assert.equal(videos[0].contentLoc, 'https://example.com/videos/cooking.mp4');
      assert.equal(videos[0].duration, 300);
      assert.equal(videos[0].rating, 4.5);
      assert.equal(videos[0].viewCount, 1000);
      assert.equal(videos[0].familyFriendly, true);
      assert.equal(videos[0].category, 'Cooking');
      assert.deepEqual(videos[0].tags, ['pasta', 'italian']);
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle XML with comments', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <!-- This is a comment -->
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <!-- Another comment -->
          <url>
            <loc>https://example.com/page1</loc>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls.length, 1);
    });

    it('should handle malformed priority gracefully', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
            <priority>not-a-number</priority>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls[0].priority, undefined);
    });

    it('should handle CDATA in content', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
          <url>
            <loc>https://example.com/article1</loc>
            <news:news>
              <news:title><![CDATA[Breaking: <Important> News & Updates]]></news:title>
            </news:news>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls[0].news?.title, 'Breaking: <Important> News & Updates');
    });

    it('should handle missing namespace prefixes', () => {
      // Some sitemaps don't use namespace prefixes
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/page1</loc>
            <lastmod>2024-01-15</lastmod>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      assert.equal(result.sitemap.urls.length, 1);
      assert.equal(result.sitemap.urls[0].lastmod, '2024-01-15');
    });

    it('should be forgiving with whitespace', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>
              https://example.com/page1
            </loc>
          </url>
        </urlset>`;

      const result = parseSitemap(xml);

      // loc should be trimmed
      assert.equal(result.sitemap.urls[0].loc, 'https://example.com/page1');
    });
  });
});

describe('isSitemap', () => {
  it('should return true for urlset sitemap', () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com</loc></url>
      </urlset>`;

    assert.equal(isSitemap(xml), true);
  });

  it('should return true for sitemap index', () => {
    const xml = `<?xml version="1.0"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>https://example.com/sitemap.xml</loc></sitemap>
      </sitemapindex>`;

    assert.equal(isSitemap(xml), true);
  });

  it('should return false for RSS', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel><title>Test</title></channel>
      </rss>`;

    assert.equal(isSitemap(xml), false);
  });

  it('should return false for Atom', () => {
    const xml = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test</title>
      </feed>`;

    assert.equal(isSitemap(xml), false);
  });

  it('should return false for empty string', () => {
    assert.equal(isSitemap(''), false);
  });

  it('should return false for null/undefined', () => {
    assert.equal(isSitemap(null as unknown as string), false);
    assert.equal(isSitemap(undefined as unknown as string), false);
  });
});
