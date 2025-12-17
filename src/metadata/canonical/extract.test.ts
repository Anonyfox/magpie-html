import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractCanonical } from './extract.js';

describe('extractCanonical', () => {
  it('should extract canonical URL', () => {
    const html = '<link rel="canonical" href="https://example.com/page">';
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.equal(result.canonical, 'https://example.com/page');
  });

  it('should extract language alternates', () => {
    const html = `
      <link rel="alternate" href="https://example.com/en" hreflang="en">
      <link rel="alternate" href="https://example.com/fr" hreflang="fr">
      <link rel="alternate" href="https://example.com/de" hreflang="de">
    `;
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.alternates);
    assert.equal(result.alternates.length, 3);
    assert.equal(result.alternates[0].href, 'https://example.com/en');
    assert.equal(result.alternates[0].hreflang, 'en');
    assert.equal(result.alternates[1].hreflang, 'fr');
    assert.equal(result.alternates[2].hreflang, 'de');
  });

  it('should extract feed alternates with type', () => {
    const html = `
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" title="RSS Feed">
      <link rel="alternate" type="application/atom+xml" href="/atom.xml" title="Atom Feed">
    `;
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.alternates);
    assert.equal(result.alternates.length, 2);
    assert.equal(result.alternates[0].type, 'application/rss+xml');
    assert.equal(result.alternates[0].title, 'RSS Feed');
    assert.equal(result.alternates[1].type, 'application/atom+xml');
    assert.equal(result.alternates[1].title, 'Atom Feed');
  });

  it('should extract AMP version', () => {
    const html = '<link rel="amphtml" href="https://example.com/page.amp">';
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.equal(result.amphtml, 'https://example.com/page.amp');
  });

  it('should extract manifest', () => {
    const html = '<link rel="manifest" href="/manifest.json">';
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.equal(result.manifest, '/manifest.json');
  });

  it('should extract app links', () => {
    const html = `
      <meta property="al:ios:url" content="example://ios-open">
      <meta property="al:android:url" content="example://android-open">
      <meta property="al:web:url" content="https://example.com/web">
    `;
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.appLinks);
    assert.equal(result.appLinks.ios, 'example://ios-open');
    assert.equal(result.appLinks.android, 'example://android-open');
    assert.equal(result.appLinks.web, 'https://example.com/web');
  });

  it('should extract partial app links', () => {
    const html = '<meta property="al:ios:url" content="example://ios">';
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.appLinks);
    assert.equal(result.appLinks.ios, 'example://ios');
    assert.equal(result.appLinks.android, undefined);
  });

  it('should return empty object if no canonical metadata present', () => {
    const html = '<html><head><title>No Canonical</title></head></html>';
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.deepEqual(result, {});
  });

  it('should handle mixed alternate types', () => {
    const html = `
      <link rel="alternate" href="/en" hreflang="en">
      <link rel="alternate" href="/feed.xml" type="application/rss+xml" title="Feed">
      <link rel="alternate" href="/fr" hreflang="fr">
    `;
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.alternates);
    assert.equal(result.alternates.length, 3);
    assert.equal(result.alternates[0].hreflang, 'en');
    assert.equal(result.alternates[1].type, 'application/rss+xml');
    assert.equal(result.alternates[2].hreflang, 'fr');
  });

  it('should extract complete canonical metadata', () => {
    const html = `
      <head>
        <link rel="canonical" href="https://example.com/article">
        <link rel="alternate" href="https://example.com/en" hreflang="en">
        <link rel="alternate" href="https://example.com/fr" hreflang="fr">
        <link rel="alternate" href="https://example.com/de" hreflang="de">
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" title="RSS">
        <link rel="amphtml" href="https://example.com/article.amp">
        <link rel="manifest" href="/manifest.json">
        <meta property="al:ios:url" content="example://article">
        <meta property="al:android:url" content="example://article-android">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.equal(result.canonical, 'https://example.com/article');
    assert.ok(result.alternates);
    assert.equal(result.alternates.length, 4);
    assert.equal(result.amphtml, 'https://example.com/article.amp');
    assert.equal(result.manifest, '/manifest.json');
    assert.ok(result.appLinks);
    assert.equal(result.appLinks.ios, 'example://article');
    assert.equal(result.appLinks.android, 'example://article-android');
  });

  it('should handle x-default hreflang', () => {
    const html = `
      <link rel="alternate" href="https://example.com/" hreflang="x-default">
      <link rel="alternate" href="https://example.com/en" hreflang="en">
    `;
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.alternates);
    assert.equal(result.alternates[0].hreflang, 'x-default');
    assert.equal(result.alternates[1].hreflang, 'en');
  });

  it('should clean up undefined values in alternates', () => {
    const html = '<link rel="alternate" href="/en">';
    const doc = parseHTML(html);

    const result = extractCanonical(doc);

    assert.ok(result.alternates);
    assert.equal(result.alternates.length, 1);
    assert.equal(result.alternates[0].href, '/en');
    assert.equal(result.alternates[0].hreflang, undefined);
    assert.equal(result.alternates[0].type, undefined);
  });
});
