import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractFeedDiscovery } from './extract.js';

describe('extractFeedDiscovery', () => {
  it('should extract RSS feed', () => {
    const html = `
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" title="RSS Feed">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].url, '/feed.xml');
    assert.equal(result.feeds[0].type, 'rss');
    assert.equal(result.feeds[0].title, 'RSS Feed');
  });

  it('should extract Atom feed', () => {
    const html = `
      <link rel="alternate" type="application/atom+xml" href="/atom.xml" title="Atom Feed">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].type, 'atom');
    assert.equal(result.feeds[0].url, '/atom.xml');
  });

  it('should extract JSON feed', () => {
    const html = `
      <link rel="alternate" type="application/feed+json" href="/feed.json" title="JSON Feed">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].type, 'json');
    assert.equal(result.feeds[0].url, '/feed.json');
  });

  it('should extract multiple feeds', () => {
    const html = `
      <link rel="alternate" type="application/rss+xml" href="/rss.xml">
      <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      <link rel="alternate" type="application/feed+json" href="/feed.json">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 3);
    assert.equal(result.feeds[0].type, 'rss');
    assert.equal(result.feeds[1].type, 'atom');
    assert.equal(result.feeds[2].type, 'json');
  });

  it('should skip non-feed alternate links', () => {
    const html = `
      <link rel="alternate" hreflang="fr" href="/fr">
      <link rel="alternate" type="text/html" href="/mobile">
      <link rel="alternate" type="application/rss+xml" href="/feed.xml">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    // Should only extract the RSS feed
    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].type, 'rss');
  });

  it('should handle feeds without title', () => {
    const html = `
      <link rel="alternate" type="application/rss+xml" href="/feed.xml">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].title, undefined);
  });

  it('should return empty array if no feeds found', () => {
    const html = '<html><head><title>No Feeds</title></head></html>';
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.deepEqual(result.feeds, []);
  });

  it('should generate suggestions when document URL provided', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc, 'https://example.com/page');

    assert.ok(result.suggestions);
    assert.ok(result.suggestions.length > 0);
    assert.ok(result.suggestions.some((s) => s === 'https://example.com/feed'));
    assert.ok(result.suggestions.some((s) => s === 'https://example.com/rss.xml'));
  });

  it('should not generate suggestions without document URL', () => {
    const html = '<html><head></head></html>';
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.suggestions, undefined);
  });

  it('should handle case-insensitive MIME types', () => {
    const html = `
      <link rel="alternate" type="APPLICATION/RSS+XML" href="/feed1.xml">
      <link rel="alternate" type="Application/Atom+XML" href="/feed2.xml">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 2);
    assert.equal(result.feeds[0].type, 'rss');
    assert.equal(result.feeds[1].type, 'atom');
  });

  it('should handle generic application/json as json feed', () => {
    const html = `
      <link rel="alternate" type="application/json" href="/feed.json">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].type, 'json');
  });

  it('should mark ambiguous xml/json types as unknown', () => {
    const html = `
      <link rel="alternate" type="text/xml" href="/feed.xml">
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc);

    assert.equal(result.feeds.length, 1);
    assert.equal(result.feeds[0].type, 'unknown');
  });

  it('should extract real-world blog feed setup', () => {
    const html = `
      <head>
        <link rel="alternate" type="application/rss+xml" title="RSS 2.0" href="https://example.com/feed/">
        <link rel="alternate" type="application/atom+xml" title="Atom 1.0" href="https://example.com/feed/atom/">
        <link rel="alternate" type="application/rss+xml" title="Comments RSS" href="https://example.com/comments/feed/">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractFeedDiscovery(doc, 'https://example.com');

    assert.equal(result.feeds.length, 3);
    assert.equal(result.feeds[0].type, 'rss');
    assert.equal(result.feeds[0].title, 'RSS 2.0');
    assert.equal(result.feeds[1].type, 'atom');
    assert.equal(result.feeds[1].title, 'Atom 1.0');
    assert.equal(result.feeds[2].type, 'rss');
    assert.equal(result.feeds[2].title, 'Comments RSS');
    assert.ok(result.suggestions);
  });
});
