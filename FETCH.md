# Magpie Pluck - Enhanced Fetch for Web Scraping

**Name:** `pluck()` - Fetch HTML/feeds from the wild web with resilience

**Goal:** Production-ready **single-request** fetch replacement that handles real-world chaos without dependencies.

**Design:** **fetch-compatible** drop-in replacement - same API, but does MORE under the hood.

**Scope:** ONE request - from initial URL to final response. Not a crawler, not a multi-request manager.

---

## Core Philosophy

1. **fetch-compatible** - Drop-in replacement for native fetch()
2. **Standard Request/Response** - Use/extend native Web APIs
3. **Zero dependencies** - Use native APIs (fetch, TextDecoder, URL, AbortController)
4. **Single request focused** - Handle everything within ONE HTTP request lifecycle
5. **Node.js focused** - Optimize for server-side scraping (browser support is bonus)
6. **Resilient** - Handle broken sites, weird encodings, redirect chains
7. **Enhanced but transparent** - Do MORE without breaking fetch API
8. **Stateless** - No cookies, no cache, no state between calls

---

## Critical Features (MVP)

### 1. Redirect Handling

- **Manual redirect following** - Capture full redirect chain
- Track: `originalUrl`, `finalUrl`, `redirects: string[]`
- Configurable `maxRedirects` (default: 10)
- Handle relative/absolute Location headers
- Detect redirect loops
- Preserve method on 307/308, switch to GET on 301/302/303

### 2. Encoding Detection & Conversion

- **Priority order:**

  1. Check BOM (Byte Order Mark)
  2. Parse `Content-Type: text/html; charset=XXX` header
  3. Scan first 1KB for `<meta charset="XXX">` (light regex, no parsing)
  4. Scan for `<meta http-equiv="Content-Type" content="text/html; charset=XXX">`
  5. Default to UTF-8

- **Support via native TextDecoder:**

  - UTF-8, UTF-16LE, UTF-16BE
  - ISO-8859-1 through ISO-8859-15
  - Windows-1252 (ANSI Western)
  - Windows-1251 (Cyrillic)
  - etc.

- **Always return UTF-8 string** regardless of source encoding

### 3. Timeouts

- Configurable timeout (default: 30 seconds)
- Use `AbortController` + `setTimeout`
- Abort on timeout with clear error
- Separate timeouts for:
  - Connection timeout
  - Total request timeout

### 4. Size Limits

- **Max response size** (default: 10MB)
- Stream and check size incrementally
- Abort if exceeded
- Configurable per request

### 5. Smart Headers

- **User-Agent:**

  - Default: `"Mozilla/5.0 (compatible; Magpie-HTML/1.0; +https://github.com/Anonyfox/magpie-html)"`
  - Configurable
  - Polite bot identification

- **Accept:**

  - Default: `"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"`
  - Include feed formats: `application/rss+xml, application/atom+xml, application/json`

- **Accept-Encoding:**

  - `"gzip, deflate, br"` (fetch handles automatically)

- **Accept-Language:**

  - `"en-US,en;q=0.9"` (configurable)

- **Custom headers:**
  - User can override/add headers

### 6. Content-Type Validation

- **Check response Content-Type**
- Warn/error if not text/html, text/xml, application/\*xml, application/json
- Option: `strictContentType` (throw on mismatch)
- Option: `allowedContentTypes: string[]`

### 7. HTTP Status Handling

- **2xx:** Success
- **3xx:** Manual redirect handling
- **4xx/5xx:**
  - Option: `throwOnHttpError` (default: true)
  - Include status code, statusText, headers in error
  - Option: `retryOn5xx` (retry 500, 502, 503, 504)

### 8. Error Types

Clear, actionable error classes:

- `PluckNetworkError` - Connection failed, DNS, etc.
- `PluckTimeoutError` - Request timeout
- `PluckHttpError` - 4xx/5xx status codes
- `PluckSizeError` - Response too large
- `PluckEncodingError` - Failed to decode
- `PluckRedirectError` - Too many redirects, loop detected
- `PluckContentTypeError` - Wrong content type

---

## Important Features (Phase 2)

### 9. Enhanced Response Object

Extend standard Response with extras:

```typescript
// PluckResponse extends native Response
interface PluckResponse extends Response {
  // All standard Response properties/methods work
  // status, statusText, headers, ok, body, text(), json(), etc.

  // Plus enhancements:
  finalUrl: string; // URL after redirects
  originalUrl: string; // Initial request URL
  redirectChain: string[]; // Array of redirect URLs
  detectedEncoding: string; // Detected charset (e.g., 'utf-8')
  timing: {
    start: number; // Request start timestamp
    end: number; // Request end timestamp
    duration: number; // Total milliseconds
    redirectDuration?: number; // Time in redirects
  };

  // Enhanced text method (guarantees UTF-8)
  textUtf8(): Promise<string>; // Always UTF-8, regardless of source
}
```

### 10. Type Safety

- **PluckInit extends RequestInit** - All fetch options work
- **PluckResponse extends Response** - All Response APIs work
- TypeScript users get full autocomplete
- Runtime validation of our extended options
- Backwards compatible with fetch types

---

## Edge Cases to Handle

### URL Issues

- ✅ Relative URLs (with base URL)
- ✅ Protocol-relative URLs (`//example.com`)
- ✅ IDN/Punycode domains
- ✅ Invalid/malformed URLs
- ✅ Spaces and special chars in URLs
- ✅ URL encoding

### Redirect Edge Cases

- ✅ Redirect to relative URL
- ✅ Redirect to protocol-relative URL
- ✅ Redirect loop detection (same URL twice)
- ✅ Redirect chain limit
- ✅ Redirect to different protocol (http → https, https → http)
- ✅ Missing Location header
- ✅ Empty Location header

### Encoding Edge Cases

- ✅ Missing charset in Content-Type
- ✅ Wrong charset label (says UTF-8, actually Windows-1252)
- ✅ Multiple meta charset tags (use first)
- ✅ BOM detection (UTF-8, UTF-16)
- ✅ Mixed encodings (header vs meta tag - prefer header)
- ✅ Invalid/unknown encoding name
- ✅ Malformed UTF-8 sequences

### Content Issues

- ✅ Empty response body
- ✅ Incomplete/truncated response
- ✅ Binary content (images, PDFs) when expecting HTML
- ✅ Gzipped/compressed content (fetch handles, but verify)
- ✅ Chunked transfer encoding

### Network Issues

- ✅ DNS resolution failure
- ✅ Connection refused
- ✅ Connection reset
- ✅ SSL/TLS errors
- ✅ Timeout during connection
- ✅ Timeout during data transfer
- ✅ Slow response (slow headers, slow body)

### Server Behavior

- ✅ No Content-Type header
- ✅ Wrong Content-Type header
- ✅ Missing Content-Length
- ✅ Wrong Content-Length
- ✅ Infinite response (no end)
- ✅ Server hangs (no response)

---

## Security Considerations

### 1. Redirect Security

- **Limit redirect chains** (prevent infinite loops)
- Verify protocol after redirect (warn on https → http downgrade)
- Block redirects to file://, data:, javascript:, etc.

### 2. Size Limits

- **Prevent memory exhaustion**
- Enforce max response size
- Stream and check incrementally

### 3. Header Injection

- **Validate custom headers**
- No CRLF injection
- Validate header names/values

### 4. URL Validation

- **Validate scheme** - Only http:// and https://
- Block dangerous protocols (file://, data://, javascript:/)
- Validate after redirect too

---

## Performance Optimizations

### 1. Streaming

- **Stream response body**
- Don't buffer entire response in memory
- Check size while streaming
- Abort early if too large

### 2. Connection Reuse

- HTTP keep-alive (fetch handles automatically)
- Connection pooling (fetch agent handles)

### 3. Compression

- Accept gzip, deflate, brotli
- fetch decompresses automatically

### 4. DNS Caching

- Use system DNS cache
- Node.js fetch handles this

---

## API Design

### Basic Usage (fetch-compatible)

```typescript
import { pluck } from "magpie-html";

// Works exactly like fetch!
const response = await pluck("https://example.com");
const html = await response.text(); // Standard Response.text()

// But has enhancements
console.log(response.finalUrl); // URL after redirects
console.log(response.redirectChain); // Array of redirect URLs
console.log(response.detectedEncoding); // Detected charset
console.log(response.timing); // Request timing info
```

### Standard fetch API (all work!)

```typescript
const response = await pluck("https://example.com");

// Standard Response methods
await response.text(); // Get text (UTF-8 decoded!)
await response.json(); // Parse JSON
await response.arrayBuffer(); // Get raw bytes
await response.blob(); // Get Blob

// Standard Response properties
response.status; // HTTP status code
response.statusText; // Status message
response.headers; // Headers object
response.ok; // True if 2xx
response.redirected; // Was there a redirect?
response.url; // Final URL
response.type; // Response type
```

### With Standard RequestInit (fetch options)

```typescript
// All standard fetch options work
const response = await pluck("https://example.com", {
  method: "POST", // HTTP method
  headers: {
    // Standard headers
    "Content-Type": "application/json",
    Cookie: "session=abc123",
  },
  body: JSON.stringify({ data }),
  signal: abortController.signal, // Standard AbortSignal
});
```

### Plus Enhanced Options

```typescript
const response = await pluck("https://example.com", {
  // Standard fetch options
  method: "GET",
  headers: { "X-Custom": "value" },

  // Plus our enhancements (PluckInit extends RequestInit)
  timeout: 30000, // Auto-abort after 30s
  maxRedirects: 10, // Limit redirect chains
  maxSize: 10 * 1024 * 1024, // 10MB limit
  userAgent: "MyBot/1.0", // Shortcut for User-Agent header
  strictContentType: true, // Validate content type
  allowedContentTypes: ["text/html", "application/xhtml+xml"],
  throwOnHttpError: true, // Throw on 4xx/5xx
  followRedirects: true, // Default: true (manual tracking)
  validateEncoding: true, // Verify charset is valid
});
```

### Enhanced Response Properties

```typescript
const response: PluckResponse = await pluck(url);

// Standard Response (all native properties/methods work)
response.status;
response.headers;
await response.text();

// Plus enhancements
response.finalUrl;              // URL after redirects (string)
response.originalUrl;           // Initial request URL (string)
response.redirectChain;         // Array of intermediate URLs
response.detectedEncoding;      // Charset detected (e.g., 'utf-8', 'windows-1252')
response.timing: {
  start: number;                // Request start timestamp
  end: number;                  // Request end timestamp
  duration: number;             // Total milliseconds
  redirectDuration?: number;    // Time in redirects
};

// Convenience methods (in addition to standard Response methods)
response.textUtf8();            // Guaranteed UTF-8 decoded text (our enhancement)
```

### Migration from fetch

```typescript
// Before (native fetch)
const response = await fetch("https://example.com");
const html = await response.text();

// After (pluck - drop-in replacement!)
const response = await pluck("https://example.com");
const html = await response.text(); // Works exactly the same

// Plus you get bonuses
console.log(response.redirectChain); // See redirect path
console.log(response.detectedEncoding); // Know the charset
```

### Error Handling (fetch-compatible)

```typescript
try {
  const response = await pluck(url, { throwOnHttpError: false });

  // Standard fetch error checking
  if (!response.ok) {
    console.error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
} catch (error) {
  // Our enhanced errors
  if (error instanceof PluckTimeoutError) {
    console.error("Request timed out");
  } else if (error instanceof PluckNetworkError) {
    console.error("Network error:", error.message);
  } else if (error instanceof PluckEncodingError) {
    console.error("Encoding error:", error.message);
  }
}
```

### With Caller-Managed Retry

```typescript
// Retry is CALLER's responsibility (pluck is stateless)
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await pluck(url);
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

- URL parsing and normalization
- Encoding detection (BOM, headers, meta tags)
- Redirect logic (relative, absolute, loops)
- Timeout handling
- Size limit enforcement
- Error classification

### Integration Tests

- Real HTTP requests (to test server)
- Various encoding scenarios
- Redirect chains
- Large responses
- Slow servers
- Error responses

### Real-World Tests

- Test against known sites (via cache)
- Various encodings in the wild
- Redirect chains
- Malformed HTML
- Edge cases from production

---

## Implementation Phases

### Phase 1: Core (MVP)

- ✅ Manual redirect handling with chain tracking
- ✅ Encoding detection and UTF-8 conversion
- ✅ Timeouts with AbortController
- ✅ Size limits with streaming
- ✅ Smart default headers
- ✅ Content-Type validation
- ✅ Clear error types
- ✅ Comprehensive result metadata

### Phase 2: Production-Ready

- Enhanced error context (include response body snippet)
- Custom headers helpers
- Better encoding fallback handling
- Redirect security validation
- Comprehensive edge case handling

### Phase 3: Polish

- Performance optimizations
- Better error messages
- Documentation and examples
- Real-world testing and refinement

---

## Dependencies

**Runtime:**

- None! All native APIs

**Dev Dependencies:**

- TypeScript
- Test framework (Node.js native test runner)
- Test server (for integration tests)

---

## Browser Support Notes

While optimized for Node.js, basic functionality should work in browsers:

**Works:**

- Manual redirect handling (with limitations - CORS may prevent seeing Location)
- Encoding detection and conversion
- Timeouts
- Headers
- Error handling

**Limitations:**

- Can't capture redirect chains in browser (CORS)
- SSRF protection not needed (browser does it)
- Some headers restricted by browser (Host, etc.)
- Size limits work but less critical

**Recommendation:** Document as "Node.js first, browser compatible"

---

## Documentation Requirements

1. **Quick Start Guide** - Simple examples
2. **API Reference** - All options, types, errors
3. **Encoding Guide** - How detection works, supported encodings
4. **Redirect Handling** - How chains are captured
5. **Error Handling** - Error types and recovery strategies
6. **Security** - SSRF protection, safe usage
7. **Performance** - Timeouts, size limits, rate limiting
8. **Migration Guide** - From native fetch to pluck()
9. **Troubleshooting** - Common issues and solutions

---

## Out of Scope (Caller's Responsibility)

These are **NOT** part of pluck() - callers should handle:

1. **Retry logic** - Implement your own retry with your strategy
2. **Rate limiting** - Manage request frequency across multiple calls
3. **Cookie management** - Store and send cookies as needed (via headers)
4. **Response caching** - Cache responses if desired
5. **Proxy configuration** - Set up HTTP_PROXY env vars or fetch proxy
6. **Request queuing** - Manage concurrent request limits
7. **SSRF protection** - Validate URLs before calling pluck()
8. **Progress tracking** - Monitor timing via result metadata
9. **Conditional requests** - Send If-Modified-Since headers if needed

**Why?** Because pluck() is **stateless** - it doesn't know about previous requests or future plans.

---

## Open Questions

1. **Redirect method preservation:** Follow HTTP spec strictly or be more lenient?
2. **Encoding fallback:** If TextDecoder fails, fall back to UTF-8 or throw?
3. **Content-Type strictness:** Warn or throw by default?
4. **followRedirects option:** Should it default to true or false?
5. **Error verbosity:** Include response body in error messages?

---

## Success Metrics

A successful `pluck()` implementation should:

1. **Handle 95%+ of real-world sites** without configuration
2. **Never crash** on malformed content (graceful errors)
3. **Predictable behavior** (same input → same output)
4. **Clear errors** (actionable error messages)
5. **Fast** (minimal overhead over native fetch)
6. **Memory safe** (no leaks, bounded memory)
7. **Well-documented** (examples for every feature)
8. **Well-tested** (>90% coverage, real-world edge cases)

---

## Future Considerations

- HTTP/2 support (fetch handles automatically)
- HTTP/3 / QUIC support (when Node.js supports)
- Streaming parser integration (stream HTML to parser) - maybe
- Better TypeScript types (branded types for URLs, etc.)
- Encoding confidence scores (how sure are we about detected encoding?)
- Response integrity checks (content-length vs actual size)

**Not Planned:**

- WebSocket support (different protocol, separate tool)
- GraphQL support (different use case, separate tool)
- Request batching (caller's responsibility)
- Request prioritization (caller's responsibility)
- Bandwidth limiting (caller's responsibility)
- Persistent connections (fetch handles)
- Request logging (caller adds if needed)

---

**This document is a living specification. Update as requirements evolve.**
