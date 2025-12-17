import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isValid, validate } from './validate.js';

describe('validate', () => {
  it('should validate minimal valid feed', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [],
    };

    const errors = validate(feed);
    assert.equal(errors.length, 0);
  });

  it('should validate feed with version 1.0', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1',
      title: 'Test Feed',
      items: [],
    };

    const errors = validate(feed);
    assert.equal(errors.length, 0);
  });

  it('should reject non-object input', () => {
    const errors = validate('not an object');
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'root');
  });

  it('should reject array input', () => {
    const errors = validate([]);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'root');
  });

  it('should reject null input', () => {
    const errors = validate(null);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'root');
  });

  it('should require version field', () => {
    const feed = {
      title: 'Test Feed',
      items: [],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'version'));
  });

  it('should require title field', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      items: [],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'title'));
  });

  it('should require items field', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'items'));
  });

  it('should reject invalid version', () => {
    const feed = {
      version: 'https://example.com/version/2',
      title: 'Test Feed',
      items: [],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'version' && e.message.includes('Unsupported')));
  });

  it('should reject non-string version', () => {
    const feed = {
      version: 123,
      title: 'Test Feed',
      items: [],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'version'));
  });

  it('should reject non-string title', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 123,
      items: [],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'title'));
  });

  it('should reject non-array items', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: 'not an array',
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field === 'items'));
  });

  it('should require item id', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [{ title: 'Item without id' }],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field.includes('items[0].id')));
  });

  it('should reject non-string item id', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [{ id: 123 }],
    };

    const errors = validate(feed);
    assert.ok(errors.some((e) => e.field.includes('items[0].id')));
  });

  it('should validate feed with valid items', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [
        {
          id: '1',
          title: 'Item 1',
          content_html: '<p>Content</p>',
        },
        {
          id: '2',
          title: 'Item 2',
          content_text: 'Plain text content',
        },
      ],
    };

    const errors = validate(feed);
    assert.equal(errors.length, 0);
  });

  it('should handle multiple errors', () => {
    const feed = {
      items: 'not an array',
    };

    const errors = validate(feed);
    assert.ok(errors.length >= 2);
    assert.ok(errors.some((e) => e.field === 'version'));
    assert.ok(errors.some((e) => e.field === 'title'));
  });
});

describe('isValid', () => {
  it('should return true for valid feed', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test Feed',
      items: [],
    };

    assert.equal(isValid(feed), true);
  });

  it('should return false for invalid feed', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      items: [],
    };

    assert.equal(isValid(feed), false);
  });

  it('should return false for non-object', () => {
    assert.equal(isValid('not an object'), false);
  });

  it('should return false for null', () => {
    assert.equal(isValid(null), false);
  });
});
