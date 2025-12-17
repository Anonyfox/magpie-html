import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractText, getEnvironment, helloWorld, isBrowser } from './index.js';

describe('helloWorld', () => {
  it('should return a greeting with default name', () => {
    const result = helloWorld();
    assert.equal(result, 'Hello, World! Welcome to Magpie HTML 🦅');
  });

  it('should return a greeting with custom name', () => {
    const result = helloWorld('Alice');
    assert.equal(result, 'Hello, Alice! Welcome to Magpie HTML 🦅');
  });

  it('should handle empty string', () => {
    const result = helloWorld('');
    assert.equal(result, 'Hello, ! Welcome to Magpie HTML 🦅');
  });
});

describe('extractText', () => {
  it('should extract text from simple HTML', () => {
    const html = '<p>Hello World</p>';
    const result = extractText(html);
    assert.equal(result, 'Hello World');
  });

  it('should remove script tags and their content', () => {
    const html = '<div>Content<script>alert("bad")</script>More</div>';
    const result = extractText(html);
    assert.equal(result, 'ContentMore');
  });

  it('should remove style tags and their content', () => {
    const html = '<div>Content<style>.class { color: red; }</style>More</div>';
    const result = extractText(html);
    assert.equal(result, 'ContentMore');
  });

  it('should normalize whitespace', () => {
    const html = '<p>Hello    \n\n   World</p>';
    const result = extractText(html);
    assert.equal(result, 'Hello World');
  });

  it('should handle empty HTML', () => {
    const result = extractText('');
    assert.equal(result, '');
  });

  it('should handle complex nested HTML', () => {
    const html = `
      <div>
        <h1>Title</h1>
        <p>Paragraph <strong>bold</strong> text</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    `;
    const result = extractText(html);
    assert.equal(result, 'Title Paragraph bold text Item 1 Item 2');
  });
});

describe('isBrowser', () => {
  it('should return false in Node.js environment', () => {
    const result = isBrowser();
    assert.equal(result, false);
  });
});

describe('getEnvironment', () => {
  it('should return "node" in Node.js environment', () => {
    const result = getEnvironment();
    assert.equal(result, 'node');
  });
});
