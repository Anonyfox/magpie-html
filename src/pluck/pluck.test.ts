/**
 * Enhanced fetch (pluck) tests with MOCKED fetch.
 *
 * @remarks
 * ALL fetch calls are mocked - NO real network requests are made.
 *
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import { strict as assert } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { pluck } from './pluck.js';
import {
  PluckContentTypeError,
  PluckEncodingError,
  PluckHttpError,
  PluckNetworkError,
  PluckRedirectError,
  PluckSizeError,
  PluckTimeoutError,
} from './types.js';

// Store original fetch
const originalFetch = global.fetch;

// Mock fetch responses
type MockFetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
let mockFetch: MockFetchFn | null = null;

// Setup/teardown
before(() => {
  // Replace global fetch with mock
  (global as typeof globalThis & { fetch: MockFetchFn }).fetch = (input, init) => {
    if (!mockFetch) {
      throw new Error('Mock fetch not configured! Tests should never make real API calls.');
    }
    return mockFetch(input, init);
  };
});

after(() => {
  // Restore original fetch
  global.fetch = originalFetch;
});

// Helper to create mock Response
function createMockResponse(
  body: string | ArrayBuffer,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    url?: string;
  } = {},
): Response {
  const buffer = typeof body === 'string' ? new TextEncoder().encode(body).buffer : body;

  return {
    ok: (options.status ?? 200) >= 200 && (options.status ?? 200) < 300,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: new Headers(options.headers ?? {}),
    url: options.url ?? 'https://example.com/',
    redirected: false,
    type: 'basic',
    arrayBuffer: async () => buffer,
    text: async () => new TextDecoder().decode(buffer),
    json: async () => JSON.parse(new TextDecoder().decode(buffer)),
    blob: async () => new Blob([buffer]),
    formData: async () => new FormData(),
    clone: () => createMockResponse(buffer, options),
    body: null,
    bodyUsed: false,
  } as Response;
}

describe('pluck - basic usage', () => {
  it('should fetch HTML successfully', async () => {
    mockFetch = async () => createMockResponse('<html>Hello World</html>');

    const response = await pluck('https://example.com');

    assert.equal(response.status, 200);
    assert.equal(response.ok, true);
    assert.ok(response.originalUrl);
    assert.ok(response.finalUrl);
    assert.ok(Array.isArray(response.redirectChain));
    assert.ok(response.detectedEncoding);
    assert.ok(response.timing);
  });

  it('should decode response text as UTF-8', async () => {
    mockFetch = async () =>
      createMockResponse('<html>Hello World</html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });

    const response = await pluck('https://example.com');
    const text = await response.textUtf8();

    assert.equal(text, '<html>Hello World</html>');
  });

  it('should detect encoding from Content-Type header', async () => {
    mockFetch = async () =>
      createMockResponse('Hello', {
        headers: { 'content-type': 'text/html; charset=windows-1252' },
      });

    const response = await pluck('https://example.com');

    assert.equal(response.detectedEncoding, 'windows-1252');
  });

  it('should work with URL object', async () => {
    mockFetch = async () => createMockResponse('OK');

    const response = await pluck(new URL('https://example.com'));

    assert.equal(response.status, 200);
  });

  it('should include timing information', async () => {
    mockFetch = async () => createMockResponse('OK');

    const response = await pluck('https://example.com');

    assert.ok(response.timing.start > 0);
    assert.ok(response.timing.end > 0);
    assert.ok(response.timing.duration >= 0);
    assert.ok(response.timing.end >= response.timing.start);
  });
});

describe('pluck - redirects', () => {
  it('should follow redirects and track chain', async () => {
    let callCount = 0;
    mockFetch = async (input) => {
      const url = input.toString();
      callCount++;

      if (url === 'https://example.com/') {
        return createMockResponse('', {
          status: 302,
          headers: { location: 'https://example.com/redirect1' },
        });
      }
      if (url === 'https://example.com/redirect1') {
        return createMockResponse('', {
          status: 302,
          headers: { location: 'https://example.com/final' },
        });
      }
      return createMockResponse('Final Page', {
        url: 'https://example.com/final',
      });
    };

    const response = await pluck('https://example.com/');

    assert.equal(response.originalUrl, 'https://example.com/');
    assert.equal(response.finalUrl, 'https://example.com/final');
    assert.deepEqual(response.redirectChain, [
      'https://example.com/',
      'https://example.com/redirect1',
    ]);
    assert.ok(response.timing.redirectDuration !== undefined);
    assert.equal(callCount, 3);
  });

  it('should handle relative redirect URLs', async () => {
    let callCount = 0;
    mockFetch = async (input) => {
      const url = input.toString();
      callCount++;

      if (url === 'https://example.com/page1') {
        return createMockResponse('', {
          status: 302,
          headers: { location: '/page2' }, // Relative
        });
      }
      return createMockResponse('Page 2');
    };

    const response = await pluck('https://example.com/page1');

    assert.equal(response.redirectChain.length, 1);
    assert.equal(callCount, 2);
  });

  it('should handle protocol-relative redirects', async () => {
    let callCount = 0;
    mockFetch = async (input) => {
      const url = input.toString();
      callCount++;

      if (url === 'http://example.com/') {
        return createMockResponse('', {
          status: 302,
          headers: { location: '//example.com/secure' }, // Protocol-relative
        });
      }
      return createMockResponse('Secure Page');
    };

    await pluck('http://example.com/');

    assert.equal(callCount, 2);
  });

  it('should throw on too many redirects', async () => {
    mockFetch = async () =>
      createMockResponse('', {
        status: 302,
        headers: { location: 'https://example.com/loop' },
      });

    await assert.rejects(
      async () => pluck('https://example.com/', { maxRedirects: 2 }),
      PluckRedirectError,
    );
  });

  it('should detect redirect loops', async () => {
    mockFetch = async (input) => {
      const url = input.toString();

      if (url === 'https://example.com/a') {
        return createMockResponse('', {
          status: 302,
          headers: { location: 'https://example.com/b' },
        });
      }
      // b redirects back to a - loop!
      return createMockResponse('', {
        status: 302,
        headers: { location: 'https://example.com/a' },
      });
    };

    await assert.rejects(
      async () => pluck('https://example.com/a'),
      (error: PluckRedirectError) => {
        assert.ok(error instanceof PluckRedirectError);
        assert.match(error.message, /loop/i);
        return true;
      },
    );
  });

  it('should throw on missing Location header', async () => {
    mockFetch = async () =>
      createMockResponse('', {
        status: 302,
        // No Location header
      });

    await assert.rejects(async () => pluck('https://example.com/'), PluckRedirectError);
  });

  it('should not follow redirects if followRedirects=false', async () => {
    mockFetch = async () =>
      createMockResponse('', {
        status: 302,
        headers: { location: 'https://example.com/other' },
      });

    const response = await pluck('https://example.com/', {
      followRedirects: false,
      throwOnHttpError: false,
    });

    assert.equal(response.status, 302);
    assert.equal(response.redirectChain.length, 0);
  });

  it('should reject redirects to non-HTTP(S) schemes', async () => {
    mockFetch = async () =>
      createMockResponse('', {
        status: 302,
        headers: { location: 'file:///etc/passwd' },
      });

    await assert.rejects(async () => pluck('https://example.com/'), PluckRedirectError);
  });
});

describe('pluck - timeouts', () => {
  it('should timeout slow requests', async () => {
    mockFetch = async (_input, init) => {
      // Simulate slow request that respects abort signal
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 1000);
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
      return createMockResponse('Too Slow');
    };

    await assert.rejects(
      async () => pluck('https://example.com/', { timeout: 100 }),
      PluckTimeoutError,
    );
  });

  it('should include timeout value in error', async () => {
    mockFetch = async (_input, init) => {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 1000);
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
      return createMockResponse('Too Slow');
    };

    try {
      await pluck('https://example.com/', { timeout: 50 });
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error instanceof PluckTimeoutError);
      assert.equal(error.timeoutMs, 50);
    }
  });
});

describe('pluck - size limits', () => {
  it('should enforce size limit from Content-Length header', async () => {
    mockFetch = async () =>
      createMockResponse('x'.repeat(100), {
        headers: { 'content-length': '100' },
      });

    await assert.rejects(
      async () => pluck('https://example.com/', { maxSize: 50 }),
      PluckSizeError,
    );
  });

  it('should enforce size limit on actual content', async () => {
    const largeContent = 'x'.repeat(1000);
    mockFetch = async () => createMockResponse(largeContent);

    await assert.rejects(
      async () => pluck('https://example.com/', { maxSize: 100 }),
      PluckSizeError,
    );
  });

  it('should include size information in error', async () => {
    mockFetch = async () =>
      createMockResponse('x'.repeat(100), {
        headers: { 'content-length': '100' },
      });

    try {
      await pluck('https://example.com/', { maxSize: 50 });
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error instanceof PluckSizeError);
      assert.equal(error.maxSize, 50);
      assert.equal(error.actualSize, 100);
    }
  });

  it('should allow content within size limit', async () => {
    mockFetch = async () => createMockResponse('Small content');

    const response = await pluck('https://example.com/', { maxSize: 1000 });

    assert.equal(response.status, 200);
  });
});

describe('pluck - HTTP errors', () => {
  it('should throw on 404 by default', async () => {
    mockFetch = async () =>
      createMockResponse('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });

    await assert.rejects(
      async () => pluck('https://example.com/'),
      (error: PluckHttpError) => {
        assert.ok(error instanceof PluckHttpError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.statusText, 'Not Found');
        return true;
      },
    );
  });

  it('should throw on 500 by default', async () => {
    mockFetch = async () =>
      createMockResponse('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

    await assert.rejects(async () => pluck('https://example.com/'), PluckHttpError);
  });

  it('should not throw on errors if throwOnHttpError=false', async () => {
    mockFetch = async () =>
      createMockResponse('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });

    const response = await pluck('https://example.com/', { throwOnHttpError: false });

    assert.equal(response.status, 404);
    assert.equal(response.ok, false);
  });

  it('should not throw on 2xx status', async () => {
    mockFetch = async () =>
      createMockResponse('OK', {
        status: 201,
        statusText: 'Created',
      });

    const response = await pluck('https://example.com/');

    assert.equal(response.status, 201);
    assert.equal(response.ok, true);
  });
});

describe('pluck - Content-Type validation', () => {
  it('should validate Content-Type if strictContentType=true', async () => {
    mockFetch = async () =>
      createMockResponse('Binary Data', {
        headers: { 'content-type': 'application/octet-stream' },
      });

    await assert.rejects(
      async () => pluck('https://example.com/', { strictContentType: true }),
      PluckContentTypeError,
    );
  });

  it('should allow HTML Content-Type', async () => {
    mockFetch = async () =>
      createMockResponse('<html></html>', {
        headers: { 'content-type': 'text/html' },
      });

    const response = await pluck('https://example.com/', { strictContentType: true });

    assert.equal(response.status, 200);
  });

  it('should allow custom allowed types', async () => {
    mockFetch = async () =>
      createMockResponse('PDF Data', {
        headers: { 'content-type': 'application/pdf' },
      });

    const response = await pluck('https://example.com/', {
      strictContentType: true,
      allowedContentTypes: ['application/pdf'],
    });

    assert.equal(response.status, 200);
  });

  it('should throw on missing Content-Type if strict', async () => {
    mockFetch = async () => createMockResponse('Content');

    await assert.rejects(
      async () => pluck('https://example.com/', { strictContentType: true }),
      PluckContentTypeError,
    );
  });

  it('should not validate Content-Type by default', async () => {
    mockFetch = async () =>
      createMockResponse('Binary', {
        headers: { 'content-type': 'application/octet-stream' },
      });

    const response = await pluck('https://example.com/');

    assert.equal(response.status, 200);
  });
});

describe('pluck - encoding detection', () => {
  it('should detect UTF-8 BOM', async () => {
    // UTF-8 BOM: EF BB BF
    const buffer = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...Array.from(new TextEncoder().encode('Hello')),
    ]).buffer;
    mockFetch = async () => createMockResponse(buffer);

    const response = await pluck('https://example.com/');

    assert.equal(response.detectedEncoding, 'utf-8');
  });

  it('should detect encoding from meta charset', async () => {
    const html = '<meta charset="windows-1252"><html>Hello</html>';
    mockFetch = async () => createMockResponse(html);

    const response = await pluck('https://example.com/');

    assert.equal(response.detectedEncoding, 'windows-1252');
  });

  it('should prioritize header over meta charset', async () => {
    const html = '<meta charset="iso-8859-1"><html>Hello</html>';
    mockFetch = async () =>
      createMockResponse(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });

    const response = await pluck('https://example.com/');

    assert.equal(response.detectedEncoding, 'utf-8');
  });

  it('should throw on invalid encoding if validateEncoding=true', async () => {
    mockFetch = async () =>
      createMockResponse('Hello', {
        headers: { 'content-type': 'text/html; charset=invalid-encoding' },
      });

    await assert.rejects(async () => pluck('https://example.com/'), PluckEncodingError);
  });

  it('should not throw on invalid encoding if validateEncoding=false', async () => {
    mockFetch = async () =>
      createMockResponse('Hello', {
        headers: { 'content-type': 'text/html; charset=invalid-encoding' },
      });

    const response = await pluck('https://example.com/', { validateEncoding: false });

    assert.equal(response.status, 200);
  });
});

describe('pluck - headers', () => {
  it('should set default User-Agent', async () => {
    let receivedHeaders: Headers | undefined;
    mockFetch = async (_input, init) => {
      receivedHeaders = new Headers(init?.headers);
      return createMockResponse('OK');
    };

    await pluck('https://example.com/');

    assert.ok(receivedHeaders);
    assert.ok(receivedHeaders.get('user-agent')?.includes('Magpie-HTML'));
  });

  it('should allow custom User-Agent via userAgent option', async () => {
    let receivedHeaders: Headers | undefined;
    mockFetch = async (_input, init) => {
      receivedHeaders = new Headers(init?.headers);
      return createMockResponse('OK');
    };

    await pluck('https://example.com/', { userAgent: 'MyBot/1.0' });

    assert.ok(receivedHeaders);
    assert.equal(receivedHeaders.get('user-agent'), 'MyBot/1.0');
  });

  it('should allow custom headers', async () => {
    let receivedHeaders: Headers | undefined;
    mockFetch = async (_input, init) => {
      receivedHeaders = new Headers(init?.headers);
      return createMockResponse('OK');
    };

    await pluck('https://example.com/', {
      headers: { 'X-Custom': 'Value' },
    });

    assert.ok(receivedHeaders);
    assert.equal(receivedHeaders.get('x-custom'), 'Value');
  });

  it('should set default Accept header', async () => {
    let receivedHeaders: Headers | undefined;
    mockFetch = async (_input, init) => {
      receivedHeaders = new Headers(init?.headers);
      return createMockResponse('OK');
    };

    await pluck('https://example.com/');

    assert.ok(receivedHeaders);
    assert.ok(receivedHeaders.get('accept')?.includes('text/html'));
  });
});

describe('pluck - network errors', () => {
  it('should convert TypeError to PluckNetworkError', async () => {
    mockFetch = async () => {
      throw new TypeError('Network error');
    };

    await assert.rejects(
      async () => pluck('https://example.com/'),
      (error: PluckNetworkError) => {
        assert.ok(error instanceof PluckNetworkError);
        assert.match(error.message, /Network error/);
        return true;
      },
    );
  });
});

describe('pluck - edge cases', () => {
  it('should handle empty response body', async () => {
    mockFetch = async () => createMockResponse('');

    const response = await pluck('https://example.com/');
    const text = await response.textUtf8();

    assert.equal(text, '');
  });

  it('should handle very large valid response', async () => {
    const largeContent = 'x'.repeat(5 * 1024 * 1024); // 5MB
    mockFetch = async () => createMockResponse(largeContent);

    const response = await pluck('https://example.com/', {
      maxSize: 10 * 1024 * 1024,
    });

    assert.equal(response.status, 200);
  });

  it('should preserve originalUrl and finalUrl when no redirects', async () => {
    mockFetch = async () => createMockResponse('OK', { url: 'https://example.com/' });

    const response = await pluck('https://example.com/');

    assert.equal(response.originalUrl, 'https://example.com/');
    assert.equal(response.finalUrl, 'https://example.com/');
    assert.equal(response.redirectChain.length, 0);
  });

  it('should handle query strings in URLs', async () => {
    mockFetch = async () => createMockResponse('OK');

    const response = await pluck('https://example.com/page?foo=bar');

    assert.ok(response.originalUrl.includes('foo=bar'));
  });

  it('should work with POST requests', async () => {
    let receivedMethod: string | undefined;
    mockFetch = async (_input, init) => {
      receivedMethod = init?.method;
      return createMockResponse('OK');
    };

    await pluck('https://example.com/', {
      method: 'POST',
      body: 'data',
    });

    assert.equal(receivedMethod, 'POST');
  });
});
