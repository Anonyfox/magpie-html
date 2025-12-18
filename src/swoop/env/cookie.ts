export function installCookieJar(document: any): void {
  let cookieJar = '';
  try {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get() {
        return cookieJar;
      },
      set(value: string) {
        // Best-effort: append; do not implement full RFC.
        if (typeof value === 'string' && value.length > 0) {
          cookieJar = cookieJar ? `${cookieJar}; ${value}` : value;
        }
      },
    });
  } catch {
    // ignore
  }
}
