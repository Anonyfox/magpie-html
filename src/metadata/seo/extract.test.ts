import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractSEO } from './extract.js';

describe('extractSEO', () => {
  it('should extract title from <title> tag', () => {
    const html = '<html><head><title>Test Page Title</title></head></html>';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.title, 'Test Page Title');
  });

  it('should extract description', () => {
    const html = '<meta name="description" content="This is a test description">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.description, 'This is a test description');
  });

  it('should extract keywords as array', () => {
    const html = '<meta name="keywords" content="test, seo, metadata, html">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.deepEqual(result.keywords, ['test', 'seo', 'metadata', 'html']);
  });

  it('should handle keywords with extra spaces', () => {
    const html = '<meta name="keywords" content="test,  seo,   metadata  ,  html  ">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.deepEqual(result.keywords, ['test', 'seo', 'metadata', 'html']);
  });

  it('should extract author', () => {
    const html = '<meta name="author" content="John Doe">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.author, 'John Doe');
  });

  it('should extract generator', () => {
    const html = '<meta name="generator" content="WordPress 6.0">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.generator, 'WordPress 6.0');
  });

  it('should extract viewport', () => {
    const html = '<meta name="viewport" content="width=device-width, initial-scale=1">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.viewport, 'width=device-width, initial-scale=1');
  });

  it('should extract theme-color', () => {
    const html = '<meta name="theme-color" content="#ffffff">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.themeColor, '#ffffff');
  });

  it('should extract color-scheme', () => {
    const html = '<meta name="color-scheme" content="dark light">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.colorScheme, 'dark light');
  });

  it('should extract application-name', () => {
    const html = '<meta name="application-name" content="My Web App">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.applicationName, 'My Web App');
  });

  it('should extract apple-mobile-web-app-title', () => {
    const html = '<meta name="apple-mobile-web-app-title" content="My App">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.appleMobileWebAppTitle, 'My App');
  });

  it('should extract apple-mobile-web-app-capable as boolean', () => {
    const html = '<meta name="apple-mobile-web-app-capable" content="yes">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.appleMobileWebAppCapable, true);
  });

  it('should handle apple-mobile-web-app-capable with "no"', () => {
    const html = '<meta name="apple-mobile-web-app-capable" content="no">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.appleMobileWebAppCapable, false);
  });

  it('should extract apple-mobile-web-app-status-bar-style', () => {
    const html = '<meta name="apple-mobile-web-app-status-bar-style" content="black">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.appleMobileWebAppStatusBarStyle, 'black');
  });

  it('should extract multiple SEO meta tags', () => {
    const html = `
      <html>
        <head>
          <title>Complete SEO Test</title>
          <meta name="description" content="Full SEO test page">
          <meta name="keywords" content="seo, testing, metadata">
          <meta name="author" content="Test Author">
          <meta name="generator" content="Test Generator">
          <meta name="theme-color" content="#000000">
        </head>
      </html>
    `;
    const doc = parseHTML(html);

    const result = extractSEO(doc);

    assert.equal(result.title, 'Complete SEO Test');
    assert.equal(result.description, 'Full SEO test page');
    assert.deepEqual(result.keywords, ['seo', 'testing', 'metadata']);
    assert.equal(result.author, 'Test Author');
    assert.equal(result.generator, 'Test Generator');
    assert.equal(result.themeColor, '#000000');
  });

  it('should return empty object if no SEO metadata present', () => {
    const html = '<html><head></head><body>No metadata</body></html>';
    const doc = parseHTML(html);

    const result = extractSEO(doc);

    assert.deepEqual(result, {});
  });

  it('should trim title whitespace', () => {
    const html = '<html><head><title>  Title with spaces  </title></head></html>';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.title, 'Title with spaces');
  });

  it('should handle empty keywords', () => {
    const html = '<meta name="keywords" content="">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.equal(result.keywords, undefined);
  });

  it('should filter out empty keywords after splitting', () => {
    const html = '<meta name="keywords" content="test, , , another">';
    const doc = parseHTML(html);

    const result = extractSEO(doc);
    assert.deepEqual(result.keywords, ['test', 'another']);
  });
});
