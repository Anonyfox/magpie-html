export interface BrowserShimsInit {
  globalObj: any;
  domWindow: any;
  document: any;
  documentBaseUriForDom: string;
}

export function installBrowserShims(init: BrowserShimsInit): void {
  const { globalObj, domWindow, documentBaseUriForDom } = init;
  const doc = init.document ?? (globalObj as any).document;

  // Ensure DOM APIs that rely on defaultView behave consistently.
  try {
    if (doc && (doc as any).defaultView == null) (doc as any).defaultView = globalObj;
  } catch {
    // ignore
  }
  // Some frameworks read document.baseURI for router/baseHref resolution.
  try {
    if (doc && (doc as any).baseURI == null) (doc as any).baseURI = documentBaseUriForDom;
  } catch {
    // ignore
  }

  // Prefer a minimally-faked navigator; avoid hard-coding vendor/UA brands.
  globalObj.navigator ??= {};
  globalObj.navigator.language ??= 'en';
  globalObj.navigator.languages ??= [globalObj.navigator.language];
  globalObj.navigator.onLine ??= true;

  // Basic viewport defaults (avoid baking in a specific browser fingerprint).
  globalObj.screen ??= {
    width: 1280,
    height: 720,
    availWidth: 1280,
    availHeight: 720,
    colorDepth: 24,
  };
  globalObj.devicePixelRatio ??= 1;
  globalObj.innerWidth ??= globalObj.screen.width ?? 1280;
  globalObj.innerHeight ??= globalObj.screen.height ?? 720;

  // Node (>=18+) usually has these web globals; expose them into the sandbox.
  globalObj.MessageChannel ??= (globalThis as any).MessageChannel;
  globalObj.MessagePort ??= (globalThis as any).MessagePort;
  globalObj.MessageEvent ??= (globalThis as any).MessageEvent;
  globalObj.BroadcastChannel ??= (globalThis as any).BroadcastChannel;

  // Minimal getComputedStyle: enough to keep frameworks from bailing.
  globalObj.getComputedStyle ??= (el: any) => {
    const style = el?.style ?? {};
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') return (name: string) => target?.[name] ?? '';
        return (target as any)[prop as any] ?? '';
      },
    });
  };

  // Navigation-related events.
  globalObj.PopStateEvent ??= class PopStateEvent extends (globalObj.Event ?? Event) {
    state: unknown;
    constructor(type: string, init?: any) {
      super(type, init);
      this.state = init?.state;
    }
  };
  globalObj.HashChangeEvent ??= class HashChangeEvent extends (globalObj.Event ?? Event) {
    oldURL: string;
    newURL: string;
    constructor(type: string, init?: any) {
      super(type, init);
      this.oldURL = init?.oldURL ?? '';
      this.newURL = init?.newURL ?? '';
    }
  };

  // Media queries are often used for breakpoint selection. Return a stable default.
  globalObj.matchMedia ??= (query: string) => {
    const listeners = new Set<any>();
    const mql: any = {
      matches: false,
      media: String(query ?? ''),
      onchange: null,
      addListener: (cb: any) => {
        if (typeof cb === 'function') listeners.add(cb);
      },
      removeListener: (cb: any) => {
        listeners.delete(cb);
      },
      addEventListener: (type: string, cb: any) => {
        if (String(type) === 'change' && typeof cb === 'function') listeners.add(cb);
      },
      removeEventListener: (type: string, cb: any) => {
        if (String(type) === 'change') listeners.delete(cb);
      },
      dispatchEvent: (evt: any) => {
        try {
          for (const cb of listeners) cb.call(mql, evt);
          if (typeof mql.onchange === 'function') mql.onchange.call(mql, evt);
        } catch {
          // ignore
        }
        return true;
      },
    };
    return mql;
  };

  // Observers are frequently used for lazy rendering; provide no-op implementations.
  globalObj.IntersectionObserver ??= class IntersectionObserver {
    observe(_el: any) {}
    unobserve(_el: any) {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  globalObj.ResizeObserver ??= class ResizeObserver {
    observe(_el: any) {}
    unobserve(_el: any) {}
    disconnect() {}
  };
  globalObj.MutationObserver ??= class MutationObserver {
    observe(_target: any, _options?: any) {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };

  globalObj.URL ??= URL;
  globalObj.URLSearchParams ??= URLSearchParams;
  globalObj.WebAssembly ??= WebAssembly;
  globalObj.TextEncoder ??= TextEncoder;
  globalObj.TextDecoder ??= TextDecoder;
  globalObj.Headers ??= globalThis.Headers;
  globalObj.Request ??= globalThis.Request;
  globalObj.Response ??= globalThis.Response;
  globalObj.crypto ??= globalThis.crypto;
  globalObj.performance ??= globalThis.performance;
  globalObj.structuredClone ??= globalThis.structuredClone;
  globalObj.Blob ??= globalThis.Blob;
  globalObj.FormData ??= globalThis.FormData;
  globalObj.File ??= (globalThis as any).File;
  globalObj.ReadableStream ??= (globalThis as any).ReadableStream;
  globalObj.atob ??= (data: string) => Buffer.from(data, 'base64').toString('binary');
  globalObj.btoa ??= (data: string) => Buffer.from(data, 'binary').toString('base64');

  // Big-ticket web platform APIs not yet implemented in `swoop`.
  globalObj.WebSocket ??= class WebSocket {
    constructor() {
      throw new Error('swoop: WebSocket is not implemented');
    }
  };
  globalObj.EventSource ??= class EventSource {
    constructor() {
      throw new Error('swoop: EventSource is not implemented');
    }
  };
  globalObj.Worker ??= class Worker {
    constructor() {
      throw new Error('swoop: Worker is not implemented');
    }
  };
  globalObj.SharedWorker ??= class SharedWorker {
    constructor() {
      throw new Error('swoop: SharedWorker is not implemented');
    }
  };
  globalObj.indexedDB ??= undefined;
  globalObj.caches ??= undefined;
  globalObj.Notification ??= undefined;

  // Common DOM globals frequently used as runtime tokens (and sometimes as DI tokens).
  globalObj.Document ??= domWindow.Document;
  globalObj.HTMLDocument ??= domWindow.HTMLDocument ?? init.document?.constructor;
  globalObj.Element ??= domWindow.Element;
  globalObj.HTMLElement ??= domWindow.HTMLElement;
  globalObj.Node ??= domWindow.Node;

  // TreeWalker / NodeIterator constants.
  globalObj.NodeFilter ??= domWindow.NodeFilter ?? {
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
    FILTER_SKIP: 3,
    SHOW_ALL: 0xffffffff,
    SHOW_ELEMENT: 0x1,
    SHOW_ATTRIBUTE: 0x2,
    SHOW_TEXT: 0x4,
    SHOW_CDATA_SECTION: 0x8,
    SHOW_ENTITY_REFERENCE: 0x10,
    SHOW_ENTITY: 0x20,
    SHOW_PROCESSING_INSTRUCTION: 0x40,
    SHOW_COMMENT: 0x80,
    SHOW_DOCUMENT: 0x100,
    SHOW_DOCUMENT_TYPE: 0x200,
    SHOW_DOCUMENT_FRAGMENT: 0x400,
    SHOW_NOTATION: 0x800,
  };
}
