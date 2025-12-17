import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from './html-parser.js';
import {
  getAllMetaByName,
  getAllMetaByProperty,
  getAllMetaPropertyValues,
  getMetaContent,
  getMetaHttpEquiv,
  getMetaProperty,
} from './meta-helpers.js';

describe('getMetaContent', () => {
  it('should extract meta content by name', () => {
    const html = '<meta name="description" content="Test description">';
    const doc = parseHTML(html);

    const result = getMetaContent(doc, 'description');
    assert.equal(result, 'Test description');
  });

  it('should return undefined if meta tag not found', () => {
    const html = '<meta name="keywords" content="test">';
    const doc = parseHTML(html);

    const result = getMetaContent(doc, 'description');
    assert.equal(result, undefined);
  });

  it('should return undefined if content is empty', () => {
    const html = '<meta name="description" content="">';
    const doc = parseHTML(html);

    const result = getMetaContent(doc, 'description');
    assert.equal(result, undefined);
  });
});

describe('getMetaProperty', () => {
  it('should extract meta content by property', () => {
    const html = '<meta property="og:title" content="Test Title">';
    const doc = parseHTML(html);

    const result = getMetaProperty(doc, 'og:title');
    assert.equal(result, 'Test Title');
  });

  it('should return undefined if property not found', () => {
    const html = '<meta property="og:title" content="Test">';
    const doc = parseHTML(html);

    const result = getMetaProperty(doc, 'og:description');
    assert.equal(result, undefined);
  });
});

describe('getAllMetaByName', () => {
  it('should extract all meta tags matching name prefix', () => {
    const html = `
      <meta name="twitter:card" content="summary">
      <meta name="twitter:site" content="@example">
      <meta name="twitter:creator" content="@author">
      <meta name="description" content="Should not match">
    `;
    const doc = parseHTML(html);

    const result = getAllMetaByName(doc, 'twitter:');

    assert.equal(result.size, 3);
    assert.equal(result.get('twitter:card'), 'summary');
    assert.equal(result.get('twitter:site'), '@example');
    assert.equal(result.get('twitter:creator'), '@author');
    assert.equal(result.get('description'), undefined);
  });

  it('should return empty map if no matches', () => {
    const html = '<meta name="description" content="Test">';
    const doc = parseHTML(html);

    const result = getAllMetaByName(doc, 'twitter:');
    assert.equal(result.size, 0);
  });
});

describe('getAllMetaByProperty', () => {
  it('should extract all meta tags matching property prefix', () => {
    const html = `
      <meta property="og:title" content="Title">
      <meta property="og:image" content="https://example.com/image.jpg">
      <meta property="og:description" content="Description">
      <meta name="description" content="Should not match">
    `;
    const doc = parseHTML(html);

    const result = getAllMetaByProperty(doc, 'og:');

    assert.equal(result.size, 3);
    assert.equal(result.get('og:title'), 'Title');
    assert.equal(result.get('og:image'), 'https://example.com/image.jpg');
    assert.equal(result.get('og:description'), 'Description');
  });

  it('should return empty map if no matches', () => {
    const html = '<meta name="description" content="Test">';
    const doc = parseHTML(html);

    const result = getAllMetaByProperty(doc, 'og:');
    assert.equal(result.size, 0);
  });
});

describe('getAllMetaPropertyValues', () => {
  it('should extract all values for a property that appears multiple times', () => {
    const html = `
      <meta property="og:image" content="https://example.com/image1.jpg">
      <meta property="og:image" content="https://example.com/image2.jpg">
      <meta property="og:image" content="https://example.com/image3.jpg">
    `;
    const doc = parseHTML(html);

    const result = getAllMetaPropertyValues(doc, 'og:image');

    assert.equal(result.length, 3);
    assert.deepEqual(result, [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
    ]);
  });

  it('should return empty array if property not found', () => {
    const html = '<meta property="og:title" content="Test">';
    const doc = parseHTML(html);

    const result = getAllMetaPropertyValues(doc, 'og:image');
    assert.equal(result.length, 0);
  });

  it('should return single value if property appears once', () => {
    const html = '<meta property="og:image" content="https://example.com/image.jpg">';
    const doc = parseHTML(html);

    const result = getAllMetaPropertyValues(doc, 'og:image');
    assert.equal(result.length, 1);
    assert.equal(result[0], 'https://example.com/image.jpg');
  });
});

describe('getMetaHttpEquiv', () => {
  it('should extract meta content by http-equiv', () => {
    const html = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">';
    const doc = parseHTML(html);

    const result = getMetaHttpEquiv(doc, 'Content-Security-Policy');
    assert.equal(result, "default-src 'self'");
  });

  it('should be case-insensitive for http-equiv', () => {
    const html = '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
    const doc = parseHTML(html);

    const result = getMetaHttpEquiv(doc, 'x-ua-compatible');
    assert.equal(result, 'IE=edge');
  });

  it('should return undefined if not found', () => {
    const html = '<meta name="description" content="Test">';
    const doc = parseHTML(html);

    const result = getMetaHttpEquiv(doc, 'Content-Security-Policy');
    assert.equal(result, undefined);
  });
});
