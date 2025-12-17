/**
 * Links extraction tests.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractLinks } from './extract.js';

describe('extractLinks', () => {
  it('should extract basic links', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.equal(links.all.length, 3);
    assert.equal(links.totalCount, 3);
  });

  it('should normalize relative URLs', () => {
    const html = `
      <html>
        <body>
          <a href="/about">About</a>
          <a href="contact">Contact</a>
          <a href="../blog">Blog</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com/dir/page');

    assert.ok(links.all);
    assert.ok(links.all.some((l) => l.url === 'https://example.com/about'));
    assert.ok(links.all.some((l) => l.url === 'https://example.com/dir/contact'));
    assert.ok(links.all.some((l) => l.url === 'https://example.com/blog'));
  });

  it('should categorize internal and external links', () => {
    const html = `
      <html>
        <body>
          <a href="/internal1">Internal 1</a>
          <a href="https://example.com/internal2">Internal 2</a>
          <a href="https://external.com/page">External</a>
          <a href="https://another.com/page">Another External</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.internal);
    assert.equal(links.internal.length, 2);
    assert.equal(links.internalCount, 2);

    assert.ok(links.external);
    assert.equal(links.external.length, 2);
    assert.equal(links.externalCount, 2);

    // Check internal links
    for (const link of links.internal) {
      assert.ok(link.internal);
      assert.ok(!link.external);
      assert.ok(link.url.startsWith('https://example.com'));
    }

    // Check external links
    for (const link of links.external) {
      assert.ok(link.external);
      assert.ok(!link.internal);
      assert.ok(!link.url.startsWith('https://example.com'));
    }
  });

  it('should filter by scope: internal', () => {
    const html = `
      <html>
        <body>
          <a href="/internal">Internal</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', { scope: 'internal' });

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.ok(links.all[0].internal);
    assert.equal(links.internalCount, 1);
    assert.equal(links.externalCount, 0);
  });

  it('should filter by scope: external', () => {
    const html = `
      <html>
        <body>
          <a href="/internal">Internal</a>
          <a href="https://external.com">External</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', { scope: 'external' });

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.ok(links.all[0].external);
    assert.equal(links.externalCount, 1);
    assert.equal(links.internalCount, 0);
  });

  it('should extract link text and title', () => {
    const html = `
      <html>
        <body>
          <a href="/page" title="Go to page">Click Here</a>
          <a href="/about">About Us</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    const firstLink = links.all[0];
    assert.equal(firstLink.text, 'Click Here');
    assert.equal(firstLink.title, 'Go to page');

    const secondLink = links.all[1];
    assert.equal(secondLink.text, 'About Us');
    assert.ok(!secondLink.title);
  });

  it('should detect nofollow links', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Normal</a>
          <a href="/page2" rel="nofollow">NoFollow</a>
          <a href="/page3" rel="nofollow noopener">NoFollow NoOpener</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.nofollow);
    assert.equal(links.nofollow.length, 2);
    assert.equal(links.nofollowCount, 2);

    const nofollowLink = links.nofollow[0];
    assert.ok(nofollowLink.nofollow);
    assert.equal(nofollowLink.rel, 'nofollow');
  });

  it('should detect UGC and sponsored links', () => {
    const html = `
      <html>
        <body>
          <a href="/ugc" rel="ugc">User Content</a>
          <a href="/sponsored" rel="sponsored">Sponsored</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    const ugcLink = links.all.find((l) => l.ugc);
    assert.ok(ugcLink);
    assert.ok(ugcLink.ugc);

    const sponsoredLink = links.all.find((l) => l.sponsored);
    assert.ok(sponsoredLink);
    assert.ok(sponsoredLink.sponsored);
  });

  it('should detect noopener and noreferrer', () => {
    const html = `
      <html>
        <body>
          <a href="https://external.com" rel="noopener noreferrer" target="_blank">External</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    const link = links.all[0];
    assert.ok(link.noopener);
    assert.ok(link.noreferrer);
    assert.equal(link.target, '_blank');
  });

  it('should exclude links by rel attribute', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Normal</a>
          <a href="/page2" rel="nofollow">NoFollow</a>
          <a href="/page3" rel="sponsored">Sponsored</a>
          <a href="/page4" rel="ugc">UGC</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', {
      excludeRel: ['nofollow', 'sponsored', 'ugc'],
    });

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.equal(links.all[0].url, 'https://example.com/page1');
  });

  it('should include only links with specific rel', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Normal</a>
          <a href="/page2" rel="nofollow">NoFollow</a>
          <a href="/page3" rel="sponsored">Sponsored</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', {
      includeRel: ['nofollow'],
    });

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.ok(links.all[0].nofollow);
  });

  it('should exclude hash-only links by default', () => {
    const html = `
      <html>
        <body>
          <a href="#section1">Section 1</a>
          <a href="#section2">Section 2</a>
          <a href="/page">Page</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.equal(links.all[0].url, 'https://example.com/page');
  });

  it('should include hash links when enabled', () => {
    const html = `
      <html>
        <body>
          <a href="#section1">Section 1</a>
          <a href="/page#section">Page Section</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', {
      includeHashLinks: true,
    });

    assert.ok(links.all);
    assert.equal(links.all.length, 2);
  });

  it('should skip non-HTTP schemes', () => {
    const html = `
      <html>
        <body>
          <a href="mailto:test@example.com">Email</a>
          <a href="tel:+1234567890">Phone</a>
          <a href="javascript:void(0)">JavaScript</a>
          <a href="ftp://files.example.com">FTP</a>
          <a href="https://example.com">HTTPS</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.equal(links.all[0].url, 'https://example.com/');
  });

  it('should deduplicate URLs by default', () => {
    const html = `
      <html>
        <body>
          <a href="/page">Link 1</a>
          <a href="/page">Link 2</a>
          <a href="https://example.com/page">Link 3</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.equal(links.all[0].text, 'Link 1'); // Keeps first occurrence
  });

  it('should not deduplicate when disabled', () => {
    const html = `
      <html>
        <body>
          <a href="/page">Link 1</a>
          <a href="/page">Link 2</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', {
      deduplicate: false,
    });

    assert.ok(links.all);
    assert.equal(links.all.length, 2);
  });

  it('should respect limit option', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Page 1</a>
          <a href="/page2">Page 2</a>
          <a href="/page3">Page 3</a>
          <a href="/page4">Page 4</a>
          <a href="/page5">Page 5</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com', { limit: 3 });

    assert.ok(links.all);
    assert.equal(links.all.length, 3);
    assert.equal(links.totalCount, 3);
  });

  it('should respect base tag for URL resolution', () => {
    const html = `
      <html>
        <head>
          <base href="https://example.com/subdir/" />
        </head>
        <body>
          <a href="page">Relative Page</a>
          <a href="/absolute">Absolute Page</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc);

    assert.ok(links.all);
    assert.ok(links.all.some((l) => l.url === 'https://example.com/subdir/page'));
    assert.ok(links.all.some((l) => l.url === 'https://example.com/absolute'));
  });

  it('should handle links without href gracefully', () => {
    const html = `
      <html>
        <body>
          <a>No Href</a>
          <a href="">Empty Href</a>
          <a href="   ">Whitespace Href</a>
          <a href="/valid">Valid</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.equal(links.all.length, 1);
    assert.equal(links.all[0].url, 'https://example.com/valid');
  });

  it('should handle malformed URLs gracefully', () => {
    const html = `
      <html>
        <body>
          <a href="ht!tp://invalid">Invalid</a>
          <a href="/valid">Valid</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    // Should not throw and should include valid links
    assert.ok(links.all);
    assert.ok(links.all.length >= 1);
  });

  it('should return empty object when no links found', () => {
    const html = `
      <html>
        <body>
          <p>No links here</p>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.equal(links.totalCount, 0);
    assert.ok(!links.all);
    assert.ok(!links.internal);
    assert.ok(!links.external);
  });

  it('should handle crawler use case', () => {
    const html = `
      <html>
        <body>
          <a href="/page1">Follow This</a>
          <a href="/page2" rel="nofollow">Don't Follow</a>
          <a href="/page3" rel="ugc">User Content</a>
          <a href="/page4" rel="sponsored">Sponsored</a>
          <a href="https://external.com">External</a>
          <a href="https://example.com/internal">Internal</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);

    // Typical crawler configuration
    const links = extractLinks(doc, 'https://example.com', {
      scope: 'internal',
      excludeRel: ['nofollow', 'ugc', 'sponsored'],
      includeHashLinks: false,
    });

    assert.ok(links.all);
    assert.equal(links.all.length, 2); // Only /page1 and /internal
    assert.ok(links.all.every((l) => l.internal));
    assert.ok(links.all.every((l) => !l.nofollow));
  });

  it('should extract target attribute', () => {
    const html = `
      <html>
        <body>
          <a href="/page1" target="_blank">New Tab</a>
          <a href="/page2" target="_self">Same Tab</a>
          <a href="/page3">No Target</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.equal(links.all[0].target, '_blank');
    assert.equal(links.all[1].target, '_self');
    assert.ok(!links.all[2].target);
  });

  it('should handle case-insensitive rel attributes', () => {
    const html = `
      <html>
        <body>
          <a href="/page1" rel="NOFOLLOW">NoFollow Uppercase</a>
          <a href="/page2" rel="NoOpener">NoOpener Mixed</a>
          <a href="/page3" rel="UGC">UGC Uppercase</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    assert.ok(links.all[0].nofollow);
    assert.ok(links.all[1].noopener);
    assert.ok(links.all[2].ugc);
  });

  it('should handle multiple rel values', () => {
    const html = `
      <html>
        <body>
          <a href="https://external.com" rel="nofollow noopener noreferrer external">External Link</a>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const links = extractLinks(doc, 'https://example.com');

    assert.ok(links.all);
    const link = links.all[0];
    assert.ok(link.nofollow);
    assert.ok(link.noopener);
    assert.ok(link.noreferrer);
    assert.equal(link.rel, 'nofollow noopener noreferrer external');
  });
});
