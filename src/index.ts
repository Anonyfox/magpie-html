/**
 * Magpie HTML - Modern TypeScript library for scraping web content
 * @module magpie-html
 */

/**
 * Greets the user with a hello world message
 * @param name - The name to greet
 * @returns A greeting message
 */
export function helloWorld(name: string = 'World'): string {
  return `Hello, ${name}! Welcome to Magpie HTML 🦅`;
}

/**
 * Extracts text content from HTML string
 * This is a simple example that works in both Node.js and browser environments
 * @param html - The HTML string to parse
 * @returns The extracted text content
 */
export function extractText(html: string): string {
  // Simple regex-based approach that works universally
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if the code is running in a browser environment
 * @returns True if running in a browser, false otherwise
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Gets the current environment name
 * @returns The environment name ('browser' or 'node')
 */
export function getEnvironment(): 'browser' | 'node' {
  return isBrowser() ? 'browser' : 'node';
}
