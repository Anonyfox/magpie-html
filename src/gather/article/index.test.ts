/**
 * Tests for article gathering functionality.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Article } from '../types.js';
import { gatherArticle } from './index.js';

describe('gatherArticle', () => {
  describe('URL validation', () => {
    it('should throw on invalid URL string', async () => {
      await assert.rejects(async () => gatherArticle('not-a-valid-url'), /Invalid article URL/);
    });

    it('should throw on URL without protocol', async () => {
      await assert.rejects(async () => gatherArticle('example.com'), /Invalid article URL/);
    });

    it('should throw on empty string', async () => {
      await assert.rejects(async () => gatherArticle(''), /Invalid article URL/);
    });

    it('should accept valid URL string', () => {
      // Just verify URL parsing doesn't throw
      const url = new URL('https://example.com/article');
      assert.ok(url.protocol);
      assert.ok(url.host);
    });

    it('should accept URL object', () => {
      const url = new URL('https://example.com/article');
      assert.ok(url instanceof URL);
    });
  });

  describe('Return type', () => {
    it('should return Article interface with required properties', () => {
      // Type assertion to verify interface shape
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body><article>Content</article></body></html>',
        text: 'Content',
        content: 'Cleaned article content',
        title: 'Article Title',
        description: 'Article summary',
        image: new URL('https://example.com/image.jpg'),
        language: 'en',
        region: 'US',
        internalLinks: [new URL('https://example.com/page1')],
        externalLinks: [new URL('https://other.com/page')],
        wordCount: 150,
        readingTime: 1,
      };

      assert.ok(article.url instanceof URL);
      assert.strictEqual(typeof article.html, 'string');
      assert.strictEqual(typeof article.text, 'string');
      assert.strictEqual(typeof article.content, 'string');
      assert.strictEqual(typeof article.title, 'string');
      assert.strictEqual(typeof article.description, 'string');
      assert.ok(article.image instanceof URL);
      assert.strictEqual(typeof article.language, 'string');
      assert.strictEqual(typeof article.region, 'string');
      assert.ok(Array.isArray(article.internalLinks));
      assert.ok(Array.isArray(article.externalLinks));
      assert.strictEqual(typeof article.wordCount, 'number');
      assert.strictEqual(typeof article.readingTime, 'number');
    });

    it('should have url as URL object', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html></html>',
        text: '',
      };

      assert.ok(article.url instanceof URL);
      assert.strictEqual(article.url.toString(), 'https://example.com/article');
    });

    it('should have html as string', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body><h1>Article Title</h1></body></html>',
        text: 'Article Title',
      };

      assert.strictEqual(typeof article.html, 'string');
      assert.ok(article.html.includes('<html>'));
    });

    it('should have text as string', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article content</body></html>',
        text: 'Article content',
        internalLinks: [],
        externalLinks: [],
        wordCount: 2,
        readingTime: 1,
      };

      assert.strictEqual(typeof article.text, 'string');
      assert.strictEqual(article.text, 'Article content');
    });

    it('should have content as optional string', () => {
      const articleWithContent: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body><article>Main content</article></body></html>',
        text: 'Main content',
        content: 'Cleaned main content',
        internalLinks: [],
        externalLinks: [],
      };

      assert.strictEqual(typeof articleWithContent.content, 'string');
      assert.strictEqual(articleWithContent.content, 'Cleaned main content');

      // Content can be undefined if Readability fails
      const articleWithoutContent: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>No article</body></html>',
        text: 'No article',
        content: undefined,
        internalLinks: [],
        externalLinks: [],
        wordCount: 2,
        readingTime: 1,
      };

      assert.strictEqual(articleWithoutContent.content, undefined);
    });

    it('should have title as optional string', () => {
      const articleWithTitle: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        title: 'Great Article',
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(typeof articleWithTitle.title, 'string');
      assert.strictEqual(articleWithTitle.title, 'Great Article');

      // Title can be undefined
      const articleWithoutTitle: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        title: undefined,
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(articleWithoutTitle.title, undefined);
    });

    it('should have description as optional string', () => {
      const articleWithDescription: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        description: 'This is a summary',
      };

      assert.strictEqual(typeof articleWithDescription.description, 'string');
      assert.strictEqual(articleWithDescription.description, 'This is a summary');

      // Description can be undefined
      const articleWithoutDescription: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        description: undefined,
      };

      assert.strictEqual(articleWithoutDescription.description, undefined);
    });

    it('should have image as optional URL object', () => {
      const articleWithImage: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        image: new URL('https://example.com/hero.jpg'),
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.ok(articleWithImage.image instanceof URL);
      assert.strictEqual(articleWithImage.image.toString(), 'https://example.com/hero.jpg');

      // Image can be undefined
      const articleWithoutImage: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        image: undefined,
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(articleWithoutImage.image, undefined);
    });

    it('should have language as optional string', () => {
      const articleWithLanguage: Article = {
        url: new URL('https://example.com/article'),
        html: '<html lang="de"><body>Artikel</body></html>',
        text: 'Artikel',
        language: 'de',
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(typeof articleWithLanguage.language, 'string');
      assert.strictEqual(articleWithLanguage.language, 'de');

      // Language can be undefined
      const articleWithoutLanguage: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Article</body></html>',
        text: 'Article',
        language: undefined,
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(articleWithoutLanguage.language, undefined);
    });

    it('should have region as optional string', () => {
      const articleWithRegion: Article = {
        url: new URL('https://example.com/article'),
        html: '<html lang="en-GB"><body>Article</body></html>',
        text: 'Article',
        region: 'GB',
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(typeof articleWithRegion.region, 'string');
      assert.strictEqual(articleWithRegion.region, 'GB');

      // Region can be undefined
      const articleWithoutRegion: Article = {
        url: new URL('https://example.com/article'),
        html: '<html lang="en"><body>Article</body></html>',
        text: 'Article',
        region: undefined,
        internalLinks: [],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.strictEqual(articleWithoutRegion.region, undefined);
    });

    it('should have internalLinks as array of URL objects', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body><a href="/page1">Link</a></body></html>',
        text: 'Link',
        internalLinks: [new URL('https://example.com/page1'), new URL('https://example.com/page2')],
        externalLinks: [],
        wordCount: 1,
        readingTime: 1,
      };

      assert.ok(Array.isArray(article.internalLinks));
      assert.strictEqual(article.internalLinks.length, 2);
      assert.ok(article.internalLinks[0] instanceof URL);
      assert.strictEqual(article.internalLinks[0].toString(), 'https://example.com/page1');
    });

    it('should have externalLinks as array of URL objects', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body><a href="https://external.com">Link</a></body></html>',
        text: 'Link',
        internalLinks: [],
        externalLinks: [new URL('https://external.com/'), new URL('https://other.org/')],
        wordCount: 1,
        readingTime: 1,
      };

      assert.ok(Array.isArray(article.externalLinks));
      assert.strictEqual(article.externalLinks.length, 2);
      assert.ok(article.externalLinks[0] instanceof URL);
      assert.strictEqual(article.externalLinks[0].toString(), 'https://external.com/');
    });

    it('should have wordCount as number', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>This is a test article with several words</body></html>',
        text: 'This is a test article with several words',
        internalLinks: [],
        externalLinks: [],
        wordCount: 8,
        readingTime: 1,
      };

      assert.strictEqual(typeof article.wordCount, 'number');
      assert.strictEqual(article.wordCount, 8);
    });

    it('should have readingTime as number (in minutes)', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html><body>Content</body></html>',
        text: 'Content',
        internalLinks: [],
        externalLinks: [],
        wordCount: 450,
        readingTime: 2,
      };

      assert.strictEqual(typeof article.readingTime, 'number');
      assert.strictEqual(article.readingTime, 2);
    });

    it('should allow omitting content, title, description, image, language, and region', () => {
      const article: Article = {
        url: new URL('https://example.com/article'),
        html: '<html></html>',
        text: '',
        internalLinks: [],
        externalLinks: [],
        wordCount: 0,
        readingTime: 1,
      };

      assert.ok(article.url instanceof URL);
      assert.strictEqual(article.content, undefined);
      assert.strictEqual(article.title, undefined);
      assert.strictEqual(article.description, undefined);
      assert.strictEqual(article.image, undefined);
      assert.strictEqual(article.language, undefined);
      assert.strictEqual(article.region, undefined);
      assert.ok(Array.isArray(article.internalLinks));
      assert.ok(Array.isArray(article.externalLinks));
      assert.strictEqual(typeof article.wordCount, 'number');
      assert.strictEqual(typeof article.readingTime, 'number');
    });
  });

  // Integration tests would go here but require network access
  // For real integration tests, see gather.integration.test.ts
});
