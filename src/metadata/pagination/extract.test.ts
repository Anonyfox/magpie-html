import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractPagination } from './extract.js';

describe('extractPagination', () => {
  it('should extract prev link', () => {
    const html = '<link rel="prev" href="/page/1">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.prev, '/page/1');
  });

  it('should extract previous as alias for prev', () => {
    const html = '<link rel="previous" href="/page/1">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.prev, '/page/1');
  });

  it('should prefer prev over previous', () => {
    const html = `
      <link rel="prev" href="/page/1">
      <link rel="previous" href="/page/0">
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.prev, '/page/1');
  });

  it('should extract next link', () => {
    const html = '<link rel="next" href="/page/3">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.next, '/page/3');
  });

  it('should extract first link', () => {
    const html = '<link rel="first" href="/page/1">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.first, '/page/1');
  });

  it('should extract last link', () => {
    const html = '<link rel="last" href="/page/100">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.last, '/page/100');
  });

  it('should extract up link', () => {
    const html = '<link rel="up" href="/category">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.up, '/category');
  });

  it('should extract index link', () => {
    const html = '<link rel="index" href="/table-of-contents">';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.index, '/table-of-contents');
  });

  it('should extract complete pagination', () => {
    const html = `
      <head>
        <link rel="first" href="/page/1">
        <link rel="prev" href="/page/4">
        <link rel="next" href="/page/6">
        <link rel="last" href="/page/50">
        <link rel="up" href="/articles">
        <link rel="index" href="/toc">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.first, '/page/1');
    assert.equal(result.prev, '/page/4');
    assert.equal(result.next, '/page/6');
    assert.equal(result.last, '/page/50');
    assert.equal(result.up, '/articles');
    assert.equal(result.index, '/toc');
  });

  it('should return empty object if no pagination links found', () => {
    const html = '<html><head><title>No Pagination</title></head></html>';
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.deepEqual(result, {});
  });

  it('should handle absolute URLs', () => {
    const html = `
      <link rel="prev" href="https://example.com/page/1">
      <link rel="next" href="https://example.com/page/3">
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.prev, 'https://example.com/page/1');
    assert.equal(result.next, 'https://example.com/page/3');
  });

  it('should handle pagination on first page (no prev)', () => {
    const html = `
      <link rel="next" href="/page/2">
      <link rel="last" href="/page/10">
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.prev, undefined);
    assert.equal(result.next, '/page/2');
    assert.equal(result.last, '/page/10');
  });

  it('should handle pagination on last page (no next)', () => {
    const html = `
      <link rel="first" href="/page/1">
      <link rel="prev" href="/page/9">
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.first, '/page/1');
    assert.equal(result.prev, '/page/9');
    assert.equal(result.next, undefined);
  });

  it('should extract simple prev/next only', () => {
    const html = `
      <link rel="prev" href="/article/1">
      <link rel="next" href="/article/3">
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.prev, '/article/1');
    assert.equal(result.next, '/article/3');
    assert.equal(result.first, undefined);
    assert.equal(result.last, undefined);
  });

  it('should handle blog post series navigation', () => {
    const html = `
      <link rel="up" href="/series/typescript-basics">
      <link rel="prev" href="/series/typescript-basics/part-2">
      <link rel="next" href="/series/typescript-basics/part-4">
      <link rel="index" href="/series/typescript-basics">
    `;
    const doc = parseHTML(html);

    const result = extractPagination(doc);

    assert.equal(result.up, '/series/typescript-basics');
    assert.equal(result.prev, '/series/typescript-basics/part-2');
    assert.equal(result.next, '/series/typescript-basics/part-4');
    assert.equal(result.index, '/series/typescript-basics');
  });
});
