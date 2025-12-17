import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractIcons } from './extract.js';

describe('extractIcons', () => {
  it('should extract favicon', () => {
    const html = '<link rel="icon" href="/favicon.ico">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.equal(result.favicon, '/favicon.ico');
  });

  it('should extract shortcut icon', () => {
    const html = '<link rel="shortcut icon" href="/favicon-16.png">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.equal(result.shortcutIcon, '/favicon-16.png');
  });

  it('should extract both icon types', () => {
    const html = `
      <link rel="icon" href="/favicon.ico">
      <link rel="shortcut icon" href="/favicon-16.png">
    `;
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.equal(result.favicon, '/favicon.ico');
    assert.equal(result.shortcutIcon, '/favicon-16.png');
  });

  it('should extract Apple touch icons', () => {
    const html = `
      <link rel="apple-touch-icon" href="/apple-icon-60.png" sizes="60x60">
      <link rel="apple-touch-icon" href="/apple-icon-120.png" sizes="120x120">
      <link rel="apple-touch-icon" href="/apple-icon-180.png" sizes="180x180">
    `;
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.appleTouchIcons);
    assert.equal(result.appleTouchIcons.length, 3);
    assert.equal(result.appleTouchIcons[0].url, '/apple-icon-60.png');
    assert.equal(result.appleTouchIcons[0].sizes, '60x60');
    assert.equal(result.appleTouchIcons[1].sizes, '120x120');
    assert.equal(result.appleTouchIcons[2].sizes, '180x180');
  });

  it('should mark precomposed Apple touch icons', () => {
    const html = `
      <link rel="apple-touch-icon" href="/apple-icon.png">
      <link rel="apple-touch-icon-precomposed" href="/apple-icon-precomposed.png">
    `;
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.appleTouchIcons);
    assert.equal(result.appleTouchIcons.length, 2);
    assert.equal(result.appleTouchIcons[0].precomposed, undefined);
    assert.equal(result.appleTouchIcons[1].precomposed, true);
  });

  it('should extract Safari mask icon', () => {
    const html = '<link rel="mask-icon" href="/safari-icon.svg" color="#5bbad5">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.maskIcon);
    assert.equal(result.maskIcon.url, '/safari-icon.svg');
    assert.equal(result.maskIcon.color, '#5bbad5');
  });

  it('should extract mask icon without color', () => {
    const html = '<link rel="mask-icon" href="/safari-icon.svg">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.maskIcon);
    assert.equal(result.maskIcon.url, '/safari-icon.svg');
    assert.equal(result.maskIcon.color, undefined);
  });

  it('should extract Microsoft tile metadata', () => {
    const html = `
      <meta name="msapplication-TileImage" content="/mstile-144.png">
      <meta name="msapplication-TileColor" content="#da532c">
      <meta name="msapplication-config" content="/browserconfig.xml">
    `;
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.msTile);
    assert.equal(result.msTile.image, '/mstile-144.png');
    assert.equal(result.msTile.color, '#da532c');
    assert.equal(result.msTile.config, '/browserconfig.xml');
  });

  it('should extract partial Microsoft tile metadata', () => {
    const html = '<meta name="msapplication-TileColor" content="#ffffff">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.msTile);
    assert.equal(result.msTile.color, '#ffffff');
    assert.equal(result.msTile.image, undefined);
  });

  it('should extract fluid icon', () => {
    const html = '<link rel="fluid-icon" href="/fluidicon.png">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.equal(result.fluidIcon, '/fluidicon.png');
  });

  it('should return empty object if no icons found', () => {
    const html = '<html><head><title>No Icons</title></head></html>';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.deepEqual(result, {});
  });

  it('should extract complete icon setup', () => {
    const html = `
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
        <meta name="msapplication-TileColor" content="#da532c">
        <meta name="msapplication-TileImage" content="/mstile-144x144.png">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.favicon);
    assert.ok(result.appleTouchIcons);
    assert.ok(result.maskIcon);
    assert.ok(result.msTile);
  });

  it('should handle Apple touch icons without sizes', () => {
    const html = '<link rel="apple-touch-icon" href="/apple-icon-default.png">';
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    assert.ok(result.appleTouchIcons);
    assert.equal(result.appleTouchIcons.length, 1);
    assert.equal(result.appleTouchIcons[0].url, '/apple-icon-default.png');
    assert.equal(result.appleTouchIcons[0].sizes, undefined);
  });

  it('should take first icon if multiple with same rel', () => {
    const html = `
      <link rel="icon" href="/favicon1.ico">
      <link rel="icon" href="/favicon2.ico">
    `;
    const doc = parseHTML(html);

    const result = extractIcons(doc);

    // Should take first one
    assert.equal(result.favicon, '/favicon1.ico');
  });
});
