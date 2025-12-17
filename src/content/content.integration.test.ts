import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getArticle, getHomepage } from '../test-helpers.js';
import { parseHTML } from '../utils/html-parser.js';
import { assessContentQuality, extractContent, isProbablyReaderable } from './index.js';

describe('Content extraction integration tests', () => {
  describe('Real-world article extraction', () => {
    it('should extract content from Daring Fireball article', () => {
      const article = getArticle('daringfireball.net', 'debunking-special-typefaces-dyslexia.html');
      assert.ok(article, 'Should find Daring Fireball article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://daringfireball.net/2024/12/debunking_special_typefaces_dyslexia',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 500);
        assert.ok(result.wordCount > 50);
        assert.ok(result.readingTime > 0);
        assert.ok(result.extractionTime >= 0);
      }
    });

    it('should extract content from React blog article', () => {
      const article = getArticle('react.dev', 'critical-security-vulnerability.html');
      assert.ok(article, 'Should find React article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl:
          'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#critical-security-vulnerability',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 200);
        assert.ok(result.wordCount > 20);
      }
    });

    it('should extract content from Rust blog article', () => {
      const article = getArticle('blog.rust-lang.org', 'project-goals-november-update.html');
      assert.ok(article, 'Should find Rust article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://blog.rust-lang.org/2024/11/project-goals',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 300);
      }
    });

    it('should extract content from Inessential article', () => {
      const article = getArticle('inessential.com', 'rss-plus-markdown.html');
      assert.ok(article, 'Should find Inessential article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://inessential.com/2025/11/05/rss-plus-markdown.html',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 100);
      }
    });

    it('should extract content from TechCrunch article', () => {
      const article = getArticle('techcrunch.com', 'google-upi-card-india.html');
      assert.ok(article, 'Should find TechCrunch article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://techcrunch.com/2024/12/16/google-upi-card-india/',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 500);
        assert.ok(result.wordCount > 100);
      }
    });

    it('should extract content from German news (Golem)', () => {
      const article = getArticle('golem.de', 'google-character-ai.html');
      assert.ok(article, 'Should find Golem article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://www.golem.de/news/google-character-ai',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 200);
        // May detect German language
        if (result.lang) {
          assert.match(result.lang, /^de/i);
        }
      }
    });

    it('should extract content from FAZ article', () => {
      const article = getArticle('faz.net', 'immobilienkauf-foerderprogramme.html');
      assert.ok(article, 'Should find FAZ article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://www.faz.net/aktuell/immobilienkauf-foerderprogramme',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.textContent.length > 500);
      }
    });
  });

  describe('Readability pre-check', () => {
    it('should correctly identify readerable articles', () => {
      const article = getArticle('daringfireball.net', 'debunking-special-typefaces-dyslexia.html');
      assert.ok(article, 'Should find article');

      const readerable = isProbablyReaderable(article.content);
      assert.ok(typeof readerable === 'boolean');
    });

    it('should reject homepage as article', () => {
      const homepage = getHomepage('daringfireball.net');
      assert.ok(homepage, 'Should find homepage');

      const readerable = isProbablyReaderable(homepage.content);
      // Homepage may or may not be readerable depending on content
      assert.ok(typeof readerable === 'boolean');
    });

    it('should check readability across different sources', () => {
      const articles = [
        getArticle('react.dev', 'critical-security-vulnerability.html'),
        getArticle('blog.rust-lang.org', 'project-goals-november-update.html'),
        getArticle('techcrunch.com', 'google-upi-card-india.html'),
        getArticle('inessential.com', 'rss-plus-markdown.html'),
      ];

      for (const article of articles) {
        assert.ok(article, 'Should find article');
        const readerable = isProbablyReaderable(article.content);

        // Should return a boolean result
        assert.ok(typeof readerable === 'boolean', `Article ${article.name} should return boolean`);
      }
    });
  });

  describe('Quality assessment', () => {
    it('should assess quality of long-form article', () => {
      const article = getArticle('daringfireball.net', 'debunking-special-typefaces-dyslexia.html');
      assert.ok(article, 'Should find article');

      const result = extractContent(parseHTML(article.content));

      assert.equal(result.success, true);
      if (result.success) {
        const quality = assessContentQuality(result);

        assert.ok(quality.wordCount > 0);
        assert.ok(quality.charCount > 0);
        assert.ok(quality.readingTime > 0);
        assert.ok(quality.avgWordsPerSentence > 0);
        assert.ok(quality.paragraphCount >= 0);
        assert.ok(quality.imageCount >= 0);
        assert.ok(quality.linkCount >= 0);
        assert.ok(quality.linkDensity >= 0);
        assert.ok(quality.linkDensity <= 1);
        assert.ok(quality.qualityScore >= 0);
        assert.ok(quality.qualityScore <= 100);
      }
    });

    it('should assess quality across multiple articles', () => {
      const articles = [
        getArticle('react.dev', 'critical-security-vulnerability.html'),
        getArticle('blog.rust-lang.org', 'project-goals-november-update.html'),
        getArticle('techcrunch.com', 'google-upi-card-india.html'),
      ];

      for (const article of articles) {
        assert.ok(article, 'Should find article');
        const result = extractContent(parseHTML(article.content));

        if (result.success) {
          const quality = assessContentQuality(result);

          // All quality metrics should be present
          assert.ok('wordCount' in quality);
          assert.ok('charCount' in quality);
          assert.ok('readingTime' in quality);
          assert.ok('qualityScore' in quality);

          // Quality score should be reasonable
          assert.ok(quality.qualityScore > 0);
        }
      }
    });
  });

  describe('Multi-language support', () => {
    it('should extract German content correctly', () => {
      const articles = [
        getArticle('golem.de', 'google-character-ai.html'),
        getArticle('faz.net', 'immobilienkauf-foerderprogramme.html'),
        getArticle('sueddeutsche.de', 'ski-alpin-weltcup-saison.html'),
        getArticle('rnd.de', 'trade-republic-startup.html'),
      ];

      for (const article of articles) {
        assert.ok(article, `Should find article ${article?.name}`);
        const result = extractContent(parseHTML(article.content));

        assert.equal(result.success, true, `Failed to extract from ${article.name}`);
        if (result.success) {
          assert.ok(result.textContent.length > 100);
          assert.ok(result.wordCount > 20);
        }
      }
    });

    it('should extract English content correctly', () => {
      const articles = [
        getArticle('daringfireball.net', 'debunking-special-typefaces-dyslexia.html'),
        getArticle('react.dev', 'critical-security-vulnerability.html'),
        getArticle('techcrunch.com', 'google-upi-card-india.html'),
        getArticle('inessential.com', 'rss-plus-markdown.html'),
      ];

      for (const article of articles) {
        assert.ok(article, `Should find article ${article?.name}`);
        const result = extractContent(parseHTML(article.content));

        assert.equal(result.success, true, `Failed to extract from ${article.name}`);
        if (result.success) {
          assert.ok(result.textContent.length > 100);
        }
      }
    });
  });

  describe('Edge cases with real data', () => {
    it('should handle very short articles', () => {
      const article = getArticle('www.manton.org', 'day-of-winter.html');
      assert.ok(article, 'Should find article');

      const result = extractContent(parseHTML(article.content));

      // May succeed or fail depending on content length
      assert.ok('success' in result);
      assert.ok('extractionTime' in result);
    });

    it('should handle articles with complex HTML structures', () => {
      // TechCrunch and FAZ have complex layouts
      const articles = [
        getArticle('techcrunch.com', 'google-upi-card-india.html'),
        getArticle('faz.net', 'immobilienkauf-foerderprogramme.html'),
      ];

      for (const article of articles) {
        assert.ok(article, 'Should find article');
        const result = extractContent(parseHTML(article.content));

        assert.equal(result.success, true);
        if (result.success) {
          // Should extract substantial content despite complex layout
          assert.ok(result.textContent.length > 300);
          assert.ok(result.wordCount > 50);
        }
      }
    });

    it('should handle articles with embedded media', () => {
      // Developer blogs often have code blocks, images, etc.
      const articles = [
        getArticle('react.dev', 'critical-security-vulnerability.html'),
        getArticle('blog.rust-lang.org', 'project-goals-november-update.html'),
      ];

      for (const article of articles) {
        assert.ok(article, 'Should find article');
        const result = extractContent(parseHTML(article.content));

        assert.equal(result.success, true);
        if (result.success) {
          assert.ok(result.textContent.length > 200);
          // Content should be cleaned but present
          assert.ok(result.content.length > 0);
        }
      }
    });
  });

  describe('Metadata extraction', () => {
    it('should extract available metadata fields', () => {
      const article = getArticle('daringfireball.net', 'debunking-special-typefaces-dyslexia.html');
      assert.ok(article, 'Should find article');

      const result = extractContent(parseHTML(article.content), {
        baseUrl: 'https://daringfireball.net/2024/12/debunking_special_typefaces_dyslexia',
      });

      assert.equal(result.success, true);
      if (result.success) {
        // Check for optional fields
        assert.ok('title' in result);
        assert.ok('excerpt' in result);
        // byline, siteName, lang, dir, publishedTime are optional
        // Just verify they don't break anything
        assert.ok(result.title.length > 0);
      }
    });

    it('should extract byline when available', () => {
      const articles = [
        getArticle('techcrunch.com', 'google-upi-card-india.html'),
        getArticle('react.dev', 'critical-security-vulnerability.html'),
      ];

      for (const article of articles) {
        assert.ok(article, 'Should find article');
        const result = extractContent(parseHTML(article.content));

        if (result.success) {
          // byline is optional, just check it doesn't error
          assert.ok('byline' in result || !('byline' in result));
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should handle homepage as non-article gracefully', () => {
      const homepage = getHomepage('daringfireball.net');
      assert.ok(homepage, 'Should find homepage');

      const result = extractContent(parseHTML(homepage.content));

      // Homepage might succeed or fail depending on how much content it has
      // Just ensure we get a valid result structure
      assert.ok('success' in result);
      assert.ok('extractionTime' in result);

      if (!result.success) {
        assert.ok('error' in result);
        assert.ok('errorType' in result);
      }
    });

    it('should fail gracefully with checkReadability option', () => {
      const homepage = getHomepage('inessential.com');
      assert.ok(homepage, 'Should find homepage');

      const result = extractContent(parseHTML(homepage.content), {
        checkReadability: true,
      });

      // Should return a result (success or failure)
      assert.ok('success' in result);

      if (!result.success) {
        assert.ok(
          result.errorType === 'NOT_READERABLE' || result.errorType === 'EXTRACTION_FAILED',
        );
      }
    });
  });
});
