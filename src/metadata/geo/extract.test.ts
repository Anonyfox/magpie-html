import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { parseHTML } from '../../utils/html-parser.js';
import { extractGeo } from './extract.js';

describe('extractGeo', () => {
  it('should extract geo.position', () => {
    const html = '<meta name="geo.position" content="37.7749;-122.4194">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 37.7749);
    assert.equal(result.position.longitude, -122.4194);
  });

  it('should extract ICBM position', () => {
    const html = '<meta name="ICBM" content="51.5074, -0.1278">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 51.5074);
    assert.equal(result.position.longitude, -0.1278);
  });

  it('should extract lowercase icbm position', () => {
    const html = '<meta name="icbm" content="48.8566, 2.3522">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 48.8566);
    assert.equal(result.position.longitude, 2.3522);
  });

  it('should extract geo.placename', () => {
    const html = '<meta name="geo.placename" content="San Francisco, CA">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.placename, 'San Francisco, CA');
  });

  it('should extract geo.region', () => {
    const html = '<meta name="geo.region" content="US-CA">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.region, 'US-CA');
  });

  it('should extract geo.country', () => {
    const html = '<meta name="geo.country" content="US">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.country, 'US');
  });

  it('should extract complete geographic metadata', () => {
    const html = `
      <meta name="geo.position" content="40.7128;-74.0060">
      <meta name="geo.placename" content="New York, NY">
      <meta name="geo.region" content="US-NY">
      <meta name="geo.country" content="United States">
    `;
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 40.7128);
    assert.equal(result.position.longitude, -74.006);
    assert.equal(result.placename, 'New York, NY');
    assert.equal(result.region, 'US-NY');
    assert.equal(result.country, 'United States');
  });

  it('should prefer geo.position over ICBM', () => {
    const html = `
      <meta name="geo.position" content="10.0;20.0">
      <meta name="ICBM" content="30.0, 40.0">
    `;
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 10.0);
    assert.equal(result.position.longitude, 20.0);
  });

  it('should handle ICBM without spaces', () => {
    const html = '<meta name="ICBM" content="52.5200,13.4050">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 52.52);
    assert.equal(result.position.longitude, 13.405);
  });

  it('should handle negative coordinates', () => {
    const html = '<meta name="geo.position" content="-33.8688;151.2093">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, -33.8688);
    assert.equal(result.position.longitude, 151.2093);
  });

  it('should return empty object if no geographic metadata', () => {
    const html = '<html><head><title>No Geo</title></head></html>';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.deepEqual(result, {});
  });

  it('should handle invalid geo.position format', () => {
    const html = '<meta name="geo.position" content="invalid">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.position, undefined);
  });

  it('should handle invalid latitude/longitude values', () => {
    const html = '<meta name="geo.position" content="100.0;200.0">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.position, undefined);
  });

  it('should handle out of range latitude', () => {
    const html = '<meta name="geo.position" content="-91.0;0.0">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.position, undefined);
  });

  it('should handle out of range longitude', () => {
    const html = '<meta name="geo.position" content="0.0;181.0">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.position, undefined);
  });

  it('should handle ICBM with invalid format', () => {
    const html = '<meta name="ICBM" content="not-a-coordinate">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.position, undefined);
  });

  it('should extract position at equator and prime meridian', () => {
    const html = '<meta name="geo.position" content="0.0;0.0">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 0);
    assert.equal(result.position.longitude, 0);
  });

  it('should handle extreme valid coordinates', () => {
    const html = '<meta name="geo.position" content="90.0;-180.0">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 90);
    assert.equal(result.position.longitude, -180);
  });

  it('should extract geo metadata with only placename', () => {
    const html = '<meta name="geo.placename" content="Tokyo, Japan">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.equal(result.placename, 'Tokyo, Japan');
    assert.equal(result.position, undefined);
  });

  it('should handle ICBM with only two parts', () => {
    const html = '<meta name="ICBM" content="35.6762,139.6503">';
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 35.6762);
    assert.equal(result.position.longitude, 139.6503);
  });

  it('should extract real-world example', () => {
    const html = `
      <head>
        <meta name="geo.position" content="34.0522;-118.2437">
        <meta name="geo.placename" content="Los Angeles">
        <meta name="geo.region" content="US-CA">
        <meta name="geo.country" content="USA">
      </head>
    `;
    const doc = parseHTML(html);

    const result = extractGeo(doc);

    assert.ok(result.position);
    assert.equal(result.position.latitude, 34.0522);
    assert.equal(result.position.longitude, -118.2437);
    assert.equal(result.placename, 'Los Angeles');
    assert.equal(result.region, 'US-CA');
    assert.equal(result.country, 'USA');
  });
});
