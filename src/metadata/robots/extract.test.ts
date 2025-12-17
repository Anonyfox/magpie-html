import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractRobots } from './extract.js';

describe('extractRobots', () => {
  it('should extract basic robots directives', () => {
    const html = '<meta name="robots" content="noindex, nofollow">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.index, false);
    assert.equal(result.robots.follow, false);
  });

  it('should extract index and follow directives', () => {
    const html = '<meta name="robots" content="index, follow">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.index, true);
    assert.equal(result.robots.follow, true);
  });

  it('should extract Google snippet directives', () => {
    const html = '<meta name="robots" content="max-snippet:150, max-image-preview:large">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.maxSnippet, 150);
    assert.equal(result.robots.maxImagePreview, 'large');
  });

  it('should extract Googlebot-specific directives', () => {
    const html = '<meta name="googlebot" content="noindex, noarchive">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.googlebot);
    assert.equal(result.googlebot.index, false);
    assert.equal(result.googlebot.noarchive, true);
  });

  it('should extract Bingbot-specific directives', () => {
    const html = '<meta name="bingbot" content="nosnippet, noimageindex">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.bingbot);
    assert.equal(result.bingbot.nosnippet, true);
    assert.equal(result.bingbot.noimageindex, true);
  });

  it('should extract Google News bot directives', () => {
    const html = '<meta name="googlebot-news" content="noindex">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.googlebotNews);
    assert.equal(result.googlebotNews.index, false);
  });

  it('should extract multiple bot directives', () => {
    const html = `
      <meta name="robots" content="index, follow">
      <meta name="googlebot" content="noarchive">
      <meta name="bingbot" content="nosnippet">
    `;
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.index, true);
    assert.equal(result.robots.follow, true);

    assert.ok(result.googlebot);
    assert.equal(result.googlebot.noarchive, true);

    assert.ok(result.bingbot);
    assert.equal(result.bingbot.nosnippet, true);
  });

  it('should return empty object if no robots meta tags', () => {
    const html = '<html><head><title>No Robots</title></head></html>';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.deepEqual(result, {});
  });

  it('should handle "all" directive', () => {
    const html = '<meta name="robots" content="all">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.index, true);
    assert.equal(result.robots.follow, true);
  });

  it('should handle "none" directive', () => {
    const html = '<meta name="robots" content="none">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.index, false);
    assert.equal(result.robots.follow, false);
  });

  it('should extract complex Google directives', () => {
    const html = `
      <meta name="robots" content="max-snippet:320, max-image-preview:large, max-video-preview:60">
    `;
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.maxSnippet, 320);
    assert.equal(result.robots.maxImagePreview, 'large');
    assert.equal(result.robots.maxVideoPreview, 60);
  });

  it('should handle unavailable_after directive', () => {
    const html = '<meta name="robots" content="unavailable_after:2025-12-31">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.unavailableAfter, '2025-12-31');
  });

  it('should handle notranslate directive', () => {
    const html = '<meta name="robots" content="notranslate">';
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.notranslate, true);
  });

  it('should extract real-world comprehensive robots setup', () => {
    const html = `
      <head>
        <meta name="robots" content="index, follow, max-snippet:150, max-image-preview:large">
        <meta name="googlebot" content="noarchive">
        <meta name="googlebot-news" content="nosnippet">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractRobots(doc);

    assert.ok(result.robots);
    assert.equal(result.robots.index, true);
    assert.equal(result.robots.follow, true);
    assert.equal(result.robots.maxSnippet, 150);
    assert.equal(result.robots.maxImagePreview, 'large');

    assert.ok(result.googlebot);
    assert.equal(result.googlebot.noarchive, true);

    assert.ok(result.googlebotNews);
    assert.equal(result.googlebotNews.nosnippet, true);
  });
});
