export interface BaseResolve {
  baseForResolve: URL;
  baseTagHref: string | null;
  baseEl: any | null;
}

/**
 * Computes the base URL used for resolving relative resources.
 *
 * @remarks
 * Uses `<base href="...">` if present; otherwise falls back to the page URL.
 */
export function computeBaseForResolve(finalUrl: string, document: any): BaseResolve {
  const pageUrl = new URL(finalUrl);
  const baseEl = (document as any)?.querySelector?.('base') ?? null;
  const baseTagHref: string | null = baseEl?.getAttribute?.('href') ?? null;

  const baseForResolve = (() => {
    try {
      return baseTagHref ? new URL(String(baseTagHref), finalUrl) : pageUrl;
    } catch {
      return pageUrl;
    }
  })();

  return { baseForResolve, baseTagHref, baseEl };
}

/**
 * Enforces the browser invariant that `document.baseURI` is an absolute URL.
 */
export function patchDocumentBaseURI(document: any, baseForResolve: URL): void {
  try {
    Object.defineProperty(document as any, 'baseURI', {
      configurable: true,
      get: () => baseForResolve.href,
    });
  } catch {
    // ignore
  }
}

/**
 * Enforces the browser invariant that `<base>.href` is an absolute URL.
 */
export function patchBaseElementHref(baseEl: any | null, baseForResolve: URL): void {
  try {
    if (baseEl) {
      Object.defineProperty(baseEl, 'href', {
        configurable: true,
        get: () => baseForResolve.href,
        set: (_v: string) => {},
      });
    }
  } catch {
    // ignore
  }
}
