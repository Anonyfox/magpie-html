import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractVerification } from './extract.js';

describe('extractVerification', () => {
  it('should extract Google Site Verification', () => {
    const html = '<meta name="google-site-verification" content="abc123xyz">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, 'abc123xyz');
  });

  it('should extract Microsoft/Bing validation', () => {
    const html = '<meta name="msvalidate.01" content="1234567890ABCDEF">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.msvalidate, '1234567890ABCDEF');
  });

  it('should extract Yandex verification', () => {
    const html = '<meta name="yandex-verification" content="yandex123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.yandexVerification, 'yandex123');
  });

  it('should extract Facebook domain verification', () => {
    const html = '<meta name="facebook-domain-verification" content="fb123xyz">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.facebookDomainVerification, 'fb123xyz');
  });

  it('should extract Pinterest verification', () => {
    const html = '<meta name="p:domain_verify" content="pinterest123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.pinterestVerification, 'pinterest123');
  });

  it('should extract Alexa verification', () => {
    const html = '<meta name="alexaVerifyID" content="alexa123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.alexaVerification, 'alexa123');
  });

  it('should extract Norton Safe Web verification', () => {
    const html = '<meta name="norton-safeweb-site-verification" content="norton123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.nortonSafeWeb, 'norton123');
  });

  it('should extract multiple verification tags', () => {
    const html = `
      <meta name="google-site-verification" content="google123">
      <meta name="msvalidate.01" content="bing123">
      <meta name="facebook-domain-verification" content="fb123">
    `;
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, 'google123');
    assert.equal(result.msvalidate, 'bing123');
    assert.equal(result.facebookDomainVerification, 'fb123');
  });

  it('should extract other verification patterns', () => {
    const html = '<meta name="verify-v1" content="legacy123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.ok(result.other);
    assert.equal(result.other['verify-v1'], 'legacy123');
  });

  it('should collect multiple other verification tags', () => {
    const html = `
      <meta name="verify-v1" content="legacy1">
      <meta name="verify-a" content="legacy2">
      <meta name="domain-verification" content="domain123">
    `;
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.ok(result.other);
    assert.equal(result.other['verify-v1'], 'legacy1');
    assert.equal(result.other['verify-a'], 'legacy2');
    assert.equal(result.other['domain-verification'], 'domain123');
  });

  it('should return empty object if no verification tags', () => {
    const html = '<html><head><title>No Verification</title></head></html>';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.deepEqual(result, {});
  });

  it('should extract complete verification metadata', () => {
    const html = `
      <head>
        <meta name="google-site-verification" content="GoogleToken123">
        <meta name="msvalidate.01" content="BingToken456">
        <meta name="yandex-verification" content="YandexToken789">
        <meta name="facebook-domain-verification" content="FacebookToken012">
        <meta name="p:domain_verify" content="PinterestToken345">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, 'GoogleToken123');
    assert.equal(result.msvalidate, 'BingToken456');
    assert.equal(result.yandexVerification, 'YandexToken789');
    assert.equal(result.facebookDomainVerification, 'FacebookToken012');
    assert.equal(result.pinterestVerification, 'PinterestToken345');
  });

  it('should handle verification tags with special characters', () => {
    const html = '<meta name="google-site-verification" content="abc-123_XYZ.789">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, 'abc-123_XYZ.789');
  });

  it('should handle long verification tokens', () => {
    const longToken = 'a'.repeat(100);
    const html = `<meta name="google-site-verification" content="${longToken}">`;
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, longToken);
  });

  it('should extract generic verification tag', () => {
    const html = '<meta name="verification" content="generic123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.ok(result.other);
    assert.equal(result.other.verification, 'generic123');
  });

  it('should extract site-verification tag', () => {
    const html = '<meta name="site-verification" content="site123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.ok(result.other);
    assert.equal(result.other['site-verification'], 'site123');
  });

  it('should not include other if no generic patterns found', () => {
    const html = '<meta name="google-site-verification" content="google123">';
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, 'google123');
    assert.equal(result.other, undefined);
  });

  it('should handle mixed verification sources', () => {
    const html = `
      <head>
        <meta name="google-site-verification" content="Google123">
        <meta name="verify-v1" content="LegacyGoogle">
        <meta name="facebook-domain-verification" content="FB123">
        <meta name="domain-verification" content="Generic123">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractVerification(doc);

    assert.equal(result.googleSiteVerification, 'Google123');
    assert.equal(result.facebookDomainVerification, 'FB123');
    assert.ok(result.other);
    assert.equal(result.other['verify-v1'], 'LegacyGoogle');
    assert.equal(result.other['domain-verification'], 'Generic123');
  });
});
