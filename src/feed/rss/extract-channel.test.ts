import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRSSXML } from './xml-parser.js';
import { extractChannel } from './extract-channel.js';

describe('extractChannel', () => {
  it('should extract required fields', () => {
    const xml = `
      <channel>
        <title>Test Feed</title>
        <link>https://example.com</link>
        <description>A test feed</description>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.title, 'Test Feed');
    assert.equal(channel.link, 'https://example.com');
    assert.equal(channel.description, 'A test feed');
  });

  it('should handle CDATA in required fields', () => {
    const xml = `
      <channel>
        <title><![CDATA[Test Feed]]></title>
        <link><![CDATA[https://example.com]]></link>
        <description><![CDATA[A test feed]]></description>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.title, 'Test Feed');
    assert.equal(channel.link, 'https://example.com');
    assert.equal(channel.description, 'A test feed');
  });

  it('should extract optional text fields', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <language>en-us</language>
        <copyright>Copyright 2025</copyright>
        <managingEditor>editor@example.com</managingEditor>
        <webMaster>webmaster@example.com</webMaster>
        <generator>Test Generator 1.0</generator>
        <docs>https://example.com/rss</docs>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.language, 'en-us');
    assert.equal(channel.copyright, 'Copyright 2025');
    assert.equal(channel.managingEditor, 'editor@example.com');
    assert.equal(channel.webMaster, 'webmaster@example.com');
    assert.equal(channel.generator, 'Test Generator 1.0');
    assert.equal(channel.docs, 'https://example.com/rss');
  });

  it('should extract and parse dates', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <pubDate>Wed, 17 Dec 2025 10:00:00 GMT</pubDate>
        <lastBuildDate>Wed, 17 Dec 2025 11:00:00 GMT</lastBuildDate>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.pubDate, '2025-12-17T10:00:00.000Z');
    assert.equal(channel.lastBuildDate, '2025-12-17T11:00:00.000Z');
  });

  it('should extract categories as array', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <category>Technology</category>
        <category>News</category>
        <category>Science</category>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(Array.isArray(channel.category));
    assert.equal(channel.category?.length, 3);
    assert.deepEqual(channel.category, ['Technology', 'News', 'Science']);
  });

  it('should extract ttl as number', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <ttl>60</ttl>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.ttl, 60);
    assert.equal(typeof channel.ttl, 'number');
  });

  it('should extract image with all fields', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <image>
          <url>https://example.com/logo.png</url>
          <title>Logo</title>
          <link>https://example.com</link>
          <width>144</width>
          <height>40</height>
          <description>Site logo</description>
        </image>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(channel.image);
    assert.equal(channel.image?.url, 'https://example.com/logo.png');
    assert.equal(channel.image?.title, 'Logo');
    assert.equal(channel.image?.link, 'https://example.com');
    assert.equal(channel.image?.width, 144);
    assert.equal(channel.image?.height, 40);
    assert.equal(channel.image?.description, 'Site logo');
  });

  it('should extract image with minimal fields', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <image>
          <url>https://example.com/logo.png</url>
          <title>Logo</title>
          <link>https://example.com</link>
        </image>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(channel.image);
    assert.equal(channel.image?.url, 'https://example.com/logo.png');
    assert.equal(channel.image?.width, undefined);
    assert.equal(channel.image?.height, undefined);
    assert.equal(channel.image?.description, undefined);
  });

  it('should extract cloud element', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <cloud domain="rpc.example.com" port="80" path="/RPC2"
               registerProcedure="pingMe" protocol="soap"/>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(channel.cloud);
    assert.equal(channel.cloud?.domain, 'rpc.example.com');
    assert.equal(channel.cloud?.port, 80);
    assert.equal(channel.cloud?.path, '/RPC2');
    assert.equal(channel.cloud?.registerProcedure, 'pingMe');
    assert.equal(channel.cloud?.protocol, 'soap');
  });

  it('should extract skipHours', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <skipHours>
          <hour>0</hour>
          <hour>1</hour>
          <hour>2</hour>
        </skipHours>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(Array.isArray(channel.skipHours));
    assert.deepEqual(channel.skipHours, [0, 1, 2]);
  });

  it('should extract skipDays', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <skipDays>
          <day>Saturday</day>
          <day>Sunday</day>
        </skipDays>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(Array.isArray(channel.skipDays));
    assert.deepEqual(channel.skipDays, ['Saturday', 'Sunday']);
  });

  it('should not include undefined optional fields', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.language, undefined);
    assert.equal(channel.copyright, undefined);
    assert.equal(channel.managingEditor, undefined);
    assert.equal(channel.webMaster, undefined);
    assert.equal(channel.pubDate, undefined);
    assert.equal(channel.lastBuildDate, undefined);
    assert.equal(channel.category, undefined);
    assert.equal(channel.generator, undefined);
    assert.equal(channel.docs, undefined);
    assert.equal(channel.ttl, undefined);
    assert.equal(channel.image, undefined);
    assert.equal(channel.cloud, undefined);
    assert.equal(channel.skipHours, undefined);
    assert.equal(channel.skipDays, undefined);
  });

  it('should handle invalid ttl gracefully', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <ttl>not a number</ttl>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.ttl, undefined);
  });

  it('should handle invalid dates gracefully', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <pubDate>Not a date</pubDate>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.pubDate, undefined);
  });

  it('should handle empty category elements', () => {
    const xml = `
      <channel>
        <title>Test</title>
        <link>https://example.com</link>
        <description>Test</description>
        <category></category>
        <category>  </category>
        <category>Valid</category>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.ok(Array.isArray(channel.category));
    assert.equal(channel.category?.length, 1);
    assert.deepEqual(channel.category, ['Valid']);
  });

  it('should trim whitespace from all text fields', () => {
    const xml = `
      <channel>
        <title>  Test Feed  </title>
        <link>  https://example.com  </link>
        <description>  A test feed  </description>
        <language>  en-us  </language>
      </channel>
    `;
    const doc = parseRSSXML(xml);
    const channel = extractChannel(doc);

    assert.equal(channel.title, 'Test Feed');
    assert.equal(channel.link, 'https://example.com');
    assert.equal(channel.description, 'A test feed');
    assert.equal(channel.language, 'en-us');
  });
});

