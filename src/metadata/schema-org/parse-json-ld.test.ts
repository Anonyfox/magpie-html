import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  extractGraphItems,
  getType,
  isType,
  matchesAnyType,
  parseJsonLd,
} from './parse-json-ld.js';

describe('parseJsonLd', () => {
  it('should parse valid JSON-LD', () => {
    const json = '{"@context":"https://schema.org","@type":"Article","name":"Test"}';
    const result = parseJsonLd(json);

    assert.ok(result);
    assert.equal(result.type, 'Article');
    assert.equal(result.context, 'https://schema.org');
    assert.equal(result.raw, json);
  });

  it('should handle @type as array', () => {
    const json = '{"@type":["Article","BlogPosting"],"name":"Test"}';
    const result = parseJsonLd(json);

    assert.ok(result);
    assert.deepEqual(result.type, ['Article', 'BlogPosting']);
  });

  it('should return null for invalid JSON', () => {
    const json = '{invalid json}';
    const result = parseJsonLd(json);

    assert.equal(result, null);
  });

  it('should return null for empty string', () => {
    const result = parseJsonLd('');
    assert.equal(result, null);
  });

  it('should handle JSON without @type', () => {
    const json = '{"name":"Test","description":"No type"}';
    const result = parseJsonLd(json);

    assert.ok(result);
    assert.equal(result.type, undefined);
  });

  it('should trim whitespace', () => {
    const json = '  {"@type":"Article"}  ';
    const result = parseJsonLd(json);

    assert.ok(result);
    assert.equal(result.type, 'Article');
  });
});

describe('isType', () => {
  it('should match string type (case-insensitive)', () => {
    assert.equal(isType('Article', 'article'), true);
    assert.equal(isType('Article', 'Article'), true);
    assert.equal(isType('article', 'ARTICLE'), true);
  });

  it('should not match different type', () => {
    assert.equal(isType('Article', 'Product'), false);
  });

  it('should match type in array', () => {
    assert.equal(isType(['Article', 'BlogPosting'], 'article'), true);
    assert.equal(isType(['Article', 'BlogPosting'], 'blogposting'), true);
  });

  it('should not match if type not in array', () => {
    assert.equal(isType(['Article', 'BlogPosting'], 'Product'), false);
  });

  it('should return false for undefined type', () => {
    assert.equal(isType(undefined, 'Article'), false);
  });
});

describe('extractGraphItems', () => {
  it('should extract items from @graph array', () => {
    const data = {
      '@graph': [{ '@type': 'Article' }, { '@type': 'Organization' }],
    };

    const result = extractGraphItems(data);

    assert.equal(result.length, 2);
    assert.deepEqual(result[0], { '@type': 'Article' });
    assert.deepEqual(result[1], { '@type': 'Organization' });
  });

  it('should return object itself if no @graph', () => {
    const data = { '@type': 'Article', name: 'Test' };

    const result = extractGraphItems(data);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0], data);
  });

  it('should return empty array for non-object', () => {
    assert.deepEqual(extractGraphItems(null), []);
    assert.deepEqual(extractGraphItems('string'), []);
    assert.deepEqual(extractGraphItems(123), []);
  });

  it('should handle empty @graph', () => {
    const data = { '@graph': [] };

    const result = extractGraphItems(data);

    assert.deepEqual(result, []);
  });
});

describe('getType', () => {
  it('should extract string @type', () => {
    const obj = { '@type': 'Article' };
    assert.equal(getType(obj), 'Article');
  });

  it('should extract array @type', () => {
    const obj = { '@type': ['Article', 'BlogPosting'] };
    assert.deepEqual(getType(obj), ['Article', 'BlogPosting']);
  });

  it('should return undefined if no @type', () => {
    const obj = { name: 'Test' };
    assert.equal(getType(obj), undefined);
  });

  it('should return undefined for non-object', () => {
    assert.equal(getType(null), undefined);
    assert.equal(getType('string'), undefined);
    assert.equal(getType(123), undefined);
  });
});

describe('matchesAnyType', () => {
  it('should match if object type matches any target', () => {
    const obj = { '@type': 'Article' };
    assert.equal(matchesAnyType(obj, ['Article', 'Product']), true);
  });

  it('should not match if object type does not match any target', () => {
    const obj = { '@type': 'Article' };
    assert.equal(matchesAnyType(obj, ['Product', 'Event']), false);
  });

  it('should match with array @type', () => {
    const obj = { '@type': ['Article', 'BlogPosting'] };
    assert.equal(matchesAnyType(obj, ['BlogPosting']), true);
  });

  it('should return false for object without @type', () => {
    const obj = { name: 'Test' };
    assert.equal(matchesAnyType(obj, ['Article']), false);
  });

  it('should be case-insensitive', () => {
    const obj = { '@type': 'Article' };
    assert.equal(matchesAnyType(obj, ['article', 'PRODUCT']), true);
  });
});
