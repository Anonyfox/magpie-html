import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractTwitterCard } from './extract.js';

describe('extractTwitterCard', () => {
  it('should extract basic Twitter Card metadata', () => {
    const html = `
      <meta name="twitter:card" content="summary">
      <meta name="twitter:site" content="@example">
      <meta name="twitter:creator" content="@author">
      <meta name="twitter:title" content="Test Title">
      <meta name="twitter:description" content="Test description">
      <meta name="twitter:image" content="https://example.com/image.jpg">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.equal(result.card, 'summary');
    assert.equal(result.site, '@example');
    assert.equal(result.creator, '@author');
    assert.equal(result.title, 'Test Title');
    assert.equal(result.description, 'Test description');
    assert.equal(result.image, 'https://example.com/image.jpg');
  });

  it('should extract summary_large_image card', () => {
    const html = `
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image:alt" content="Image description">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.equal(result.card, 'summary_large_image');
    assert.equal(result.imageAlt, 'Image description');
  });

  it('should extract app card with iPhone data', () => {
    const html = `
      <meta name="twitter:card" content="app">
      <meta name="twitter:app:name:iphone" content="My App">
      <meta name="twitter:app:id:iphone" content="12345">
      <meta name="twitter:app:url:iphone" content="myapp://open">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.equal(result.card, 'app');
    assert.ok(result.app);
    assert.ok(result.app.iphone);
    assert.equal(result.app.iphone.name, 'My App');
    assert.equal(result.app.iphone.id, '12345');
    assert.equal(result.app.iphone.url, 'myapp://open');
  });

  it('should extract app card with iPad data', () => {
    const html = `
      <meta name="twitter:app:name:ipad" content="My App HD">
      <meta name="twitter:app:id:ipad" content="54321">
      <meta name="twitter:app:url:ipad" content="myapp://open-hd">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.ok(result.app);
    assert.ok(result.app.ipad);
    assert.equal(result.app.ipad.name, 'My App HD');
    assert.equal(result.app.ipad.id, '54321');
    assert.equal(result.app.ipad.url, 'myapp://open-hd');
  });

  it('should extract app card with Google Play data', () => {
    const html = `
      <meta name="twitter:app:name:googleplay" content="My Android App">
      <meta name="twitter:app:id:googleplay" content="com.example.app">
      <meta name="twitter:app:url:googleplay" content="myapp://android-open">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.ok(result.app);
    assert.ok(result.app.googleplay);
    assert.equal(result.app.googleplay.name, 'My Android App');
    assert.equal(result.app.googleplay.id, 'com.example.app');
    assert.equal(result.app.googleplay.url, 'myapp://android-open');
  });

  it('should extract app card with multiple platforms', () => {
    const html = `
      <meta name="twitter:card" content="app">
      <meta name="twitter:app:name:iphone" content="iOS App">
      <meta name="twitter:app:id:iphone" content="111">
      <meta name="twitter:app:name:ipad" content="iPad App">
      <meta name="twitter:app:id:ipad" content="222">
      <meta name="twitter:app:name:googleplay" content="Android App">
      <meta name="twitter:app:id:googleplay" content="com.example">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.ok(result.app);
    assert.ok(result.app.iphone);
    assert.ok(result.app.ipad);
    assert.ok(result.app.googleplay);
    assert.equal(result.app.iphone.name, 'iOS App');
    assert.equal(result.app.ipad.name, 'iPad App');
    assert.equal(result.app.googleplay.name, 'Android App');
  });

  it('should extract player card metadata', () => {
    const html = `
      <meta name="twitter:card" content="player">
      <meta name="twitter:player" content="https://example.com/player">
      <meta name="twitter:player:width" content="1280">
      <meta name="twitter:player:height" content="720">
      <meta name="twitter:player:stream" content="https://example.com/stream.mp4">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.equal(result.card, 'player');
    assert.ok(result.player);
    assert.equal(result.player.url, 'https://example.com/player');
    assert.equal(result.player.width, 1280);
    assert.equal(result.player.height, 720);
    assert.equal(result.player.stream, 'https://example.com/stream.mp4');
  });

  it('should return empty object if no Twitter Card metadata present', () => {
    const html = '<html><head><title>No Twitter Card</title></head></html>';
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.deepEqual(result, {});
  });

  it('should handle partial app card data', () => {
    const html = `
      <meta name="twitter:app:name:iphone" content="My App">
      <meta name="twitter:app:id:googleplay" content="com.example.app">
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.ok(result.app);
    assert.ok(result.app.iphone);
    assert.equal(result.app.iphone.name, 'My App');
    assert.equal(result.app.iphone.id, undefined);
    assert.ok(result.app.googleplay);
    assert.equal(result.app.googleplay.id, 'com.example.app');
  });

  it('should extract complete Twitter Card for article', () => {
    const html = `
      <head>
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@techblog">
        <meta name="twitter:creator" content="@author_name">
        <meta name="twitter:title" content="Amazing Article Title">
        <meta name="twitter:description" content="This article explains everything you need to know">
        <meta name="twitter:image" content="https://example.com/featured.jpg">
        <meta name="twitter:image:alt" content="Featured image description">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractTwitterCard(doc);

    assert.equal(result.card, 'summary_large_image');
    assert.equal(result.site, '@techblog');
    assert.equal(result.creator, '@author_name');
    assert.equal(result.title, 'Amazing Article Title');
    assert.equal(result.description, 'This article explains everything you need to know');
    assert.equal(result.image, 'https://example.com/featured.jpg');
    assert.equal(result.imageAlt, 'Featured image description');
  });
});
