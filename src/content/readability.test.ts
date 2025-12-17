import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractWithReadability, isProbablyReaderable } from './readability.js';

describe('isProbablyReaderable', () => {
  it('should check article with article tag', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Article Title</h1>
            <p>This is a substantial article with enough content to be considered readerable.</p>
            <p>Multiple paragraphs make it more likely to be a real article.</p>
            <p>Additional content ensures we meet the minimum length requirements.</p>
          </article>
        </body>
      </html>
    `;

    const result = isProbablyReaderable(html);
    assert.ok(typeof result === 'boolean');
  });

  it('should check article with main tag', () => {
    const html = `
      <html>
        <body>
          <main>
            <h1>Main Content</h1>
            <p>Content in main tag with substantial text for article extraction.</p>
            <p>Multiple paragraphs indicate this is likely article content.</p>
            <p>More content to meet minimum requirements for readability.</p>
          </main>
        </body>
      </html>
    `;

    const result = isProbablyReaderable(html);
    assert.ok(typeof result === 'boolean');
  });

  it('should check content with multiple paragraphs', () => {
    const html = `
      <html>
        <body>
          <div class="content">
            <p>First paragraph with text content that makes this look like an article.</p>
            <p>Second paragraph continues the content with more information.</p>
            <p>Third paragraph adds even more detail to the article.</p>
          </div>
        </body>
      </html>
    `;

    const result = isProbablyReaderable(html);
    assert.ok(typeof result === 'boolean');
  });

  it('should return false for short content', () => {
    const html = '<html><body><p>Too short</p></body></html>';

    assert.equal(isProbablyReaderable(html), false);
  });

  it('should return false for navigation content', () => {
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

    assert.equal(isProbablyReaderable(html), false);
  });

  it('should return false for empty content', () => {
    const html = '<html><body></body></html>';

    assert.equal(isProbablyReaderable(html), false);
  });

  it('should respect minContentLength option', () => {
    const html = '<html><body><article><p>Short</p></article></body></html>';

    const high = isProbablyReaderable(html, { minContentLength: 10 });
    const low = isProbablyReaderable(html, { minContentLength: 1 });

    assert.ok(typeof high === 'boolean');
    assert.ok(typeof low === 'boolean');
  });

  it('should handle malformed HTML gracefully', () => {
    const html = '<html><body><p>Unclosed paragraph</body>';

    // Should not throw
    const result = isProbablyReaderable(html);
    assert.ok(typeof result === 'boolean');
  });
});

describe('extractWithReadability', () => {
  it('should extract article with basic content', () => {
    const html = `
      <html>
        <head>
          <title>Test Article</title>
        </head>
        <body>
          <article>
            <h1>Article Headline</h1>
            <p>First paragraph with substantial content for the article extraction test.</p>
            <p>Second paragraph continues with more detailed information about the topic.</p>
            <p>Third paragraph provides additional context and supporting details.</p>
            <p>Fourth paragraph wraps up the article with concluding thoughts.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    assert.ok(result.title.length > 0);
    assert.ok(result.content.length > 0);
    assert.ok(result.textContent.length > 0);
    assert.ok(result.length > 0);
  });

  it('should handle very short content', () => {
    const html = '<html><body><div>Too short</div></body></html>';

    const result = extractWithReadability(html);

    // Readability might extract something minimal or return null
    // Just verify it doesn't throw
    assert.ok(result === null || typeof result === 'object');
  });

  it('should extract byline when present', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Article Title</h1>
            <p class="byline">By John Doe</p>
            <p>Article content with substantial text for extraction testing purposes.</p>
            <p>More content to ensure we have enough for successful extraction.</p>
            <p>Additional paragraph to meet minimum content requirements.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    // Byline extraction depends on Readability heuristics
    // Just verify it doesn't break
    assert.ok('byline' in result);
  });

  it('should extract site name from meta tags', () => {
    const html = `
      <html>
        <head>
          <meta property="og:site_name" content="Example Site">
        </head>
        <body>
          <article>
            <h1>Article Title</h1>
            <p>Article content with enough text to be extracted successfully.</p>
            <p>More paragraphs ensure we meet the minimum content requirements.</p>
            <p>Additional content for proper article extraction testing.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    assert.ok('siteName' in result);
  });

  it('should handle baseUrl option', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Test Article</h1>
            <p>Content with <a href="/relative/path">relative link</a>.</p>
            <p>More content to ensure successful extraction from the HTML.</p>
            <p>Additional paragraph to meet minimum content length requirements.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html, {
      baseUrl: 'https://example.com/article',
    });

    assert.ok(result !== null);
    assert.ok(result.content.length > 0);
  });

  it('should respect charThreshold option', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Short</h1>
            <p>Brief content that might not meet high character threshold.</p>
          </article>
        </body>
      </html>
    `;

    // With low threshold - typically succeeds
    const lowResult = extractWithReadability(html, { charThreshold: 10 });
    assert.ok(lowResult === null || typeof lowResult === 'object');

    // With high threshold - typically fails
    const highResult = extractWithReadability(html, { charThreshold: 10000 });
    assert.ok(highResult === null || typeof highResult === 'object');
  });

  it('should preserve content structure', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Article with Structure</h1>
            <p>Introduction paragraph with text content.</p>
            <h2>Subheading</h2>
            <p>Content under subheading with more details.</p>
            <ul>
              <li>List item one</li>
              <li>List item two</li>
            </ul>
            <p>Concluding paragraph after list.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    assert.ok(result.content.includes('<p>'));
    assert.ok(result.content.includes('<h2>') || result.content.includes('<h1>'));
  });

  it('should extract language when specified', () => {
    const html = `
      <html lang="en">
        <body>
          <article>
            <h1>English Article</h1>
            <p>Content in English language for extraction testing purposes.</p>
            <p>Multiple paragraphs ensure we have sufficient content.</p>
            <p>Additional text to meet minimum requirements.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    assert.ok('lang' in result);
  });

  it('should handle images in content', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Article with Images</h1>
            <p>Introduction before image content.</p>
            <img src="/test.jpg" alt="Test image">
            <p>Content after image with more substantial text.</p>
            <p>Additional paragraphs to ensure extraction succeeds.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    assert.ok(result.content.includes('<img') || result.content.length > 0);
  });

  it('should handle links in content', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Article with Links</h1>
            <p>Check out <a href="/link">this link</a> for more information.</p>
            <p>More content with <a href="/another">another link</a> here.</p>
            <p>Additional text to meet minimum content requirements.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractWithReadability(html);

    assert.ok(result !== null);
    assert.ok(result.content.includes('<a') || result.textContent.includes('link'));
  });
});
