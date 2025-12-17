import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanAtomContent } from './clean-text.js';

describe('cleanAtomContent', () => {
  it('should clean text type content', () => {
    const input = '  Hello   World  ';
    const result = cleanAtomContent(input, 'text');
    assert.equal(result, 'Hello World');
  });

  it('should handle null text', () => {
    const result = cleanAtomContent(null, 'text');
    assert.equal(result, '');
  });

  it('should handle undefined text', () => {
    const result = cleanAtomContent(undefined, 'text');
    assert.equal(result, '');
  });

  it('should handle empty string', () => {
    const result = cleanAtomContent('', 'text');
    assert.equal(result, '');
  });

  it('should default to text type when no type given', () => {
    const input = '  <![CDATA[Hello]]>  ';
    const result = cleanAtomContent(input);
    assert.equal(result, 'Hello');
  });

  it('should preserve HTML entities in html type', () => {
    const input = 'Hello &amp; World';
    const result = cleanAtomContent(input, 'html');
    assert.equal(result, 'Hello &amp; World');
  });

  it('should preserve HTML entities in xhtml type', () => {
    const input = '<p>Hello &lt;World&gt;</p>';
    const result = cleanAtomContent(input, 'xhtml');
    assert.equal(result, '<p>Hello &lt;World&gt;</p>');
  });

  it('should handle CDATA in html type', () => {
    const input = '<![CDATA[<p>Hello</p>]]>';
    const result = cleanAtomContent(input, 'html');
    assert.equal(result, '<p>Hello</p>');
  });

  it('should normalize whitespace in html type', () => {
    const input = '<p>Hello   \n\n  World</p>';
    const result = cleanAtomContent(input, 'html');
    assert.equal(result, '<p>Hello World</p>');
  });

  it('should handle case-insensitive content type', () => {
    const input = 'Hello World';
    const result1 = cleanAtomContent(input, 'TEXT');
    const result2 = cleanAtomContent(input, 'text');
    assert.equal(result1, result2);
  });

  it('should handle custom mime types', () => {
    const input = '  <data>value</data>  ';
    const result = cleanAtomContent(input, 'application/xml');
    assert.equal(result, '<data>value</data>');
  });

  it('should handle null type', () => {
    const input = 'Hello';
    const result = cleanAtomContent(input, null);
    assert.equal(result, 'Hello');
  });

  it('should handle undefined type', () => {
    const input = 'Hello';
    const result = cleanAtomContent(input, undefined);
    assert.equal(result, 'Hello');
  });

  it('should handle whitespace-only type', () => {
    const input = 'Hello';
    const result = cleanAtomContent(input, '  ');
    assert.equal(result, 'Hello');
  });
});
