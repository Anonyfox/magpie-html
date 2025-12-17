import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanText, decodeEntities, normalizeWhitespace, stripCDATA } from './clean-text.js';

describe('stripCDATA', () => {
  it('should strip CDATA tags from text', () => {
    const input = '<![CDATA[Hello World]]>';
    const result = stripCDATA(input);
    assert.equal(result, 'Hello World');
  });

  it('should handle text without CDATA', () => {
    const input = 'Hello World';
    const result = stripCDATA(input);
    assert.equal(result, 'Hello World');
  });

  it('should handle CDATA at start only', () => {
    const input = '<![CDATA[Hello World';
    const result = stripCDATA(input);
    assert.equal(result, 'Hello World');
  });

  it('should handle CDATA at end only', () => {
    const input = 'Hello World]]>';
    const result = stripCDATA(input);
    assert.equal(result, 'Hello World');
  });

  it('should handle empty string', () => {
    const result = stripCDATA('');
    assert.equal(result, '');
  });

  it('should handle null/undefined gracefully', () => {
    assert.equal(stripCDATA(null as any), null);
    assert.equal(stripCDATA(undefined as any), undefined);
  });
});

describe('decodeEntities', () => {
  it('should decode common HTML entities', () => {
    const input = '&lt;div&gt;Hello &amp; World&lt;/div&gt;';
    const result = decodeEntities(input);
    assert.equal(result, '<div>Hello & World</div>');
  });

  it('should decode quotes', () => {
    const input = '&quot;Hello&quot; &apos;World&apos;';
    const result = decodeEntities(input);
    assert.equal(result, '"Hello" \'World\'');
  });

  it('should decode numeric entities', () => {
    const input = '&#39;Hello&#39;';
    const result = decodeEntities(input);
    assert.equal(result, "'Hello'");
  });

  it('should decode hex entities', () => {
    const input = '&#x27;Hello&#x27;';
    const result = decodeEntities(input);
    assert.equal(result, "'Hello'");
  });

  it('should decode nbsp', () => {
    const input = 'Hello&nbsp;World';
    const result = decodeEntities(input);
    assert.equal(result, 'Hello World');
  });

  it('should handle text without entities', () => {
    const input = 'Hello World';
    const result = decodeEntities(input);
    assert.equal(result, 'Hello World');
  });

  it('should handle multiple entities', () => {
    const input = '&lt;&amp;&gt;&quot;&apos;';
    const result = decodeEntities(input);
    assert.equal(result, '<&>"\'');
  });

  it('should handle empty string', () => {
    const result = decodeEntities('');
    assert.equal(result, '');
  });
});

describe('normalizeWhitespace', () => {
  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const result = normalizeWhitespace(input);
    assert.equal(result, 'Hello World');
  });

  it('should collapse multiple spaces', () => {
    const input = 'Hello    World';
    const result = normalizeWhitespace(input);
    assert.equal(result, 'Hello World');
  });

  it('should collapse newlines and tabs', () => {
    const input = 'Hello\n\n\tWorld';
    const result = normalizeWhitespace(input);
    assert.equal(result, 'Hello World');
  });

  it('should preserve line breaks when requested', () => {
    const input = 'Hello\n\nWorld';
    const result = normalizeWhitespace(input, true);
    assert.equal(result, 'Hello\n\nWorld');
  });

  it('should collapse spaces but keep line breaks', () => {
    const input = 'Hello    World\n  Foo   Bar';
    const result = normalizeWhitespace(input, true);
    assert.equal(result, 'Hello World\nFoo Bar');
  });

  it('should handle empty string', () => {
    const result = normalizeWhitespace('');
    assert.equal(result, '');
  });

  it('should handle only whitespace', () => {
    const input = '   \n\t  ';
    const result = normalizeWhitespace(input);
    assert.equal(result, '');
  });
});

describe('cleanText', () => {
  it('should apply all cleaning operations by default', () => {
    const input = '  <![CDATA[Hello &amp; World]]>  ';
    const result = cleanText(input);
    assert.equal(result, 'Hello & World');
  });

  it('should handle complex RSS content', () => {
    const input = '<![CDATA[Das wichtigste deutsche &quot;Konjunkturbarometer&quot;   sinkt]]>';
    const result = cleanText(input);
    assert.equal(result, 'Das wichtigste deutsche "Konjunkturbarometer" sinkt');
  });

  it('should skip CDATA stripping when disabled', () => {
    const input = '<![CDATA[Hello World]]>';
    const result = cleanText(input, { stripCdata: false });
    assert.equal(result, '<![CDATA[Hello World]]>');
  });

  it('should skip entity decoding when disabled', () => {
    const input = 'Hello &amp; World';
    const result = cleanText(input, { decodeEntities: false });
    assert.equal(result, 'Hello &amp; World');
  });

  it('should skip whitespace normalization when disabled', () => {
    const input = '  Hello   World  ';
    const result = cleanText(input, { normalizeWhitespace: false });
    assert.equal(result, '  Hello   World  ');
  });

  it('should handle null', () => {
    const result = cleanText(null);
    assert.equal(result, '');
  });

  it('should handle undefined', () => {
    const result = cleanText(undefined);
    assert.equal(result, '');
  });

  it('should handle empty string', () => {
    const result = cleanText('');
    assert.equal(result, '');
  });

  it('should handle non-string input', () => {
    const result = cleanText(123 as any);
    assert.equal(result, '');
  });

  it('should preserve line breaks when requested', () => {
    const input = '<![CDATA[Line 1\nLine 2\nLine 3]]>';
    const result = cleanText(input, { preserveLineBreaks: true });
    assert.equal(result, 'Line 1\nLine 2\nLine 3');
  });

  it('should handle nested CDATA-like content', () => {
    const input = '<![CDATA[Content with <![CDATA[nested]]> text]]>';
    const result = cleanText(input);
    // Should strip outer CDATA, leaving inner markers visible
    assert.equal(result, 'Content with <![CDATA[nested]]> text');
  });
});
