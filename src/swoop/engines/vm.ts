import vm from 'node:vm';
import { parseHTML as linkedomParseHTML } from 'linkedom';

import { pluck } from '../../pluck/index.js';
import { createConsoleCapture } from '../console.js';
import { installAsyncEnv } from '../env/async.js';
import { computeBaseForResolve, patchBaseElementHref, patchDocumentBaseURI } from '../env/base.js';
import { installBrowserShims } from '../env/browser.js';
import { installCookieJar } from '../env/cookie.js';
import { installFetchShim } from '../env/fetch.js';
import { createNavigationShims } from '../env/navigation.js';
import { installPermissiveShims } from '../env/permissive.js';
import { installXMLHttpRequest } from '../env/xhr.js';
import { synthesizeLifecycle } from '../lifecycle.js';
import { emitDebugProbes, installDebugProbes } from '../probes.js';
import type { DiscoveredScript } from '../scripts/discover.js';
import { createScriptLoader } from '../scripts/loader.js';
import type { SwoopInit, SwoopScriptError } from '../types.js';
import { sleep } from '../utils.js';
import {
  defineWindowInContext,
  ensureRealmFunctionIntrinsic,
  installRealmWrappers,
} from '../vm/bootstrap.js';
import { createModuleLoader } from '../vm/modules.js';
import { waitForSettle } from '../wait.js';
import type { EngineRunResult } from './types.js';

export async function runVmEngine(args: {
  finalUrl: string;
  html: string;
  scripts: DiscoveredScript[];
  options: Required<SwoopInit>;
  totalBudgetMs: number;
  deadline: number;
  hostFetch: typeof fetch | undefined;
}): Promise<EngineRunResult> {
  const { entries: realmConsole, record } = createConsoleCapture();

  const remainingMs = () => Math.max(0, args.deadline - Date.now());

  const { window, document } = linkedomParseHTML(args.html, { url: args.finalUrl });

  const pageUrl = new URL(args.finalUrl);

  // For resolving relative URLs, respect the document's <base href="..."> if present.
  // Also enforce browser invariants for `document.baseURI` / `<base>.href` to be absolute.
  const { baseForResolve, baseEl } = computeBaseForResolve(args.finalUrl, document);
  patchDocumentBaseURI(document, baseForResolve);
  patchBaseElementHref(baseEl, baseForResolve);

  const documentBaseUriForDom = baseForResolve.href;

  // Start with a browser-ish initial document lifecycle state.
  try {
    (document as any).readyState ??= 'loading';
  } catch {
    // ignore
  }

  // Use a dedicated sandbox global object whose prototype is the DOM window.
  const domWindow = window as any;
  const globalObj: any = Object.create(domWindow);

  // Browser-ish globals
  globalObj.window = globalObj;
  globalObj.self = globalObj;
  globalObj.globalThis = globalObj;
  globalObj.document = document;
  try {
    Object.defineProperty(document, 'defaultView', { value: globalObj, configurable: true });
  } catch {
    // ignore
  }

  const { location: locationShim, history: historyShim } = createNavigationShims({
    pageUrl,
    onNavigate: (href) => {
      if (!args.options.debugProbes) return;
      try {
        globalObj.__swoopStats.nav.lastHref = String(href);
      } catch {}
    },
    onPopState: (state) => {
      if (args.options.debugProbes) {
        try {
          globalObj.__swoopStats.nav.pushState++;
        } catch {}
      }
      try {
        globalObj.dispatchEvent?.(new (globalObj.PopStateEvent ?? Event)('popstate', { state }));
      } catch {}
    },
  });

  try {
    Object.defineProperty(document, 'location', {
      configurable: true,
      get: () => locationShim,
      set: (v: string) => {
        try {
          locationShim.href = String(v);
        } catch {}
      },
    });
  } catch {
    // ignore
  }

  globalObj.location = locationShim;
  globalObj.history = historyShim;

  installBrowserShims({ globalObj, domWindow, document, documentBaseUriForDom });
  installCookieJar(document);

  const asyncEnv = installAsyncEnv({ globalObj, debugProbes: args.options.debugProbes });
  const noteAsyncActivity = asyncEnv.noteAsyncActivity;
  const hostSetTimeout = asyncEnv.hostSetTimeout;
  const hostClearTimeout = asyncEnv.hostClearTimeout;

  if (args.options.debugProbes) {
    try {
      installDebugProbes({ globalObj, hostSetTimeout });
    } catch {
      // ignore
    }
  }

  const fetchShim = installFetchShim({
    globalObj,
    hostFetch: args.hostFetch,
    baseForResolveHref: baseForResolve.href,
    remainingMs,
    hostSetTimeout,
    hostClearTimeout,
    noteAsyncActivity,
    debugFetch: args.options.debugFetch,
    recordDebug: (a) => record('debug', a),
    queueMicrotask: (cb) => globalObj.__swoop_queueMicrotask(cb),
  });

  // Browser-style event helpers on globalThis.
  const addEventListener = domWindow.addEventListener?.bind(domWindow);
  const removeEventListener = domWindow.removeEventListener?.bind(domWindow);
  const dispatchEvent = domWindow.dispatchEvent?.bind(domWindow);
  if (typeof addEventListener === 'function') globalObj.addEventListener = addEventListener;
  if (typeof removeEventListener === 'function')
    globalObj.removeEventListener = removeEventListener;
  if (typeof dispatchEvent === 'function') globalObj.dispatchEvent = dispatchEvent;

  // Console capture
  globalObj.console = {
    debug: (...a: unknown[]) => record('debug', a),
    info: (...a: unknown[]) => record('info', a),
    warn: (...a: unknown[]) => record('warn', a),
    error: (...a: unknown[]) => record('error', a),
    log: (...a: unknown[]) => record('log', a),
  };
  if (args.options.forwardConsole) {
    for (const level of ['debug', 'info', 'warn', 'error', 'log'] as const) {
      const original = (console as any)[level]?.bind(console);
      if (typeof original === 'function') {
        const wrapped = globalObj.console[level];
        globalObj.console[level] = (...a: unknown[]) => {
          wrapped(...a);
          original(...a);
        };
      }
    }
  }

  // Capture global error hooks used by browsers/frameworks.
  try {
    globalObj.onerror = (
      message: unknown,
      source?: unknown,
      line?: unknown,
      col?: unknown,
      error?: unknown,
    ) => {
      record('error', ['[window.onerror]', message, source, line, col, error]);
    };
  } catch {}
  try {
    globalObj.onunhandledrejection = (event: any) => {
      record('error', ['[unhandledrejection]', event?.reason]);
    };
  } catch {}
  try {
    globalObj.addEventListener?.('error', (event: any) => {
      record('error', [
        '[error event]',
        event?.message,
        event?.filename,
        event?.lineno,
        event?.colno,
        event?.error instanceof Error
          ? `${event.error.name}: ${event.error.message}\n${event.error.stack ?? ''}`.trim()
          : event?.error,
      ]);
    });
  } catch {}

  if (args.options.permissiveShims) {
    installPermissiveShims(globalObj);
    if (!globalObj.XMLHttpRequest) {
      installXMLHttpRequest({
        globalObj,
        resolveUrl: (u: string) => {
          try {
            return new URL(u, baseForResolve.href).href;
          } catch {
            return u;
          }
        },
        remainingMs,
        hostSetTimeout,
        hostClearTimeout,
        fetch: args.hostFetch,
      });
    }
  }

  const context = vm.createContext(globalObj, { name: 'magpie-html/swoop' });
  defineWindowInContext(context);
  ensureRealmFunctionIntrinsic(context);
  installRealmWrappers(context);

  const { loadModule, linkerFor } = createModuleLoader({
    context,
    remainingMs,
    pluckInit: args.options.pluck,
  });

  const scriptLoader = createScriptLoader({
    globalObj,
    pageUrlHref: pageUrl.href,
    baseForResolveHref: baseForResolve.href,
    remainingMs,
    hostSetTimeout,
    totalBudgetMs: args.totalBudgetMs,
    maxDebugEvents: args.options.debugProbes ? 80 : 0,
    debug: (a) => {
      if (!args.options.debugProbes) return;
      record('debug', a);
    },
    onError: (resolvedSrc, err) => {
      const e = err as Error;
      record('error', ['[swoop] script load failed', resolvedSrc, e?.message || String(e)]);
    },
    noteAsyncActivity,
    fetchText: async (url: string) => {
      const sres = await pluck(url, {
        ...args.options.pluck,
        timeout: Math.min(args.options.pluck.timeout ?? 30000, remainingMs()),
        strictContentType: false,
        throwOnHttpError: true,
      });
      return await sres.textUtf8();
    },
    runClassicScript: (code: string, filename: string) => {
      const script = new vm.Script(code, { filename });
      script.runInContext(context, { timeout: args.totalBudgetMs });
    },
    runModuleScript: async (resolvedSrc: string, parentUrlForResolve: string) => {
      const mod = await loadModule(resolvedSrc, parentUrlForResolve);
      await mod.link(linkerFor(resolvedSrc));
      await mod.evaluate();
    },
  });
  scriptLoader.install();
  const getPendingScriptLoads = () => scriptLoader.getPendingScriptLoads();

  const engineErrors: SwoopScriptError[] = [];

  // Execute discovered scripts
  const classicScripts = args.scripts.filter((s) => !s.isModule);
  const moduleScriptsInOrder = args.scripts.filter((s) => s.isModule);

  for (const s of [...classicScripts, ...moduleScriptsInOrder]) {
    if (remainingMs() <= 0) {
      engineErrors.push({
        stage: 'wait',
        message: `Hard time budget (${args.totalBudgetMs}ms) exceeded while executing scripts; returning snapshot.`,
      });
      break;
    }

    const scriptUrl = s.kind === 'external' ? s.url : `${args.finalUrl}#inline`;
    try {
      if (s.isModule) {
        const modCode = s.code;
        const SourceTextModule = (vm as any).SourceTextModule as any;
        if (!SourceTextModule) {
          throw new Error(
            'Module scripts require Node `--experimental-vm-modules` (vm.SourceTextModule is unavailable).',
          );
        }
        const mod = new SourceTextModule(modCode, {
          context,
          identifier: scriptUrl,
          initializeImportMeta: (meta: any) => {
            meta.url = scriptUrl;
          },
          importModuleDynamically: async (spec: string) => {
            const child = await loadModule(spec, scriptUrl);
            await child.link(linkerFor(scriptUrl));
            await child.evaluate();
            return child;
          },
        });

        const timeoutP = (label: string) =>
          sleep(remainingMs()).then(() => {
            throw new Error(`swoop() time budget exhausted during ${label}`);
          });

        const linkP = mod.link(linkerFor(scriptUrl));
        try {
          await Promise.race([linkP, timeoutP('module link')]);
        } catch (e) {
          void (linkP as any).catch?.(() => {});
          throw e;
        }

        const evalP = mod.evaluate();
        try {
          await Promise.race([evalP as any, timeoutP('module evaluate')]);
        } catch (e) {
          void (evalP as any).catch?.(() => {});
          throw e;
        }
      } else {
        const script = new vm.Script(s.code, { filename: scriptUrl });
        script.runInContext(context, { timeout: args.totalBudgetMs });
      }
    } catch (err) {
      const e = err as Error;
      engineErrors.push({
        stage: 'script',
        scriptUrl: s.kind === 'external' ? s.url : undefined,
        message: e.message || String(e),
        stack: e.stack,
      });
    }
  }

  // Fire DOM lifecycle events
  try {
    synthesizeLifecycle(context, Math.min(50, remainingMs()));
  } catch {
    // ignore
  }

  const settle = await waitForSettle({
    strategy:
      args.options.waitStrategy === 'timeout' || typeof globalObj.fetch !== 'function'
        ? 'timeout'
        : 'networkidle',
    deadlineMs: args.deadline,
    idleTimeMs: args.options.idleTime,
    pollIntervalMs: args.options.pollInterval,
    sleep,
    now: () => Date.now(),
    getPendingFetches: () => fetchShim.getPendingFetches(),
    getPendingScriptLoads,
    getLastAsyncActivityAt: () => asyncEnv.getLastAsyncActivityAt(),
  });

  if (
    settle.timedOut &&
    args.options.waitStrategy === 'networkidle' &&
    typeof globalObj.fetch === 'function'
  ) {
    engineErrors.push({
      stage: 'wait',
      message: `Hard time budget (${args.totalBudgetMs}ms) exceeded waiting for network idle; returning snapshot.`,
    });
  }

  const snapshot = document.documentElement?.outerHTML ?? '';

  if (args.options.debugProbes) {
    try {
      emitDebugProbes(globalObj, (a) => record('debug', a));
    } catch {}
  }

  asyncEnv.cleanup();

  return { snapshot, consoleEntries: realmConsole, engineErrors };
}
