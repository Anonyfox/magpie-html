export interface DebugProbesInit {
  globalObj: any;
  hostSetTimeout: (cb: () => void, ms: number) => any;
}

export function installDebugProbes(init: DebugProbesInit): void {
  const { globalObj, hostSetTimeout } = init;

  globalObj.__swoopStats = {
    startedAt: Date.now(),
    domOps: Object.create(null) as Record<string, number>,
    mutations: 0,
    lastDomActivityAt: 0,
    listeners: Object.create(null) as Record<string, number>,
    timers: {
      timeoutScheduled: 0,
      timeoutFired: 0,
      intervalScheduled: 0,
      intervalFired: 0,
      rafScheduled: 0,
      rafFired: 0,
    },
    nav: {
      pushState: 0,
      replaceState: 0,
      lastHref: null as string | null,
    },
    appRootSamples: [] as Array<{ t: number; len: number; opacity: string | null }>,
  };

  const bump = (name: string) => {
    const s = globalObj.__swoopStats;
    s.domOps[name] = (s.domOps[name] ?? 0) + 1;
    s.lastDomActivityAt = Date.now();
  };

  const bumpListener = (type: string) => {
    const s = globalObj.__swoopStats;
    s.listeners[type] = (s.listeners[type] ?? 0) + 1;
  };

  const wrapProto = (proto: any, fn: string) => {
    const orig = proto?.[fn];
    if (typeof orig !== 'function') return;
    proto[fn] = function (...args: any[]) {
      bump(fn);
      return orig.apply(this, args);
    };
  };

  // best-effort: cover the most common DOM mutation surfaces
  wrapProto(globalObj.Node?.prototype, 'appendChild');
  wrapProto(globalObj.Node?.prototype, 'insertBefore');
  wrapProto(globalObj.Node?.prototype, 'removeChild');
  wrapProto(globalObj.Element?.prototype, 'setAttribute');
  wrapProto(globalObj.Element?.prototype, 'removeAttribute');
  wrapProto(globalObj.Element?.prototype, 'append');
  wrapProto(globalObj.Element?.prototype, 'prepend');

  // Track event listener registrations (router, visibility, etc.)
  const wrapAddListener = (target: any, label: string) => {
    const orig = target?.addEventListener;
    if (typeof orig !== 'function') return;
    target.addEventListener = function (type: any, listener: any, options: any) {
      try {
        bumpListener(`${label}:${String(type)}`);
      } catch {
        // ignore
      }
      return orig.call(this, type, listener, options);
    };
  };
  wrapAddListener(globalObj, 'window');
  wrapAddListener(globalObj.document, 'document');

  const MO = globalObj.MutationObserver;
  if (typeof MO === 'function') {
    const mo = new MO(() => {
      globalObj.__swoopStats.mutations++;
      globalObj.__swoopStats.lastDomActivityAt = Date.now();
    });
    try {
      mo.observe(globalObj.document?.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
    } catch {
      // ignore
    }
  }

  // sample app-root size over time
  const sample = () => {
    try {
      const el = globalObj.document?.querySelector?.('app-root');
      const len = el?.innerHTML?.length ?? 0;
      const opacity = el?.getAttribute?.('style')?.includes('opacity')
        ? String(el.getAttribute('style'))
        : null;
      globalObj.__swoopStats.appRootSamples.push({ t: Date.now(), len, opacity });
    } catch {
      // ignore
    }
  };
  sample();
  hostSetTimeout(sample, 250);
  hostSetTimeout(sample, 1000);
  hostSetTimeout(sample, 2500);
  hostSetTimeout(sample, 4500);
}

export function emitDebugProbes(
  globalObj: any,
  recordDebug: (args: unknown[]) => void,
  now: () => number = () => Date.now(),
): void {
  const stats = globalObj.__swoopStats;
  if (!stats) return;

  const appRootHtml = (() => {
    try {
      const el = globalObj.document?.querySelector?.('app-root');
      const raw = el?.innerHTML ?? '';
      return String(raw).slice(0, 400);
    } catch {
      return null;
    }
  })();

  recordDebug([
    '[swoop probes]',
    JSON.stringify({
      mutations: stats.mutations ?? 0,
      lastDomActivityMsAgo:
        stats.lastDomActivityAt && typeof stats.lastDomActivityAt === 'number'
          ? now() - stats.lastDomActivityAt
          : null,
      topDomOps: Object.entries(stats.domOps ?? {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 15),
      topListeners: Object.entries(stats.listeners ?? {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 20),
      timers: stats.timers ?? null,
      lastAsyncActivityMsAgo:
        stats.lastAsyncActivityAt && typeof stats.lastAsyncActivityAt === 'number'
          ? now() - stats.lastAsyncActivityAt
          : null,
      nav: stats.nav ?? null,
      location: (() => {
        try {
          return {
            href: String(globalObj.location?.href ?? ''),
            pathname: String(globalObj.location?.pathname ?? ''),
            search: String(globalObj.location?.search ?? ''),
            hash: String(globalObj.location?.hash ?? ''),
            baseURI: String(globalObj.document?.baseURI ?? ''),
          };
        } catch {
          return null;
        }
      })(),
      appRootSamples: stats.appRootSamples ?? [],
      appRootHtmlHead: appRootHtml,
    }),
  ]);
}
