export interface CreateNavigationInit {
  pageUrl: URL;
  onNavigate?: (href: string) => void;
  onPopState?: (state: unknown) => void;
}

export interface NavigationShims {
  location: any;
  history: any;
}

export function createNavigationShims(init: CreateNavigationInit): NavigationShims {
  const { pageUrl } = init;

  const resolveAndSetHref = (href: string) => {
    try {
      const next = new URL(href, pageUrl.href);
      pageUrl.href = next.href;
      init.onNavigate?.(pageUrl.href);
    } catch {
      // ignore
    }
  };

  const location: any = {};
  try {
    Object.defineProperties(location, {
      href: { get: () => pageUrl.href, set: (v: string) => resolveAndSetHref(String(v)) },
      origin: { get: () => pageUrl.origin },
      protocol: {
        get: () => pageUrl.protocol,
        set: (v: string) => {
          pageUrl.protocol = String(v);
        },
      },
      host: {
        get: () => pageUrl.host,
        set: (v: string) => {
          pageUrl.host = String(v);
        },
      },
      hostname: {
        get: () => pageUrl.hostname,
        set: (v: string) => {
          pageUrl.hostname = String(v);
        },
      },
      port: {
        get: () => pageUrl.port,
        set: (v: string) => {
          pageUrl.port = String(v);
        },
      },
      pathname: { get: () => pageUrl.pathname, set: (v: string) => resolveAndSetHref(String(v)) },
      search: {
        get: () => pageUrl.search,
        set: (v: string) => {
          pageUrl.search = String(v);
        },
      },
      hash: {
        get: () => pageUrl.hash,
        set: (v: string) => {
          pageUrl.hash = String(v);
        },
      },
    });
  } catch {
    // ignore
  }
  location.toString = () => pageUrl.href;
  location.assign = (href: string) => resolveAndSetHref(href);
  location.replace = (href: string) => resolveAndSetHref(href);
  location.reload = () => {};

  let historyState: unknown = null;
  const history: any = {
    get state() {
      return historyState;
    },
    pushState: (state: unknown, _title: string, url?: string | URL | null) => {
      historyState = state;
      if (url != null) resolveAndSetHref(String(url));
      try {
        init.onPopState?.(state);
      } catch {
        // ignore
      }
    },
    replaceState: (state: unknown, _title: string, url?: string | URL | null) => {
      historyState = state;
      if (url != null) resolveAndSetHref(String(url));
    },
    back: () => {},
    forward: () => {},
    go: (_delta?: number) => {},
  };

  return { location, history };
}
