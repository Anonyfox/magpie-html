import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from './html-parser.js';
import {
  getAllLinks,
  getAllLinksByPrefix,
  getAllLinksByRels,
  getLinkHref,
} from './link-helpers.js';

describe('getLinkHref', () => {
  it('should extract href by rel attribute', () => {
    const html = '<link rel="canonical" href="https://example.com/page">';
    const doc = parseHTML(html);

    const result = getLinkHref(doc, 'canonical');
    assert.equal(result, 'https://example.com/page');
  });

  it('should return undefined if rel not found', () => {
    const html = '<link rel="icon" href="/favicon.ico">';
    const doc = parseHTML(html);

    const result = getLinkHref(doc, 'canonical');
    assert.equal(result, undefined);
  });

  it('should return first match if multiple links with same rel', () => {
    const html = `
      <link rel="alternate" href="/en">
      <link rel="alternate" href="/fr">
    `;
    const doc = parseHTML(html);

    const result = getLinkHref(doc, 'alternate');
    assert.equal(result, '/en');
  });
});

describe('getAllLinks', () => {
  it('should extract all links matching rel attribute', () => {
    const html = `
      <link rel="alternate" href="/en" hreflang="en" type="text/html">
      <link rel="alternate" href="/fr" hreflang="fr" type="text/html">
      <link rel="alternate" href="/de" hreflang="de" type="text/html">
    `;
    const doc = parseHTML(html);

    const result = getAllLinks(doc, 'alternate');

    assert.equal(result.length, 3);
    assert.equal(result[0].href, '/en');
    assert.equal(result[0].hreflang, 'en');
    assert.equal(result[0].type, 'text/html');

    assert.equal(result[1].href, '/fr');
    assert.equal(result[1].hreflang, 'fr');

    assert.equal(result[2].href, '/de');
    assert.equal(result[2].hreflang, 'de');
  });

  it('should return empty array if no matches', () => {
    const html = '<link rel="canonical" href="https://example.com">';
    const doc = parseHTML(html);

    const result = getAllLinks(doc, 'alternate');
    assert.equal(result.length, 0);
  });

  it('should extract all link attributes', () => {
    const html = `
      <link
        rel="alternate"
        href="https://example.com/rss"
        type="application/rss+xml"
        title="RSS Feed"
      >
    `;
    const doc = parseHTML(html);

    const result = getAllLinks(doc, 'alternate');

    assert.equal(result.length, 1);
    assert.equal(result[0].href, 'https://example.com/rss');
    assert.equal(result[0].type, 'application/rss+xml');
    assert.equal(result[0].title, 'RSS Feed');
    assert.equal(result[0].rel, 'alternate');
  });

  it('should skip links without href', () => {
    const html = `
      <link rel="alternate" type="text/html">
      <link rel="alternate" href="/valid">
    `;
    const doc = parseHTML(html);

    const result = getAllLinks(doc, 'alternate');

    assert.equal(result.length, 1);
    assert.equal(result[0].href, '/valid');
  });

  it('should handle apple-touch-icon with sizes', () => {
    const html = `
      <link rel="apple-touch-icon" href="/icon-60.png" sizes="60x60">
      <link rel="apple-touch-icon" href="/icon-120.png" sizes="120x120">
    `;
    const doc = parseHTML(html);

    const result = getAllLinks(doc, 'apple-touch-icon');

    assert.equal(result.length, 2);
    assert.equal(result[0].sizes, '60x60');
    assert.equal(result[1].sizes, '120x120');
  });

  it('should handle mask-icon with color', () => {
    const html = '<link rel="mask-icon" href="/safari-icon.svg" color="#5bbad5">';
    const doc = parseHTML(html);

    const result = getAllLinks(doc, 'mask-icon');

    assert.equal(result.length, 1);
    assert.equal(result[0].href, '/safari-icon.svg');
    assert.equal(result[0].color, '#5bbad5');
  });
});

describe('getAllLinksByRels', () => {
  it('should extract links matching any of the provided rels', () => {
    const html = `
      <link rel="icon" href="/favicon.ico">
      <link rel="shortcut icon" href="/favicon-16.png">
      <link rel="canonical" href="https://example.com">
    `;
    const doc = parseHTML(html);

    const result = getAllLinksByRels(doc, ['icon', 'shortcut icon']);

    assert.equal(result.length, 2);
    assert.equal(result[0].href, '/favicon.ico');
    assert.equal(result[1].href, '/favicon-16.png');
  });

  it('should return empty array if no matches', () => {
    const html = '<link rel="canonical" href="https://example.com">';
    const doc = parseHTML(html);

    const result = getAllLinksByRels(doc, ['icon', 'shortcut icon']);
    assert.equal(result.length, 0);
  });
});

describe('getAllLinksByPrefix', () => {
  it('should extract all links where rel starts with prefix', () => {
    const html = `
      <link rel="apple-touch-icon" href="/icon1.png">
      <link rel="apple-touch-icon-precomposed" href="/icon2.png">
      <link rel="apple-mobile-web-app-title" href="/title">
      <link rel="icon" href="/favicon.ico">
    `;
    const doc = parseHTML(html);

    const result = getAllLinksByPrefix(doc, 'apple-');

    assert.equal(result.length, 3);
    assert.equal(result[0].rel, 'apple-touch-icon');
    assert.equal(result[1].rel, 'apple-touch-icon-precomposed');
    assert.equal(result[2].rel, 'apple-mobile-web-app-title');
  });

  it('should return empty array if no matches', () => {
    const html = '<link rel="canonical" href="https://example.com">';
    const doc = parseHTML(html);

    const result = getAllLinksByPrefix(doc, 'apple-');
    assert.equal(result.length, 0);
  });
});
