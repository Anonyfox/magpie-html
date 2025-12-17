import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractOpenGraph } from './extract.js';

describe('extractOpenGraph', () => {
  it('should extract basic OpenGraph metadata', () => {
    const html = `
      <meta property="og:title" content="Test Title">
      <meta property="og:type" content="website">
      <meta property="og:image" content="https://example.com/image.jpg">
      <meta property="og:url" content="https://example.com/page">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.equal(result.title, 'Test Title');
    assert.equal(result.type, 'website');
    assert.equal(result.image, 'https://example.com/image.jpg');
    assert.equal(result.url, 'https://example.com/page');
  });

  it('should extract description and site name', () => {
    const html = `
      <meta property="og:description" content="Test description">
      <meta property="og:site_name" content="Example Site">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.equal(result.description, 'Test description');
    assert.equal(result.siteName, 'Example Site');
  });

  it('should extract locale information', () => {
    const html = `
      <meta property="og:locale" content="en_US">
      <meta property="og:locale:alternate" content="fr_FR">
      <meta property="og:locale:alternate" content="de_DE">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.equal(result.locale, 'en_US');
    assert.deepEqual(result.localeAlternate, ['fr_FR', 'de_DE']);
  });

  it('should extract article metadata', () => {
    const html = `
      <meta property="og:type" content="article">
      <meta property="article:published_time" content="2024-01-01T00:00:00Z">
      <meta property="article:modified_time" content="2024-01-02T00:00:00Z">
      <meta property="article:author" content="John Doe">
      <meta property="article:author" content="Jane Smith">
      <meta property="article:section" content="Technology">
      <meta property="article:tag" content="javascript">
      <meta property="article:tag" content="typescript">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.article);
    assert.equal(result.article.publishedTime, '2024-01-01T00:00:00Z');
    assert.equal(result.article.modifiedTime, '2024-01-02T00:00:00Z');
    assert.deepEqual(result.article.authors, ['John Doe', 'Jane Smith']);
    assert.equal(result.article.section, 'Technology');
    assert.deepEqual(result.article.tags, ['javascript', 'typescript']);
  });

  it('should extract video metadata', () => {
    const html = `
      <meta property="og:video" content="https://example.com/video.mp4">
      <meta property="og:video:secure_url" content="https://example.com/video-secure.mp4">
      <meta property="og:video:type" content="video/mp4">
      <meta property="og:video:width" content="1920">
      <meta property="og:video:height" content="1080">
      <meta property="og:video:duration" content="120">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.video);
    assert.equal(result.video.url, 'https://example.com/video.mp4');
    assert.equal(result.video.secureUrl, 'https://example.com/video-secure.mp4');
    assert.equal(result.video.type, 'video/mp4');
    assert.equal(result.video.width, 1920);
    assert.equal(result.video.height, 1080);
    assert.equal(result.video.duration, 120);
  });

  it('should extract audio metadata', () => {
    const html = `
      <meta property="og:audio" content="https://example.com/audio.mp3">
      <meta property="og:audio:secure_url" content="https://example.com/audio-secure.mp3">
      <meta property="og:audio:type" content="audio/mpeg">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.audio);
    assert.equal(result.audio.url, 'https://example.com/audio.mp3');
    assert.equal(result.audio.secureUrl, 'https://example.com/audio-secure.mp3');
    assert.equal(result.audio.type, 'audio/mpeg');
  });

  it('should extract multiple images with metadata', () => {
    const html = `
      <meta property="og:image" content="https://example.com/image1.jpg">
      <meta property="og:image:width" content="800">
      <meta property="og:image:height" content="600">
      <meta property="og:image:alt" content="First image">
      <meta property="og:image" content="https://example.com/image2.jpg">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="900">
      <meta property="og:image:alt" content="Second image">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.images);
    assert.equal(result.images.length, 2);

    assert.equal(result.images[0].url, 'https://example.com/image1.jpg');
    assert.equal(result.images[0].width, 800);
    assert.equal(result.images[0].height, 600);
    assert.equal(result.images[0].alt, 'First image');

    assert.equal(result.images[1].url, 'https://example.com/image2.jpg');
    assert.equal(result.images[1].width, 1200);
    assert.equal(result.images[1].height, 900);
    assert.equal(result.images[1].alt, 'Second image');
  });

  it('should extract book metadata', () => {
    const html = `
      <meta property="og:type" content="book">
      <meta property="book:author" content="Author One">
      <meta property="book:author" content="Author Two">
      <meta property="book:isbn" content="978-3-16-148410-0">
      <meta property="book:release_date" content="2024-01-01">
      <meta property="book:tag" content="fiction">
      <meta property="book:tag" content="adventure">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.book);
    assert.deepEqual(result.book.authors, ['Author One', 'Author Two']);
    assert.equal(result.book.isbn, '978-3-16-148410-0');
    assert.equal(result.book.releaseDate, '2024-01-01');
    assert.deepEqual(result.book.tags, ['fiction', 'adventure']);
  });

  it('should extract profile metadata', () => {
    const html = `
      <meta property="og:type" content="profile">
      <meta property="profile:first_name" content="John">
      <meta property="profile:last_name" content="Doe">
      <meta property="profile:username" content="johndoe">
      <meta property="profile:gender" content="male">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.profile);
    assert.equal(result.profile.firstName, 'John');
    assert.equal(result.profile.lastName, 'Doe');
    assert.equal(result.profile.username, 'johndoe');
    assert.equal(result.profile.gender, 'male');
  });

  it('should handle og:video:url variant', () => {
    const html = '<meta property="og:video:url" content="https://example.com/video.mp4">';
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.video);
    assert.equal(result.video.url, 'https://example.com/video.mp4');
  });

  it('should handle og:audio:url variant', () => {
    const html = '<meta property="og:audio:url" content="https://example.com/audio.mp3">';
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.ok(result.audio);
    assert.equal(result.audio.url, 'https://example.com/audio.mp3');
  });

  it('should return empty object if no OpenGraph metadata present', () => {
    const html = '<html><head><title>No OG</title></head></html>';
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.deepEqual(result, {});
  });

  it('should handle partial metadata gracefully', () => {
    const html = `
      <meta property="og:title" content="Title Only">
      <meta property="article:published_time" content="2024-01-01">
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.equal(result.title, 'Title Only');
    assert.ok(result.article);
    assert.equal(result.article.publishedTime, '2024-01-01');
    // Other article fields should not be present
    assert.equal(result.article.modifiedTime, undefined);
    assert.equal(result.article.authors, undefined);
  });

  it('should handle single image without detailed metadata', () => {
    const html = '<meta property="og:image" content="https://example.com/image.jpg">';
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.equal(result.image, 'https://example.com/image.jpg');
    assert.ok(result.images);
    assert.equal(result.images.length, 1);
    assert.equal(result.images[0].url, 'https://example.com/image.jpg');
  });

  it('should extract complex article page', () => {
    const html = `
      <head>
        <meta property="og:title" content="Understanding TypeScript">
        <meta property="og:type" content="article">
        <meta property="og:url" content="https://blog.example.com/typescript">
        <meta property="og:image" content="https://blog.example.com/images/ts.jpg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:description" content="A comprehensive guide to TypeScript">
        <meta property="og:site_name" content="Tech Blog">
        <meta property="og:locale" content="en_US">
        <meta property="article:published_time" content="2024-01-15T10:00:00Z">
        <meta property="article:author" content="https://example.com/authors/jane">
        <meta property="article:section" content="Programming">
        <meta property="article:tag" content="typescript">
        <meta property="article:tag" content="javascript">
        <meta property="article:tag" content="programming">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractOpenGraph(doc);

    assert.equal(result.title, 'Understanding TypeScript');
    assert.equal(result.type, 'article');
    assert.equal(result.url, 'https://blog.example.com/typescript');
    assert.equal(result.description, 'A comprehensive guide to TypeScript');
    assert.equal(result.siteName, 'Tech Blog');
    assert.equal(result.locale, 'en_US');

    assert.ok(result.article);
    assert.equal(result.article.publishedTime, '2024-01-15T10:00:00Z');
    assert.deepEqual(result.article.authors, ['https://example.com/authors/jane']);
    assert.equal(result.article.section, 'Programming');
    assert.deepEqual(result.article.tags, ['typescript', 'javascript', 'programming']);

    assert.ok(result.images);
    assert.equal(result.images[0].url, 'https://blog.example.com/images/ts.jpg');
    assert.equal(result.images[0].width, 1200);
    assert.equal(result.images[0].height, 630);
  });
});
