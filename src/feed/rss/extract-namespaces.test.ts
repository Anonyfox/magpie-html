import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRSSXML } from './xml-parser.js';
import { extractNamespaces } from './extract-namespaces.js';

describe('extractNamespaces', () => {
  it('should extract content:encoded', () => {
    const xml = `
      <item>
        <title>Article</title>
        <content:encoded><![CDATA[<p>Full HTML content here</p>]]></content:encoded>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(ns.contentEncoded);
    assert.ok(ns.contentEncoded?.includes('<p>Full HTML content here</p>'));
  });

  it('should extract dc:creator', () => {
    const xml = `
      <item>
        <title>Article</title>
        <dc:creator>John Doe</dc:creator>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.equal(ns.dcCreator, 'John Doe');
  });

  it('should extract dc:date', () => {
    const xml = `
      <item>
        <title>Article</title>
        <dc:date>2025-12-17T10:00:00Z</dc:date>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(ns.dcDate);
    assert.equal(ns.dcDate, '2025-12-17T10:00:00.000Z');
  });

  it('should extract multiple dc:subject elements', () => {
    const xml = `
      <item>
        <title>Article</title>
        <dc:subject>Technology</dc:subject>
        <dc:subject>Science</dc:subject>
        <dc:subject>Innovation</dc:subject>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(Array.isArray(ns.dcSubject));
    assert.equal(ns.dcSubject?.length, 3);
    assert.deepEqual(ns.dcSubject, ['Technology', 'Science', 'Innovation']);
  });

  it('should extract media:content with attributes', () => {
    const xml = `
      <item>
        <title>Article</title>
        <media:content url="https://example.com/video.mp4"
                       type="video/mp4"
                       medium="video"
                       width="640"
                       height="480"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(Array.isArray(ns.mediaContent));
    assert.equal(ns.mediaContent?.length, 1);
    const media = ns.mediaContent?.[0];
    assert.equal(media?.url, 'https://example.com/video.mp4');
    assert.equal(media?.type, 'video/mp4');
    assert.equal(media?.medium, 'video');
    assert.equal(media?.width, 640);
    assert.equal(media?.height, 480);
  });

  it('should extract multiple media:content elements', () => {
    const xml = `
      <item>
        <title>Article</title>
        <media:content url="https://example.com/video-low.mp4" width="320" height="240"/>
        <media:content url="https://example.com/video-high.mp4" width="1920" height="1080"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.equal(ns.mediaContent?.length, 2);
    assert.equal(ns.mediaContent?.[0].width, 320);
    assert.equal(ns.mediaContent?.[1].width, 1920);
  });

  it('should extract media:thumbnail with attributes', () => {
    const xml = `
      <item>
        <title>Article</title>
        <media:thumbnail url="https://example.com/thumb.jpg" width="150" height="150"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(Array.isArray(ns.mediaThumbnail));
    assert.equal(ns.mediaThumbnail?.length, 1);
    const thumb = ns.mediaThumbnail?.[0];
    assert.equal(thumb?.url, 'https://example.com/thumb.jpg');
    assert.equal(thumb?.width, 150);
    assert.equal(thumb?.height, 150);
  });

  it('should extract multiple media:thumbnail elements', () => {
    const xml = `
      <item>
        <title>Article</title>
        <media:thumbnail url="https://example.com/thumb-small.jpg" width="100" height="100"/>
        <media:thumbnail url="https://example.com/thumb-large.jpg" width="400" height="300"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.equal(ns.mediaThumbnail?.length, 2);
    assert.equal(ns.mediaThumbnail?.[0].width, 100);
    assert.equal(ns.mediaThumbnail?.[1].width, 400);
  });

  it('should handle media elements without optional attributes', () => {
    const xml = `
      <item>
        <title>Article</title>
        <media:content url="https://example.com/video.mp4"/>
        <media:thumbnail url="https://example.com/thumb.jpg"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.equal(ns.mediaContent?.[0].url, 'https://example.com/video.mp4');
    assert.equal(ns.mediaContent?.[0].type, undefined);
    assert.equal(ns.mediaThumbnail?.[0].url, 'https://example.com/thumb.jpg');
    assert.equal(ns.mediaThumbnail?.[0].width, undefined);
  });

  it('should return empty object when no namespaces present', () => {
    const xml = `
      <item>
        <title>Simple Article</title>
        <description>Just standard RSS</description>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.equal(ns.contentEncoded, undefined);
    assert.equal(ns.dcCreator, undefined);
    assert.equal(ns.dcDate, undefined);
    assert.equal(ns.dcSubject, undefined);
    assert.equal(ns.mediaContent, undefined);
    assert.equal(ns.mediaThumbnail, undefined);
  });

  it('should handle CDATA in namespace elements', () => {
    const xml = `
      <item>
        <title>Article</title>
        <content:encoded><![CDATA[<div>HTML content & special chars</div>]]></content:encoded>
        <dc:creator><![CDATA[Author & Co.]]></dc:creator>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(ns.contentEncoded?.includes('<div>HTML content & special chars</div>'));
    assert.equal(ns.dcCreator, 'Author & Co.');
  });

  it('should extract all namespace types together', () => {
    const xml = `
      <item>
        <title>Complete Article</title>
        <content:encoded><![CDATA[<p>Full content</p>]]></content:encoded>
        <dc:creator>Jane Smith</dc:creator>
        <dc:date>2025-12-17T10:00:00Z</dc:date>
        <dc:subject>Tech</dc:subject>
        <dc:subject>News</dc:subject>
        <media:content url="https://example.com/video.mp4" type="video/mp4"/>
        <media:thumbnail url="https://example.com/thumb.jpg" width="200" height="150"/>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(ns.contentEncoded);
    assert.equal(ns.dcCreator, 'Jane Smith');
    assert.ok(ns.dcDate);
    assert.equal(ns.dcSubject?.length, 2);
    assert.equal(ns.mediaContent?.length, 1);
    assert.equal(ns.mediaThumbnail?.length, 1);
  });

  it('should filter out empty dc:subject elements', () => {
    const xml = `
      <item>
        <title>Article</title>
        <dc:subject></dc:subject>
        <dc:subject>  </dc:subject>
        <dc:subject>Valid</dc:subject>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.equal(ns.dcSubject?.length, 1);
    assert.deepEqual(ns.dcSubject, ['Valid']);
  });

  it('should preserve line breaks in content:encoded', () => {
    const xml = `
      <item>
        <title>Article</title>
        <content:encoded><![CDATA[<p>Paragraph 1</p>
<p>Paragraph 2</p>
<p>Paragraph 3</p>]]></content:encoded>
      </item>
    `;
    const doc = parseRSSXML(xml);
    const ns = extractNamespaces(doc);

    assert.ok(ns.contentEncoded?.includes('\n'));
    assert.ok(ns.contentEncoded?.includes('Paragraph 1'));
    assert.ok(ns.contentEncoded?.includes('Paragraph 3'));
  });
});

