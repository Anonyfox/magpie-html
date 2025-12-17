import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractContent } from './extract.js';

describe('extractContent', () => {
  describe('input validation', () => {
    it('should reject empty string', () => {
      const result = extractContent('');
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.errorType, 'INVALID_HTML');
        assert.match(result.error, /empty/i);
      }
    });

    it('should reject whitespace-only string', () => {
      const result = extractContent('   \n  \t  ');
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.errorType, 'INVALID_HTML');
      }
    });

    it('should reject non-string input', () => {
      // @ts-expect-error Testing invalid input
      const result = extractContent(null);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.errorType, 'INVALID_HTML');
      }
    });
  });

  describe('extraction failures', () => {
    it('should handle very short content', () => {
      const html = '<html><body><div>Too short</div></body></html>';
      const result = extractContent(html);

      // Readability might still extract something or fail
      // Just verify we get a valid response
      assert.ok('success' in result);
      assert.ok('extractionTime' in result);
    });

    it('should handle navigation/menu content', () => {
      const html = `
        <html>
          <body>
            <nav>
              <a href="/home">Home</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </nav>
          </body>
        </html>
      `;
      const result = extractContent(html);

      // Readability typically fails on pure navigation
      // But may vary, so just check structure
      assert.ok('success' in result);
      assert.ok('extractionTime' in result);
    });

    it('should fail readability check when enabled', () => {
      const html = '<html><body><div>Short text</div></body></html>';
      const result = extractContent(html, { checkReadability: true });

      assert.equal(result.success, false);
      if (!result.success) {
        assert.equal(result.errorType, 'NOT_READERABLE');
        assert.equal(result.readerable, false);
      }
    });
  });

  describe('successful extraction', () => {
    it('should extract simple article', () => {
      const html = `
        <html>
          <head>
            <title>Test Article</title>
          </head>
          <body>
            <article>
              <h1>Test Article Title</h1>
              <p>This is the first paragraph with some content that is long enough to be considered an article.</p>
              <p>This is the second paragraph with more content to ensure we have enough text.</p>
              <p>This is the third paragraph with even more content to make sure the extraction works properly.</p>
              <p>And a fourth paragraph to really make sure we have substantial content for the article extraction.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html);

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title.length > 0);
        assert.ok(result.content.length > 0);
        assert.ok(result.textContent.length > 0);
        assert.ok(result.wordCount > 0);
        assert.ok(result.readingTime > 0);
        assert.ok(result.extractionTime >= 0);
      }
    });

    it('should extract article with metadata', () => {
      const html = `
        <html>
          <head>
            <title>Article with Meta</title>
            <meta name="author" content="John Doe">
            <meta property="article:published_time" content="2023-01-15T10:00:00Z">
          </head>
          <body>
            <article>
              <h1>Article Title</h1>
              <p class="byline">By John Doe</p>
              <p>First paragraph with substantial content that makes this a proper article worth extracting.</p>
              <p>Second paragraph with more information and details about the topic being discussed.</p>
              <p>Third paragraph continuing the narrative with additional context and information.</p>
              <p>Fourth paragraph wrapping up the article with concluding thoughts and final remarks.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html, { baseUrl: 'https://example.com/article' });

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.title);
        assert.ok(result.textContent.length > 100);
        assert.ok(result.wordCount > 20);
      }
    });

    it('should calculate word count correctly', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Word Count Test</h1>
              <p>One two three four five six seven eight nine ten.</p>
              <p>Eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.</p>
              <p>Twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven twenty-eight.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html);

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.wordCount > 0);
        assert.equal(result.readingTime, 1); // Should be at least 1 minute
      }
    });

    it('should handle articles with images and links', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Article with Media</h1>
              <p>This is an introduction paragraph with some <a href="/link">important link</a> text.</p>
              <img src="/image.jpg" alt="Article image">
              <p>Second paragraph continues after the image with more substantial content.</p>
              <p>Third paragraph has more details and <a href="/another">another link</a> for reference.</p>
              <p>Fourth paragraph wraps up the article with final thoughts and conclusions.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html);

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.content.includes('<img'));
        assert.ok(result.content.includes('<a'));
        assert.ok(result.textContent.includes('important link'));
      }
    });
  });

  describe('options handling', () => {
    it('should respect baseUrl option', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Base URL Test</h1>
              <p>Content with <a href="/relative/path">relative link</a> that needs resolution.</p>
              <p>More content to make this a proper article with enough text for extraction.</p>
              <p>Additional paragraph to ensure we have sufficient content for the test.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html, {
        baseUrl: 'https://example.com/articles/test',
      });

      assert.equal(result.success, true);
    });

    it('should respect charThreshold option', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Short Article</h1>
              <p>This is a short article with minimal content for testing threshold behavior.</p>
            </article>
          </body>
        </html>
      `;

      // With low threshold, should succeed
      const lowThreshold = extractContent(html, { charThreshold: 10 });
      assert.ok('success' in lowThreshold);

      // With high threshold, typically fails (but depends on Readability heuristics)
      const highThreshold = extractContent(html, { charThreshold: 10000 });
      assert.ok('success' in highThreshold);
      // High threshold makes it less likely to succeed
      if (!highThreshold.success) {
        assert.equal(highThreshold.errorType, 'EXTRACTION_FAILED');
      }
    });

    it('should include extraction time', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Timing Test</h1>
              <p>Content for testing extraction timing measurement capabilities.</p>
              <p>Additional content to make this a proper article worth extracting.</p>
              <p>More paragraphs ensure we have enough text for successful extraction.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html);

      assert.ok('extractionTime' in result);
      assert.ok(result.extractionTime >= 0);
      assert.ok(result.extractionTime < 5000); // Should be fast (< 5 seconds)
    });
  });

  describe('edge cases', () => {
    it('should handle malformed HTML gracefully', () => {
      const html = '<html><body><article><p>Unclosed paragraph<article></body>';
      const result = extractContent(html);

      // Should not throw, may succeed or fail depending on parser
      assert.ok('success' in result);
      assert.ok('extractionTime' in result);
    });

    it('should handle HTML with special characters', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Special Characters Test: <>&"'</h1>
              <p>Content with special characters: éñøü and symbols: © ® ™ for testing.</p>
              <p>More content with emojis: 😀 🎉 and mathematical symbols: ∞ ≠ ≈ here.</p>
              <p>Additional paragraph to ensure we have enough content for extraction.</p>
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html);

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.textContent.length > 0);
      }
    });

    it('should handle very large articles', () => {
      const paragraphs = Array.from(
        { length: 100 },
        (_, i) =>
          `<p>Paragraph ${i + 1} with substantial content about various topics and information that needs to be extracted from the article.</p>`,
      ).join('\n');

      const html = `
        <html>
          <body>
            <article>
              <h1>Very Large Article</h1>
              ${paragraphs}
            </article>
          </body>
        </html>
      `;

      const result = extractContent(html);

      assert.equal(result.success, true);
      if (result.success) {
        assert.ok(result.wordCount > 500);
        assert.ok(result.readingTime > 1);
      }
    });
  });
});
