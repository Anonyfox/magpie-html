import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractNews } from './extract.js';

describe('extractNews', () => {
  it('should extract news keywords', () => {
    const html = '<meta name="news_keywords" content="politics, economy, technology">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 3);
    assert.ok(result.keywords.includes('politics'));
    assert.ok(result.keywords.includes('economy'));
    assert.ok(result.keywords.includes('technology'));
  });

  it('should extract Google News standout tag', () => {
    const html = '<meta name="standout" content="https://example.com/article/123">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.standout, 'https://example.com/article/123');
  });

  it('should extract syndication source', () => {
    const html = '<meta name="syndication-source" content="https://originalpublisher.com">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.syndicationSource, 'https://originalpublisher.com');
  });

  it('should extract original source', () => {
    const html = '<meta name="original-source" content="https://source.com/original">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.originalSource, 'https://source.com/original');
  });

  it('should extract complete news metadata', () => {
    const html = `
      <meta name="news_keywords" content="breaking news, investigation, exclusive">
      <meta name="standout" content="https://news.example.com/investigation">
      <meta name="syndication-source" content="https://ap.org">
      <meta name="original-source" content="https://reuters.com/article/123">
    `;
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 3);
    assert.ok(result.keywords.includes('breaking news'));
    assert.ok(result.keywords.includes('investigation'));
    assert.ok(result.keywords.includes('exclusive'));
    assert.equal(result.standout, 'https://news.example.com/investigation');
    assert.equal(result.syndicationSource, 'https://ap.org');
    assert.equal(result.originalSource, 'https://reuters.com/article/123');
  });

  it('should handle single news keyword', () => {
    const html = '<meta name="news_keywords" content="breaking">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 1);
    assert.equal(result.keywords[0], 'breaking');
  });

  it('should trim whitespace from keywords', () => {
    const html = '<meta name="news_keywords" content="  keyword1 , keyword2  , keyword3  ">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 3);
    assert.ok(result.keywords.includes('keyword1'));
    assert.ok(result.keywords.includes('keyword2'));
    assert.ok(result.keywords.includes('keyword3'));
  });

  it('should filter empty keywords', () => {
    const html = '<meta name="news_keywords" content="keyword1,,keyword2,  ,keyword3">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 3);
    assert.ok(result.keywords.includes('keyword1'));
    assert.ok(result.keywords.includes('keyword2'));
    assert.ok(result.keywords.includes('keyword3'));
  });

  it('should return empty object if no news metadata', () => {
    const html = '<html><head><title>No News</title></head></html>';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.deepEqual(result, {});
  });

  it('should handle news article with standout only', () => {
    const html = '<meta name="standout" content="https://pulitzer.example.com/article">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.standout, 'https://pulitzer.example.com/article');
    assert.equal(result.keywords, undefined);
  });

  it('should handle syndicated content', () => {
    const html = `
      <meta name="syndication-source" content="https://ap.org">
      <meta name="original-source" content="https://ap.org/article/original-123">
    `;
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.syndicationSource, 'https://ap.org');
    assert.equal(result.originalSource, 'https://ap.org/article/original-123');
  });

  it('should handle keywords with special characters', () => {
    const html =
      '<meta name="news_keywords" content="COVID-19, U.S. Economy, President\'s Speech">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 3);
    assert.ok(result.keywords.includes('COVID-19'));
    assert.ok(result.keywords.includes('U.S. Economy'));
    assert.ok(result.keywords.includes("President's Speech"));
  });

  it('should extract news metadata from real-world article', () => {
    const html = `
      <head>
        <meta name="news_keywords" content="election, politics, congress, democracy">
        <meta name="standout" content="https://nytimes.com/2024/election-investigation">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 4);
    assert.ok(result.keywords.includes('election'));
    assert.ok(result.keywords.includes('politics'));
    assert.ok(result.keywords.includes('congress'));
    assert.ok(result.keywords.includes('democracy'));
    assert.equal(result.standout, 'https://nytimes.com/2024/election-investigation');
  });

  it('should handle empty news_keywords', () => {
    const html = '<meta name="news_keywords" content="">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.keywords, undefined);
  });

  it('should handle news_keywords with only whitespace', () => {
    const html = '<meta name="news_keywords" content="   ">';
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.equal(result.keywords, undefined);
  });

  it('should extract international news metadata', () => {
    const html = `
      <meta name="news_keywords" content="Ukraine, Russia, NATO, Europe">
      <meta name="syndication-source" content="https://reuters.com">
    `;
    const doc = parseHTML(html);

    const result = extractNews(doc);

    assert.ok(result.keywords);
    assert.equal(result.keywords.length, 4);
    assert.equal(result.syndicationSource, 'https://reuters.com');
  });
});
