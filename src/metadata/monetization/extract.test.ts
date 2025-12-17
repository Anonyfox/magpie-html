import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractMonetization } from './extract.js';

describe('extractMonetization', () => {
  it('should extract Web Monetization payment pointer', () => {
    const html = '<meta name="monetization" content="$ilp.uphold.com/1234567890">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.webMonetization, '$ilp.uphold.com/1234567890');
  });

  it('should extract PayPal verification token', () => {
    const html = '<meta name="paypal-site-verification" content="abc123xyz">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.paypalVerification, 'abc123xyz');
  });

  it('should extract Brave Creator verification', () => {
    const html = '<meta name="brave-rewards-verification" content="brave123">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.braveCreator, 'brave123');
  });

  it('should extract Brave Creator from alternative meta name', () => {
    const html = '<meta name="brave-creator-verification" content="brave456">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.braveCreator, 'brave456');
  });

  it('should extract Coil payment pointer', () => {
    const html = '<meta name="coil:payment_pointer" content="$coil.xrptipbot.com/example">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.coil, '$coil.xrptipbot.com/example');
  });

  it('should extract Bitcoin address', () => {
    const html = '<meta name="bitcoin" content="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.bitcoin, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  });

  it('should extract Bitcoin address from alternative meta name', () => {
    const html = '<meta name="btc:address" content="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.bitcoin, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  });

  it('should extract Ethereum address', () => {
    const html = '<meta name="ethereum" content="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.ethereum, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });

  it('should extract Ethereum address from alternative meta name', () => {
    const html = '<meta name="eth:address" content="0x123456789abcdef">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.ethereum, '0x123456789abcdef');
  });

  it('should extract multiple monetization methods', () => {
    const html = `
      <meta name="monetization" content="$ilp.uphold.com/example">
      <meta name="bitcoin" content="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2">
      <meta name="ethereum" content="0x123456789">
    `;
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.webMonetization, '$ilp.uphold.com/example');
    assert.equal(result.bitcoin, '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
    assert.equal(result.ethereum, '0x123456789');
  });

  it('should return empty object if no monetization metadata', () => {
    const html = '<html><head><title>No Monetization</title></head></html>';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.deepEqual(result, {});
  });

  it('should handle Web Monetization with Wallet address', () => {
    const html = '<meta name="monetization" content="$wallet.example.com/alice">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.webMonetization, '$wallet.example.com/alice');
  });

  it('should extract complete monetization metadata', () => {
    const html = `
      <head>
        <meta name="monetization" content="$ilp.uphold.com/my-pointer">
        <meta name="paypal-site-verification" content="paypal123">
        <meta name="brave-rewards-verification" content="brave123">
        <meta name="bitcoin" content="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa">
        <meta name="ethereum" content="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.webMonetization, '$ilp.uphold.com/my-pointer');
    assert.equal(result.paypalVerification, 'paypal123');
    assert.equal(result.braveCreator, 'brave123');
    assert.equal(result.bitcoin, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    assert.equal(result.ethereum, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });

  it('should prefer direct meta names over alternatives', () => {
    const html = `
      <meta name="bitcoin" content="direct-address">
      <meta name="btc:address" content="alternative-address">
    `;
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.bitcoin, 'direct-address');
  });

  it('should handle Web Monetization with various pointer formats', () => {
    const html = '<meta name="monetization" content="$twitter.xrptipbot.com/username">';
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.webMonetization, '$twitter.xrptipbot.com/username');
  });

  it('should extract all verification and payment methods', () => {
    const html = `
      <head>
        <meta name="monetization" content="$ilp.gatehub.net/example">
        <meta name="paypal-site-verification" content="paypal-token-123">
        <meta name="brave-creator-verification" content="brave-token-456">
        <meta name="coil:payment_pointer" content="$coil.xrptipbot.com/user">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractMonetization(doc);

    assert.equal(result.webMonetization, '$ilp.gatehub.net/example');
    assert.equal(result.paypalVerification, 'paypal-token-123');
    assert.equal(result.braveCreator, 'brave-token-456');
    assert.equal(result.coil, '$coil.xrptipbot.com/user');
  });
});
