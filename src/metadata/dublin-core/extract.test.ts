import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractDublinCore } from './extract.js';

describe('extractDublinCore', () => {
  it('should extract basic Dublin Core metadata with DC. prefix', () => {
    const html = `
      <meta name="DC.title" content="Test Document">
      <meta name="DC.description" content="Test description">
      <meta name="DC.publisher" content="Test Publisher">
      <meta name="DC.date" content="2024-01-15">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.equal(result.title, 'Test Document');
    assert.equal(result.description, 'Test description');
    assert.equal(result.publisher, 'Test Publisher');
    assert.equal(result.date, '2024-01-15');
  });

  it('should extract Dublin Core metadata with dcterms. prefix', () => {
    const html = `
      <meta name="dcterms.title" content="Modern Document">
      <meta name="dcterms.description" content="Modern description">
      <meta name="dcterms.publisher" content="Modern Publisher">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.equal(result.title, 'Modern Document');
    assert.equal(result.description, 'Modern description');
    assert.equal(result.publisher, 'Modern Publisher');
  });

  it('should prefer DC. prefix over dcterms.', () => {
    const html = `
      <meta name="DC.title" content="DC Title">
      <meta name="dcterms.title" content="dcterms Title">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.equal(result.title, 'DC Title');
  });

  it('should extract multiple creators', () => {
    const html = `
      <meta name="DC.creator" content="John Doe">
      <meta name="DC.creator" content="Jane Smith">
      <meta name="DC.creator" content="Bob Johnson">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.ok(result.creator);
    assert.equal(result.creator.length, 3);
    assert.deepEqual(result.creator, ['John Doe', 'Jane Smith', 'Bob Johnson']);
  });

  it('should extract multiple subjects', () => {
    const html = `
      <meta name="DC.subject" content="Computer Science">
      <meta name="DC.subject" content="Web Development">
      <meta name="DC.subject" content="TypeScript">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.ok(result.subject);
    assert.equal(result.subject.length, 3);
    assert.deepEqual(result.subject, ['Computer Science', 'Web Development', 'TypeScript']);
  });

  it('should extract multiple contributors', () => {
    const html = `
      <meta name="DC.contributor" content="Editor One">
      <meta name="DC.contributor" content="Editor Two">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.ok(result.contributor);
    assert.equal(result.contributor.length, 2);
    assert.deepEqual(result.contributor, ['Editor One', 'Editor Two']);
  });

  it('should mix DC. and dcterms. for multi-value fields', () => {
    const html = `
      <meta name="DC.creator" content="Author One">
      <meta name="dcterms.creator" content="Author Two">
      <meta name="DC.creator" content="Author Three">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.ok(result.creator);
    assert.equal(result.creator.length, 3);
    assert.deepEqual(result.creator, ['Author One', 'Author Three', 'Author Two']);
  });

  it('should extract all Dublin Core fields', () => {
    const html = `
      <meta name="DC.title" content="Complete Test">
      <meta name="DC.creator" content="Creator">
      <meta name="DC.subject" content="Subject">
      <meta name="DC.description" content="Description">
      <meta name="DC.publisher" content="Publisher">
      <meta name="DC.contributor" content="Contributor">
      <meta name="DC.date" content="2024-01-01">
      <meta name="DC.type" content="Text">
      <meta name="DC.format" content="text/html">
      <meta name="DC.identifier" content="ISBN-123">
      <meta name="DC.source" content="Original Source">
      <meta name="DC.language" content="en">
      <meta name="DC.relation" content="Related Work">
      <meta name="DC.coverage" content="Global">
      <meta name="DC.rights" content="© 2024">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.equal(result.title, 'Complete Test');
    assert.deepEqual(result.creator, ['Creator']);
    assert.deepEqual(result.subject, ['Subject']);
    assert.equal(result.description, 'Description');
    assert.equal(result.publisher, 'Publisher');
    assert.deepEqual(result.contributor, ['Contributor']);
    assert.equal(result.date, '2024-01-01');
    assert.equal(result.type, 'Text');
    assert.equal(result.format, 'text/html');
    assert.equal(result.identifier, 'ISBN-123');
    assert.equal(result.source, 'Original Source');
    assert.equal(result.language, 'en');
    assert.equal(result.relation, 'Related Work');
    assert.equal(result.coverage, 'Global');
    assert.equal(result.rights, '© 2024');
  });

  it('should return empty object if no Dublin Core metadata present', () => {
    const html = '<html><head><title>No DC</title></head></html>';
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.deepEqual(result, {});
  });

  it('should handle partial metadata', () => {
    const html = `
      <meta name="DC.title" content="Only Title">
      <meta name="DC.creator" content="Only Creator">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.equal(result.title, 'Only Title');
    assert.deepEqual(result.creator, ['Only Creator']);
    assert.equal(result.description, undefined);
    assert.equal(result.publisher, undefined);
  });

  it('should handle academic paper metadata', () => {
    const html = `
      <meta name="DC.title" content="A Study of TypeScript Performance">
      <meta name="DC.creator" content="Dr. John Smith">
      <meta name="DC.creator" content="Dr. Jane Doe">
      <meta name="DC.subject" content="Computer Science">
      <meta name="DC.subject" content="Performance Analysis">
      <meta name="DC.subject" content="TypeScript">
      <meta name="DC.description" content="An empirical study of TypeScript compilation performance">
      <meta name="DC.publisher" content="ACM Digital Library">
      <meta name="DC.date" content="2024">
      <meta name="DC.type" content="Text.Article">
      <meta name="DC.format" content="application/pdf">
      <meta name="DC.identifier" content="DOI:10.1145/example">
      <meta name="DC.language" content="en">
      <meta name="DC.rights" content="© 2024 ACM">
    `;
    const doc = parseHTML(html);

    const result = extractDublinCore(doc);

    assert.equal(result.title, 'A Study of TypeScript Performance');
    assert.equal(result.creator?.length, 2);
    assert.equal(result.subject?.length, 3);
    assert.equal(result.publisher, 'ACM Digital Library');
    assert.equal(result.type, 'Text.Article');
    assert.equal(result.identifier, 'DOI:10.1145/example');
  });
});
