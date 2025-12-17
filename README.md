# Magpie HTML 🦅

Modern TypeScript library for scraping web content with isomorphic support. Works seamlessly in both Node.js and browser environments.

## Features

- 🎯 **Isomorphic** - Works in Node.js and browsers
- 📦 **Modern ESM/CJS** - Dual format support
- 🔒 **Type-safe** - Full TypeScript support
- 🧪 **Well-tested** - Built with Node.js native test runner
- 🚀 **Zero dependencies** - Lightweight and fast

## Installation

```bash
npm install magpie-html
```

## Usage

### Basic Example

```typescript
import { helloWorld, extractText, getEnvironment } from "magpie-html";

// Simple greeting
console.log(helloWorld("Developer"));
// Output: Hello, Developer! Welcome to Magpie HTML 🦅

// Extract text from HTML
const html = "<div><h1>Title</h1><p>Content</p></div>";
const text = extractText(html);
console.log(text);
// Output: Title Content

// Check environment
console.log(getEnvironment());
// Output: 'node' or 'browser'
```

### In Browser

```html
<script type="module">
  import { extractText } from "https://unpkg.com/magpie-html";

  const html = document.body.innerHTML;
  const text = extractText(html);
  console.log(text);
</script>
```

## API

### `helloWorld(name?: string): string`

Returns a greeting message.

- **name** (optional): The name to greet. Defaults to 'World'.

### `extractText(html: string): string`

Extracts plain text content from an HTML string.

- **html**: The HTML string to parse
- Returns: The extracted text with normalized whitespace

### `isBrowser(): boolean`

Checks if the code is running in a browser environment.

- Returns: `true` if in browser, `false` otherwise

### `getEnvironment(): 'browser' | 'node'`

Gets the current runtime environment.

- Returns: Either `'browser'` or `'node'`

## Development

### Setup

```bash
npm install
```

### Run Tests

```bash
npm test
```

The test suite includes both unit tests (`*.test.ts`) and integration tests that use real-world HTML and feed files from the `cache/` directory.

### Watch Mode

```bash
npm run test:watch
```

### Build

```bash
npm run build
```

### Linting & Formatting

The project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format

# Run all checks (typecheck + lint)
npm run check
```

### Type Check

```bash
npm run typecheck
```

### Development Mode

```bash
npm run dev
```

## Integration Testing

The `cache/` directory contains real-world HTML and feed samples from various sources for integration testing. This enables testing against actual production data structures without network calls.

## Publishing

The package is configured for easy publishing to npm:

```bash
npm publish
```

The `prepublishOnly` script automatically builds the package before publishing.

## License

MIT

## Author

[Anonyfox](https://anonyfox.com)
