export function installPermissiveShims(globalObj: any): void {
  const makeStorage = () => {
    const store = new Map<string, string>();
    return {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.has(String(key)) ? store.get(String(key))! : null;
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      removeItem(key: string) {
        store.delete(String(key));
      },
      setItem(key: string, value: string) {
        store.set(String(key), String(value));
      },
    };
  };

  globalObj.localStorage ??= makeStorage();
  globalObj.sessionStorage ??= makeStorage();

  // Do NOT downgrade shims here. `permissiveShims` is meant to *fill gaps*,
  // not replace richer implementations installed earlier.
  globalObj.scrollTo ??= () => {};

  try {
    if (
      globalObj.HTMLElement?.prototype &&
      !globalObj.HTMLElement.prototype.getBoundingClientRect
    ) {
      globalObj.HTMLElement.prototype.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        toJSON() {},
      });
    }
  } catch {
    // ignore
  }

  globalObj.process ??= { env: { NODE_ENV: 'production' } };
}
