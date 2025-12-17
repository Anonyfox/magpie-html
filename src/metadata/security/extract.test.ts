import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractSecurity } from './extract.js';

describe('extractSecurity', () => {
  it('should extract referrer policy', () => {
    const html = '<meta name="referrer" content="no-referrer">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'no-referrer');
  });

  it('should extract origin referrer policy', () => {
    const html = '<meta name="referrer" content="origin">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'origin');
  });

  it('should extract strict-origin-when-cross-origin referrer policy', () => {
    const html = '<meta name="referrer" content="strict-origin-when-cross-origin">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'strict-origin-when-cross-origin');
  });

  it('should extract Content Security Policy', () => {
    const html = `
      <meta http-equiv="Content-Security-Policy"
            content="default-src 'self'; script-src 'self' 'unsafe-inline'">
    `;
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.ok(result.contentSecurityPolicy);
    assert.ok(result.contentSecurityPolicy.includes("default-src 'self'"));
  });

  it('should extract X-UA-Compatible', () => {
    const html = '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.xUaCompatible, 'IE=edge');
  });

  it('should extract format detection', () => {
    const html = '<meta name="format-detection" content="telephone=no">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.formatDetection, 'telephone=no');
  });

  it('should extract format detection with multiple values', () => {
    const html = '<meta name="format-detection" content="telephone=no, email=no, date=no">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.formatDetection, 'telephone=no, email=no, date=no');
  });

  it('should extract complete security metadata', () => {
    const html = `
      <head>
        <meta name="referrer" content="no-referrer-when-downgrade">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="format-detection" content="telephone=no">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'no-referrer-when-downgrade');
    assert.equal(result.contentSecurityPolicy, "default-src 'self'");
    assert.equal(result.xUaCompatible, 'IE=edge,chrome=1');
    assert.equal(result.formatDetection, 'telephone=no');
  });

  it('should return empty object if no security metadata', () => {
    const html = '<html><head><title>No Security</title></head></html>';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.deepEqual(result, {});
  });

  it('should handle complex CSP', () => {
    const csp =
      "default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com;";
    const html = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.contentSecurityPolicy, csp);
  });

  it('should handle same-origin referrer policy', () => {
    const html = '<meta name="referrer" content="same-origin">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'same-origin');
  });

  it('should handle unsafe-url referrer policy', () => {
    const html = '<meta name="referrer" content="unsafe-url">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'unsafe-url');
  });

  it('should extract IE=11 compatibility mode', () => {
    const html = '<meta http-equiv="X-UA-Compatible" content="IE=11">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.xUaCompatible, 'IE=11');
  });

  it('should handle format detection disabling all', () => {
    const html = '<meta name="format-detection" content="telephone=no, email=no, address=no">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.ok(result.formatDetection);
    assert.ok(result.formatDetection.includes('telephone=no'));
    assert.ok(result.formatDetection.includes('email=no'));
    assert.ok(result.formatDetection.includes('address=no'));
  });

  it('should extract CSP with nonce', () => {
    const html = `
      <meta http-equiv="Content-Security-Policy"
            content="script-src 'nonce-abc123' 'strict-dynamic'">
    `;
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.ok(result.contentSecurityPolicy);
    assert.ok(result.contentSecurityPolicy.includes('nonce-abc123'));
  });

  it('should handle referrer policy with origin-when-cross-origin', () => {
    const html = '<meta name="referrer" content="origin-when-cross-origin">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'origin-when-cross-origin');
  });

  it('should extract security headers from typical website', () => {
    const html = `
      <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <meta name="format-detection" content="telephone=no">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.xUaCompatible, 'IE=edge');
    assert.equal(result.referrerPolicy, 'strict-origin-when-cross-origin');
    assert.equal(result.formatDetection, 'telephone=no');
  });

  it('should handle CSP with report-uri', () => {
    const html = `
      <meta http-equiv="Content-Security-Policy"
            content="default-src 'self'; report-uri /csp-report">
    `;
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.ok(result.contentSecurityPolicy);
    assert.ok(result.contentSecurityPolicy.includes('report-uri'));
  });

  it('should extract referrer policy never', () => {
    const html = '<meta name="referrer" content="never">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'never');
  });

  it('should extract referrer policy always', () => {
    const html = '<meta name="referrer" content="always">';
    const doc = parseHTML(html);

    const result = extractSecurity(doc);

    assert.equal(result.referrerPolicy, 'always');
  });
});
