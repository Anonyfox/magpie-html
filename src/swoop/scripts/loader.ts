export interface ScriptLoaderInit {
  globalObj: any;
  pageUrlHref: string;
  baseForResolveHref: string;
  remainingMs: () => number;
  hostSetTimeout: (cb: () => void, ms: number) => any;
  totalBudgetMs: number;
  maxDebugEvents: number;
  debug: (args: unknown[]) => void;
  onError?: (resolvedSrc: string, err: unknown) => void;
  noteAsyncActivity: () => void;

  fetchText: (url: string) => Promise<string>;
  runClassicScript: (code: string, filename: string) => void;
  runModuleScript: (resolvedSrc: string, parentUrlForResolve: string) => Promise<void>;
}

export interface ScriptLoader {
  getPendingScriptLoads: () => number;
  install: () => void;
}

function isScriptEl(node: any): boolean {
  return node?.tagName?.toLowerCase?.() === 'script';
}

export function createScriptLoader(init: ScriptLoaderInit): ScriptLoader {
  const loadedScriptSrcs = new Set<string>();
  let pendingScriptLoads = 0;
  let debugScriptEvents = 0;

  const debugScript = (...args: unknown[]) => {
    if (debugScriptEvents++ > init.maxDebugEvents) return;
    init.debug(args);
  };

  const loadScriptElement = async (scriptEl: any, parentUrlForResolve: string): Promise<void> => {
    const rawSrc = scriptEl?.src || scriptEl?.getAttribute?.('src');
    if (!rawSrc) return;

    let resolvedSrc: string;
    try {
      resolvedSrc = new URL(String(rawSrc), init.baseForResolveHref).href;
    } catch {
      return;
    }
    if (loadedScriptSrcs.has(resolvedSrc)) return;
    loadedScriptSrcs.add(resolvedSrc);
    init.noteAsyncActivity();
    pendingScriptLoads++;

    const type = (scriptEl?.type || scriptEl?.getAttribute?.('type') || '')
      .toString()
      .trim()
      .toLowerCase();
    const isModule = type === 'module';
    debugScript('[swoop] load <script>', resolvedSrc, isModule ? 'module' : 'classic');

    try {
      if (isModule) {
        await init.runModuleScript(resolvedSrc, parentUrlForResolve);
      } else {
        const code = await init.fetchText(resolvedSrc);
        init.runClassicScript(code, resolvedSrc);
      }

      // Fire load events/callbacks (webpack waits for these).
      try {
        if (typeof scriptEl?.onload === 'function')
          scriptEl.onload(new (init.globalObj.Event ?? Event)('load'));
      } catch {
        try {
          scriptEl.onload?.();
        } catch {}
      }
      try {
        scriptEl?.dispatchEvent?.(new (init.globalObj.Event ?? Event)('load'));
      } catch {}
    } catch (e) {
      try {
        init.onError?.(resolvedSrc, e);
      } catch {
        // ignore
      }
      try {
        if (typeof scriptEl?.onerror === 'function') scriptEl.onerror(e);
      } catch {
        try {
          scriptEl.onerror?.();
        } catch {}
      }
      try {
        scriptEl?.dispatchEvent?.(new (init.globalObj.Event ?? Event)('error'));
      } catch {}
    } finally {
      pendingScriptLoads--;
      init.noteAsyncActivity();
    }
  };

  const scheduleScriptLoad = (node: any, label: string) => {
    // Give page code a chance to set `src`, `type`, and event handlers after insertion.
    init.hostSetTimeout(() => {
      void loadScriptElement(node, `${init.pageUrlHref}#${label}`);
    }, 0);
  };

  const patchScriptInsertion = (container: any, label: string) => {
    if (!container) return;
    const origAppendChild = container.appendChild?.bind(container);
    const origInsertBefore = container.insertBefore?.bind(container);
    const origAppend = container.append?.bind(container);
    const origPrepend = container.prepend?.bind(container);
    if (typeof origAppendChild === 'function') {
      container.appendChild = (node: any) => {
        const ret = origAppendChild(node);
        if (isScriptEl(node)) scheduleScriptLoad(node, `${label}.appendChild`);
        return ret;
      };
    }
    if (typeof origInsertBefore === 'function') {
      container.insertBefore = (node: any, ref: any) => {
        const ret = origInsertBefore(node, ref);
        if (isScriptEl(node)) scheduleScriptLoad(node, `${label}.insertBefore`);
        return ret;
      };
    }
    if (typeof origAppend === 'function') {
      container.append = (...nodes: any[]) => {
        const ret = origAppend(...nodes);
        for (const n of nodes) if (isScriptEl(n)) scheduleScriptLoad(n, `${label}.append`);
        return ret;
      };
    }
    if (typeof origPrepend === 'function') {
      container.prepend = (...nodes: any[]) => {
        const ret = origPrepend(...nodes);
        for (const n of nodes) if (isScriptEl(n)) scheduleScriptLoad(n, `${label}.prepend`);
        return ret;
      };
    }
  };

  const install = () => {
    patchScriptInsertion(init.globalObj.document?.head, 'head');
    patchScriptInsertion(init.globalObj.document?.body, 'body');

    // If a script is inserted without `src` and `src` is set later, we still want to load it.
    // Hook setAttribute for script elements.
    try {
      const elProto = init.globalObj.Element?.prototype;
      const origSetAttr = elProto?.setAttribute;
      if (typeof origSetAttr === 'function') {
        elProto.setAttribute = function (name: string, value: string) {
          const ret = origSetAttr.call(this, name, value);
          try {
            if (
              this?.tagName?.toLowerCase?.() === 'script' &&
              typeof name === 'string' &&
              name.toLowerCase() === 'src'
            ) {
              scheduleScriptLoad(this, 'script.setAttribute(src)');
            }
          } catch {
            // ignore
          }
          return ret;
        };
      }
    } catch {
      // ignore
    }

    // Also patch document.createElement('script') to attempt hooking a `src` setter.
    try {
      const doc = init.globalObj.document;
      const origCreateElement = doc?.createElement?.bind(doc);
      if (typeof origCreateElement === 'function') {
        doc.createElement = (tagName: string, ...rest: any[]) => {
          const el = origCreateElement(tagName, ...rest);
          try {
            if (typeof tagName === 'string' && tagName.toLowerCase() === 'script') {
              const desc = Object.getOwnPropertyDescriptor(el, 'src');
              // If it's configurable, wrap it; otherwise setAttribute hook will still cover most cases.
              if (!desc || desc.configurable) {
                let _src = el.getAttribute?.('src') ?? '';
                Object.defineProperty(el, 'src', {
                  configurable: true,
                  enumerable: true,
                  get: () => _src,
                  set: (v: string) => {
                    _src = String(v);
                    try {
                      el.setAttribute?.('src', _src);
                    } catch {
                      // ignore
                    }
                    scheduleScriptLoad(el, 'script.src=');
                  },
                });
              }
            }
          } catch {
            // ignore
          }
          return el;
        };
      }
    } catch {
      // ignore
    }
  };

  return {
    getPendingScriptLoads: () => pendingScriptLoads,
    install,
  };
}
