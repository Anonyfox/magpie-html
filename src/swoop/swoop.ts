import { pluck } from '../pluck/index.js';
import { runVmEngine } from './engines/vm.js';
import { SwoopEnvironmentError } from './errors.js';
import { discoverAndFetchScripts } from './scripts/discover.js';
import type { SwoopConsoleEntry, SwoopInit, SwoopResult, SwoopScriptError } from './types.js';
import { isNodeRuntime, normalizeInit } from './utils.js';

// Capture host web primordials once, so sandbox/window proxies can't accidentally
// overwrite them and cause recursion (especially in tests).
const HOST_FETCH: typeof fetch | undefined =
  typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined;

/**
 * Execute client-side JavaScript against a DOM-only environment and snapshot the resulting HTML.
 *
 * @remarks
 * **Experimental feature**.
 *
 * @remarks
 * - Default engine (`vm`) works on regular Node.js.
 *
 * This is *not* a real browser engine:
 * - No layout/paint/CSS correctness
 * - No true navigation lifecycle
 * - Best-effort shims for browser APIs
 *
 * ⚠️ **Security**: This executes third-party JavaScript. Only use on trusted sources or in an OS sandbox.
 */
export async function swoop(url: string | URL, init?: SwoopInit): Promise<SwoopResult> {
  const start = Date.now();
  const options = normalizeInit(init);
  const totalBudgetMs = Math.min(options.timeout, 5000);
  const deadline = start + totalBudgetMs;

  if (!isNodeRuntime()) {
    throw new SwoopEnvironmentError('swoop() is currently Node.js-only.');
  }

  // Fetch initial HTML (use pluck for robust encoding + redirects)
  const res = await pluck(String(url), {
    ...options.pluck,
    timeout: Math.min(options.pluck.timeout ?? 30000, totalBudgetMs),
    strictContentType: false,
    throwOnHttpError: true,
  });
  const html = await res.textUtf8();
  const finalUrl = res.finalUrl;

  const { scripts, errors: preErrors } = await discoverAndFetchScripts(html, finalUrl, options);

  // Engine: vm
  let snapshot = '';
  let consoleEntries: SwoopConsoleEntry[] = [];
  let engineErrors: SwoopScriptError[] = [];

  const r = await runVmEngine({
    finalUrl,
    html,
    scripts,
    options,
    totalBudgetMs,
    deadline,
    hostFetch: HOST_FETCH,
  });
  snapshot = r.snapshot;
  consoleEntries = r.consoleEntries;
  engineErrors = r.engineErrors;

  const end = Date.now();
  return {
    url: finalUrl,
    html: snapshot,
    console: consoleEntries,
    errors: [...preErrors, ...engineErrors],
    timing: {
      start,
      end,
      duration: end - start,
    },
  };
}
