/**
 * Assets extraction tests.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractAssets } from './extract.js';

describe('extractAssets', () => {
  it('should extract image URLs from img tags', () => {
    const html = `
      <html>
        <head><base href="https://example.com/" /></head>
        <body>
          <img src="/image1.jpg" />
          <img src="https://cdn.example.com/image2.png" />
          <img src="relative/image3.gif" />
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc);

    assert.ok(assets.images);
    assert.equal(assets.images.length, 3);
    assert.ok(assets.images.includes('https://example.com/image1.jpg'));
    assert.ok(assets.images.includes('https://cdn.example.com/image2.png'));
    assert.ok(assets.images.includes('https://example.com/relative/image3.gif'));
  });

  it('should extract image URLs from srcset', () => {
    const html = `
      <html>
        <body>
          <img srcset="small.jpg 480w, medium.jpg 800w, large.jpg 1200w" />
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.images);
    assert.equal(assets.images.length, 3);
    assert.ok(assets.images.includes('https://example.com/small.jpg'));
    assert.ok(assets.images.includes('https://example.com/medium.jpg'));
    assert.ok(assets.images.includes('https://example.com/large.jpg'));
  });

  it('should extract images from picture elements', () => {
    const html = `
      <html>
        <body>
          <picture>
            <source srcset="image.webp" type="image/webp" />
            <source srcset="image.avif" type="image/avif" />
            <img src="image.jpg" />
          </picture>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.images);
    assert.ok(assets.images.includes('https://example.com/image.webp'));
    assert.ok(assets.images.includes('https://example.com/image.avif'));
    assert.ok(assets.images.includes('https://example.com/image.jpg'));
  });

  it('should extract images from OpenGraph meta tags', () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://example.com/og-image.jpg" />
          <meta property="og:image:url" content="/another-image.png" />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.images);
    assert.ok(assets.images.includes('https://example.com/og-image.jpg'));
    assert.ok(assets.images.includes('https://example.com/another-image.png'));
  });

  it('should extract images from Twitter Card meta tags', () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg" />
          <meta name="twitter:image:src" content="/twitter-alt.png" />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.images);
    assert.ok(assets.images.includes('https://example.com/twitter-image.jpg'));
    assert.ok(assets.images.includes('https://example.com/twitter-alt.png'));
  });

  it('should deduplicate image URLs', () => {
    const html = `
      <html>
        <body>
          <img src="/image.jpg" />
          <img src="https://example.com/image.jpg" />
          <img srcset="/image.jpg 1x" />
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.images);
    assert.equal(assets.images.length, 1);
    assert.equal(assets.images[0], 'https://example.com/image.jpg');
  });

  it('should extract stylesheet URLs', () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="/styles.css" />
          <link rel="stylesheet" href="https://cdn.example.com/bundle.css" />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.stylesheets);
    assert.equal(assets.stylesheets.length, 2);
    assert.ok(assets.stylesheets.includes('https://example.com/styles.css'));
    assert.ok(assets.stylesheets.includes('https://cdn.example.com/bundle.css'));
  });

  it('should extract script URLs', () => {
    const html = `
      <html>
        <head>
          <script src="/app.js"></script>
          <script src="https://cdn.example.com/vendor.js"></script>
        </head>
        <body>
          <script src="analytics.js"></script>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.scripts);
    assert.equal(assets.scripts.length, 3);
    assert.ok(assets.scripts.includes('https://example.com/app.js'));
    assert.ok(assets.scripts.includes('https://cdn.example.com/vendor.js'));
    assert.ok(assets.scripts.includes('https://example.com/analytics.js'));
  });

  it('should extract font URLs from style tags', () => {
    const html = `
      <html>
        <head>
          <style>
            @font-face {
              font-family: 'MyFont';
              src: url('/fonts/myfont.woff2') format('woff2'),
                   url('/fonts/myfont.woff') format('woff');
            }
          </style>
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.fonts);
    assert.equal(assets.fonts.length, 2);
    assert.ok(assets.fonts.includes('https://example.com/fonts/myfont.woff2'));
    assert.ok(assets.fonts.includes('https://example.com/fonts/myfont.woff'));
  });

  it('should extract font URLs from inline styles', () => {
    const html = `
      <html>
        <body>
          <div style="font-family: MyFont; src: url('font.ttf')"></div>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.fonts);
    assert.ok(assets.fonts.includes('https://example.com/font.ttf'));
  });

  it('should extract font URLs from preload hints', () => {
    const html = `
      <html>
        <head>
          <link rel="preload" href="/fonts/custom.woff2" as="font" crossorigin />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.fonts);
    assert.ok(assets.fonts.includes('https://example.com/fonts/custom.woff2'));
  });

  it('should extract media URLs from video and audio elements', () => {
    const html = `
      <html>
        <body>
          <video src="/video.mp4"></video>
          <audio src="/audio.mp3"></audio>
          <video>
            <source src="/video.webm" type="video/webm" />
            <source src="/video.mp4" type="video/mp4" />
            <track src="/subtitles.vtt" kind="subtitles" />
          </video>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.media);
    assert.ok(assets.media.includes('https://example.com/video.mp4'));
    assert.ok(assets.media.includes('https://example.com/audio.mp3'));
    assert.ok(assets.media.includes('https://example.com/video.webm'));
    assert.ok(assets.media.includes('https://example.com/subtitles.vtt'));
  });

  it('should extract media URLs from OpenGraph meta tags', () => {
    const html = `
      <html>
        <head>
          <meta property="og:video" content="https://example.com/video.mp4" />
          <meta property="og:audio" content="/audio.mp3" />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.media);
    assert.ok(assets.media.includes('https://example.com/video.mp4'));
    assert.ok(assets.media.includes('https://example.com/audio.mp3'));
  });

  it('should extract manifest URLs', () => {
    const html = `
      <html>
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.manifests);
    assert.equal(assets.manifests.length, 1);
    assert.equal(assets.manifests[0], 'https://example.com/manifest.json');
  });

  it('should extract preload and prefetch hints', () => {
    const html = `
      <html>
        <head>
          <link rel="preload" href="/app.js" as="script" />
          <link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin />
          <link rel="prefetch" href="/next-page.html" />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.preloads);
    assert.equal(assets.preloads.length, 3);

    const preloadScript = assets.preloads.find((p) => p.as === 'script');
    assert.ok(preloadScript);
    assert.equal(preloadScript.url, 'https://example.com/app.js');
    assert.equal(preloadScript.prefetch, false);

    const preloadFont = assets.preloads.find((p) => p.as === 'font');
    assert.ok(preloadFont);
    assert.equal(preloadFont.url, 'https://example.com/font.woff2');
    assert.equal(preloadFont.type, 'font/woff2');
    assert.equal(preloadFont.crossorigin, '');

    const prefetch = assets.preloads.find((p) => p.prefetch === true);
    assert.ok(prefetch);
    assert.equal(prefetch.url, 'https://example.com/next-page.html');
  });

  it('should extract connection hints', () => {
    const html = `
      <html>
        <head>
          <link rel="dns-prefetch" href="https://cdn.example.com" />
          <link rel="preconnect" href="https://api.example.com" crossorigin />
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc);

    assert.ok(assets.connectionHints);
    assert.equal(assets.connectionHints.length, 2);

    const dnsPrefetch = assets.connectionHints.find((h) => !h.preconnect);
    assert.ok(dnsPrefetch);
    assert.equal(dnsPrefetch.url, 'https://cdn.example.com/');

    const preconnect = assets.connectionHints.find((h) => h.preconnect);
    assert.ok(preconnect);
    assert.equal(preconnect.url, 'https://api.example.com/');
    assert.equal(preconnect.crossorigin, '');
  });

  it('should respect base tag for URL resolution', () => {
    const html = `
      <html>
        <head>
          <base href="https://example.com/subdir/" />
          <link rel="stylesheet" href="styles.css" />
        </head>
        <body>
          <img src="image.jpg" />
          <script src="app.js"></script>
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc);

    assert.ok(assets.stylesheets);
    assert.equal(assets.stylesheets[0], 'https://example.com/subdir/styles.css');

    assert.ok(assets.images);
    assert.equal(assets.images[0], 'https://example.com/subdir/image.jpg');

    assert.ok(assets.scripts);
    assert.equal(assets.scripts[0], 'https://example.com/subdir/app.js');
  });

  it('should use provided baseUrl parameter when no base tag exists', () => {
    const html = `
      <html>
        <body>
          <img src="/image.jpg" />
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com/page/');

    assert.ok(assets.images);
    assert.equal(assets.images[0], 'https://example.com/image.jpg');
  });

  it('should return empty object when no assets found', () => {
    const html = `
      <html>
        <head><title>Empty Page</title></head>
        <body><p>No assets here</p></body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc);

    assert.deepEqual(assets, {});
  });

  it('should handle malformed URLs gracefully', () => {
    const html = `
      <html>
        <body>
          <img src="" />
          <img src="   " />
          <script src="javascript:void(0)"></script>
          <link rel="stylesheet" href="not a valid url" />
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    // Should not throw, and should only include valid URLs
    assert.ok(assets);
  });

  it('should handle srcset with various formats', () => {
    const html = `
      <html>
        <body>
          <img srcset="small.jpg 1x, medium.jpg 2x, large.jpg 3x" />
          <img srcset="mobile.jpg 480w, tablet.jpg 768w, desktop.jpg 1200w" />
        </body>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.images);
    assert.equal(assets.images.length, 6);
    assert.ok(assets.images.includes('https://example.com/small.jpg'));
    assert.ok(assets.images.includes('https://example.com/medium.jpg'));
    assert.ok(assets.images.includes('https://example.com/large.jpg'));
    assert.ok(assets.images.includes('https://example.com/mobile.jpg'));
    assert.ok(assets.images.includes('https://example.com/tablet.jpg'));
    assert.ok(assets.images.includes('https://example.com/desktop.jpg'));
  });

  it('should extract only font extensions from CSS', () => {
    const html = `
      <html>
        <head>
          <style>
            body { background: url('/bg.jpg'); }
            @font-face {
              font-family: 'MyFont';
              src: url('/font.woff2');
            }
          </style>
        </head>
      </html>
    `;
    const doc = parseHTML(html);
    const assets = extractAssets(doc, 'https://example.com');

    assert.ok(assets.fonts);
    assert.equal(assets.fonts.length, 1);
    assert.equal(assets.fonts[0], 'https://example.com/font.woff2');

    // Background image should not be in fonts
    assert.ok(!assets.fonts.includes('https://example.com/bg.jpg'));
  });
});
