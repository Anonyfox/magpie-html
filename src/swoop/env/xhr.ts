export interface InstallXhrInit {
  globalObj: any;
  resolveUrl: (u: string) => string;
  remainingMs: () => number;
  hostSetTimeout: (cb: () => void, ms: number) => any;
  hostClearTimeout: (handle: any) => void;
  fetch: typeof globalThis.fetch | undefined;
}

type Listener = (ev: any) => void;

/**
 * Minimal XMLHttpRequest shim over fetch (best-effort).
 *
 * @remarks
 * - Always async (sync XHR is emulated as async)
 * - Time-budgeted via `remainingMs()`
 */
export function installXMLHttpRequest(init: InstallXhrInit): void {
  const g = init.globalObj;
  if (g.XMLHttpRequest) return;

  class Xhr {
    // readyState constants
    static UNSENT = 0;
    static OPENED = 1;
    static HEADERS_RECEIVED = 2;
    static LOADING = 3;
    static DONE = 4;
    UNSENT = 0;
    OPENED = 1;
    HEADERS_RECEIVED = 2;
    LOADING = 3;
    DONE = 4;

    readyState = 0;
    status = 0;
    statusText = '';
    responseType: '' | 'text' | 'json' | 'arraybuffer' | 'blob' = '';
    response: any = null;
    responseText = '';
    timeout = 0;
    withCredentials = false;

    onreadystatechange: null | (() => void) = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    ontimeout: null | (() => void) = null;
    onabort: null | (() => void) = null;

    private _method = 'GET';
    private _url = '';
    private _headers = new Map<string, string>();
    private _respHeaders: Headers | null = null;
    private _listeners = new Map<string, Set<Listener>>();
    private _controller: AbortController | null = null;

    addEventListener(type: string, cb: Listener) {
      const t = String(type);
      const set = this._listeners.get(t) ?? new Set<Listener>();
      set.add(cb);
      this._listeners.set(t, set);
    }
    removeEventListener(type: string, cb: Listener) {
      const t = String(type);
      this._listeners.get(t)?.delete(cb);
    }
    private _dispatch(type: string) {
      const ev = { type, target: this, currentTarget: this };
      this._listeners.get(type)?.forEach((cb) => {
        try {
          cb(ev);
        } catch {
          // ignore
        }
      });
    }
    private _setReadyState(n: number) {
      this.readyState = n;
      try {
        this.onreadystatechange?.();
      } catch {
        // ignore
      }
      this._dispatch('readystatechange');
    }

    open(method: string, url: string, async: boolean = true) {
      this._method = String(method ?? 'GET').toUpperCase();
      this._url = String(url ?? '');
      void async; // sync XHR is not supported; treat as async.
      this._headers.clear();
      this._respHeaders = null;
      this._controller = null;
      this._setReadyState(1);
    }

    setRequestHeader(name: string, value: string) {
      this._headers.set(String(name), String(value));
    }

    getResponseHeader(name: string) {
      try {
        return this._respHeaders?.get(String(name)) ?? null;
      } catch {
        return null;
      }
    }

    getAllResponseHeaders() {
      try {
        if (!this._respHeaders) return '';
        let out = '';
        this._respHeaders.forEach((v, k) => {
          out += `${k}: ${v}\r\n`;
        });
        return out;
      } catch {
        return '';
      }
    }

    overrideMimeType(_mime: string) {}

    abort() {
      try {
        this._controller?.abort();
      } catch {
        // ignore
      }
      try {
        this.onabort?.();
      } catch {
        // ignore
      }
      this._dispatch('abort');
    }

    send(body?: any) {
      const doFetch = async () => {
        const url = init.resolveUrl(this._url);
        const controller = new AbortController();
        this._controller = controller;

        let timeoutHandle: any;
        const ms = Math.min(this.timeout || 0, init.remainingMs());
        if (ms > 0) {
          timeoutHandle = init.hostSetTimeout(() => controller.abort(), ms);
        }

        try {
          const headers: Record<string, string> = {};
          for (const [k, v] of this._headers.entries()) headers[k] = v;

          if (!init.fetch) throw new Error('swoop: host fetch is unavailable in this Node runtime');

          const resp = await init.fetch(url, {
            method: this._method,
            headers,
            body: body as any,
            signal: controller.signal,
            // credentials/withCredentials ignored (Node fetch differs); best-effort.
          } as any);

          this._respHeaders = resp.headers;
          this.status = resp.status;
          this.statusText = (resp as any).statusText ?? '';
          this._setReadyState(2);

          // load body
          this._setReadyState(3);
          if (this.responseType === 'arraybuffer') {
            this.response = await resp.arrayBuffer();
            this.responseText = '';
          } else if (this.responseType === 'blob') {
            this.response = (resp as any).blob
              ? await (resp as any).blob()
              : await resp.arrayBuffer();
            this.responseText = '';
          } else {
            const text = await resp.text();
            this.responseText = text;
            if (this.responseType === 'json') {
              try {
                this.response = JSON.parse(text);
              } catch {
                this.response = null;
              }
            } else {
              this.response = text;
            }
          }

          this._setReadyState(4);
          try {
            this.onload?.();
          } catch {
            // ignore
          }
          this._dispatch('load');
          this._dispatch('loadend');
        } catch {
          this._setReadyState(4);
          const aborted = this._controller?.signal?.aborted;
          if (aborted) {
            try {
              this.ontimeout?.();
            } catch {}
            this._dispatch('timeout');
          } else {
            try {
              this.onerror?.();
            } catch {}
            this._dispatch('error');
          }
          this._dispatch('loadend');
        } finally {
          if (timeoutHandle) init.hostClearTimeout(timeoutHandle);
        }
      };

      // Always async.
      void doFetch();
    }
  }

  g.XMLHttpRequest = Xhr;
}
