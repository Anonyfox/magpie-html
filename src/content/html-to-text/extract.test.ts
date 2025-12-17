/**
 * Tests for HTML to text conversion.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { htmlToText } from './extract.js';

describe('htmlToText', () => {
  describe('Basic functionality', () => {
    it('should throw TypeError for non-string input', () => {
      assert.throws(() => htmlToText(123 as unknown as string), {
        name: 'TypeError',
        message: 'Expected html to be a string',
      });
    });

    it('should return empty string for empty input', () => {
      assert.strictEqual(htmlToText(''), '');
    });

    it('should extract simple text', () => {
      assert.strictEqual(htmlToText('Hello, World!'), 'Hello, World!');
    });

    it('should extract text from paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'First paragraph\nSecond paragraph');
    });
  });

  describe('Block elements', () => {
    it('should add newlines for block elements', () => {
      const html = '<div>First</div><div>Second</div>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'First\nSecond');
    });

    it('should handle headings', () => {
      const html = '<h1>Title</h1><p>Content</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Title\nContent');
    });

    it('should handle lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Item 1\nItem 2');
    });

    it('should handle nested block elements', () => {
      const html = '<div><section><p>Nested content</p></section></div>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Nested content');
    });
  });

  describe('Inline elements', () => {
    it('should preserve text in inline elements', () => {
      const html = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'This is bold and italic text');
    });

    it('should handle br tags', () => {
      const html = '<p>Line 1<br>Line 2<br />Line 3</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Line 1\nLine 2\nLine 3');
    });

    it('should handle spans and inline containers', () => {
      const html = '<p>Text with <span>inline</span> <span>spans</span></p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Text with inline spans');
    });
  });

  describe('Links', () => {
    it('should show link text by default', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Click here');
    });

    it('should show link URL inline when configured', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const result = htmlToText(html, { links: 'inline' });
      assert.strictEqual(result, 'Click here (https://example.com)');
    });

    it('should remove links when configured', () => {
      const html = '<p>Before <a href="https://example.com">link</a> after</p>';
      const result = htmlToText(html, { links: 'remove' });
      // Whitespace collapse reduces multiple spaces to one
      assert.strictEqual(result, 'Before after');
    });

    it('should handle links without text', () => {
      const html = '<a href="https://example.com"></a>';
      const result = htmlToText(html, { links: 'inline' });
      assert.strictEqual(result, '(https://example.com)');
    });

    it('should handle multiple links', () => {
      const html = '<p><a href="/one">First</a> and <a href="/two">Second</a></p>';
      const result = htmlToText(html, { links: 'inline' });
      assert.strictEqual(result, 'First (/one) and Second (/two)');
    });
  });

  describe('Images', () => {
    it('should show image alt text by default', () => {
      const html = '<img src="photo.jpg" alt="A beautiful photo">';
      const result = htmlToText(html);
      assert.strictEqual(result, 'A beautiful photo');
    });

    it('should remove images when configured', () => {
      const html = '<p>Before <img src="photo.jpg" alt="Photo"> after</p>';
      const result = htmlToText(html, { images: 'remove' });
      // Whitespace collapse reduces multiple spaces to one
      assert.strictEqual(result, 'Before after');
    });

    it('should handle images without alt text', () => {
      const html = '<img src="photo.jpg">';
      const result = htmlToText(html);
      assert.strictEqual(result, '');
    });

    it('should handle images in links', () => {
      const html = '<a href="/page"><img src="icon.png" alt="Icon">Link text</a>';
      const result = htmlToText(html, { links: 'inline' });
      // Image alt adds a space, then link text, then inline URL
      assert.strictEqual(result, 'Icon Link text (/page)');
    });
  });

  describe('Tables', () => {
    it('should render table cells with tab separator by default', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr></table>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'A\tB');
    });

    it('should render table cells with space separator when configured', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr></table>';
      const result = htmlToText(html, { tableCellSeparator: 'space' });
      assert.strictEqual(result, 'A B');
    });

    it('should handle multiple rows', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'A\tB\nC\tD');
    });

    it('should handle th tags', () => {
      const html =
        '<table><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Data 1</td><td>Data 2</td></tr></table>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Header 1\tHeader 2\nData 1\tData 2');
    });

    it('should handle nested tables', () => {
      const html =
        '<table><tr><td>Outer</td><td><table><tr><td>Inner</td></tr></table></td></tr></table>';
      const result = htmlToText(html);
      // Nested table is flattened
      assert.ok(result.includes('Outer'));
      assert.ok(result.includes('Inner'));
    });
  });

  describe('HTML entities', () => {
    it('should decode common named entities', () => {
      const html = 'AT&amp;T &lt;rocks&gt; &copy; 2024';
      const result = htmlToText(html);
      assert.strictEqual(result, 'AT&T <rocks> © 2024');
    });

    it('should decode numeric entities', () => {
      const html = 'A&#8212;B &#169; &#8364;';
      const result = htmlToText(html);
      assert.strictEqual(result, 'A—B © €');
    });

    it('should decode hex entities', () => {
      const html = '&#x2014; &#xA9; &#x20AC;';
      const result = htmlToText(html);
      assert.strictEqual(result, '— © €');
    });

    it('should handle nbsp', () => {
      const html = 'Word&nbsp;word';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Word word');
    });

    it('should not decode entities when disabled', () => {
      const html = 'AT&amp;T &lt;test&gt;';
      const result = htmlToText(html, { decodeEntities: false });
      assert.strictEqual(result, 'AT&amp;T &lt;test&gt;');
    });

    it('should leave unknown entities as-is', () => {
      const html = '&unknown; &alsounknown;';
      const result = htmlToText(html);
      assert.strictEqual(result, '&unknown; &alsounknown;');
    });
  });

  describe('Whitespace handling', () => {
    it('should collapse multiple spaces by default', () => {
      const html = '<p>Multiple    spaces     here</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Multiple spaces here');
    });

    it('should collapse tabs and newlines', () => {
      const html = '<p>Text\t\twith\n\ntabs\r\nand\rlines</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Text with tabs and lines');
    });

    it('should limit consecutive newlines to maxNewlines', () => {
      const html = '<p>First</p><br><br><br><br><p>Second</p>';
      const result = htmlToText(html, { maxNewlines: 2 });
      // Should limit to 2 consecutive newlines
      assert.ok(!result.includes('\n\n\n'));
    });

    it('should not collapse whitespace when disabled', () => {
      const html = '<p>Multiple    spaces</p>';
      const result = htmlToText(html, { collapseWhitespace: false });
      assert.strictEqual(result, 'Multiple    spaces');
    });

    it('should preserve whitespace in pre tags', () => {
      const html = '<pre>Code    with\n  indentation\n    preserved</pre>';
      const result = htmlToText(html);
      assert.ok(result.includes('    with'));
      assert.ok(result.includes('  indentation'));
    });

    it('should preserve whitespace in code tags', () => {
      const html = '<code>const x = 1;  const y = 2;</code>';
      const result = htmlToText(html);
      assert.ok(result.includes('  '));
    });

    it('should preserve whitespace in textarea', () => {
      const html = '<textarea>Line 1\n  Line 2\n    Line 3</textarea>';
      const result = htmlToText(html);
      assert.ok(result.includes('  Line 2'));
      assert.ok(result.includes('    Line 3'));
    });
  });

  describe('Excluded tags', () => {
    it('should exclude script tags by default', () => {
      const html = '<p>Before</p><script>alert("test")</script><p>After</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Before\nAfter');
    });

    it('should exclude style tags by default', () => {
      const html = '<p>Before</p><style>.hidden { display: none; }</style><p>After</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Before\nAfter');
    });

    it('should exclude custom tags when configured', () => {
      const html = '<p>Visible</p><custom>Hidden</custom><p>Also visible</p>';
      const result = htmlToText(html, { excludeTags: ['custom'] });
      assert.strictEqual(result, 'Visible\nAlso visible');
    });

    it('should exclude head in document mode', () => {
      const html = '<html><head><title>Page Title</title></head><body><p>Content</p></body></html>';
      const result = htmlToText(html, { mode: 'document' });
      assert.strictEqual(result, 'Content');
      assert.ok(!result.includes('Page Title'));
    });

    it('should not exclude head in fragment mode', () => {
      const html = '<head><title>Page Title</title></head><body><p>Content</p></body>';
      const result = htmlToText(html, { mode: 'fragment' });
      assert.ok(result.includes('Page Title'));
    });
  });

  describe('Hard wrapping', () => {
    it('should wrap long lines at specified width', () => {
      const html =
        '<p>This is a very long line that should be wrapped at the specified column width</p>';
      const result = htmlToText(html, { wrap: 20 });
      const lines = result.split('\n');
      for (const line of lines) {
        assert.ok(line.length <= 20, `Line "${line}" exceeds wrap width`);
      }
    });

    it('should not wrap when wrap is null', () => {
      const html = '<p>This is a very long line that should not be wrapped at all</p>';
      const result = htmlToText(html, { wrap: null });
      assert.strictEqual(result.split('\n').length, 1);
    });

    it('should not wrap preserved content', () => {
      const html =
        '<pre>Very long line that should not be wrapped even if it exceeds the wrap width</pre>';
      const result = htmlToText(html, { wrap: 20 });
      // The pre content should remain on one line
      const lines = result.split('\n');
      const preLine = lines.find((line) => line.includes('Very long line'));
      assert.ok(preLine && preLine.length > 20);
    });
  });

  describe('Trim option', () => {
    it('should trim whitespace by default', () => {
      const html = '  <p>Content</p>  ';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Content');
    });

    it('should not trim when disabled', () => {
      const html = '  <p>Content</p>  ';
      const result = htmlToText(html, { trim: false });
      assert.ok(result.startsWith(' '));
      assert.ok(result.endsWith(' '));
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed HTML', () => {
      const html = '<p>Unclosed paragraph<div>Next element';
      const result = htmlToText(html);
      assert.ok(result.includes('Unclosed paragraph'));
      assert.ok(result.includes('Next element'));
    });

    it('should handle tags without closing angle bracket', () => {
      const html = '<p>Text before <broken-tag';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Text before <broken-tag');
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Text<br/>More text</p>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Text\nMore text');
    });

    it('should handle nested same tags', () => {
      const html = '<div><div><div>Nested content</div></div></div>';
      const result = htmlToText(html);
      assert.strictEqual(result, 'Nested content');
    });

    it('should handle empty tags', () => {
      const html = '<p></p><div></div><span></span>';
      const result = htmlToText(html);
      assert.strictEqual(result, '');
    });

    it('should handle mixed content', () => {
      const html = `
        <article>
          <h1>Article Title</h1>
          <p>This is the <strong>first paragraph</strong> with <a href="/link">a link</a>.</p>
          <pre>Some code
  with indentation</pre>
          <p>Second paragraph with an image: <img src="pic.jpg" alt="Picture"></p>
        </article>
      `;
      const result = htmlToText(html, { links: 'inline' });
      assert.ok(result.includes('Article Title'));
      assert.ok(result.includes('first paragraph'));
      assert.ok(result.includes('a link (/link)'));
      assert.ok(result.includes('Some code\n  with indentation'));
      assert.ok(result.includes('Picture'));
    });
  });
});
