import vm from 'node:vm';

/**
 * Synthesize a browser-ish document lifecycle after scripts executed.
 *
 * @remarks
 * Best-effort. No layout/paint; this is only to unblock CSR bundles that wait
 * for DOMContentLoaded/load and related lifecycle events.
 */
export function synthesizeLifecycle(context: vm.Context, timeoutMs: number = 50): void {
  vm.runInContext(
    `
      try {
        const EventCtor = (globalThis.Event || (globalThis.window && globalThis.window.Event));
        const dispatchDoc = (type) => { try { document.dispatchEvent(new EventCtor(type)); } catch {} };
        const dispatchWin = (type) => { try { window.dispatchEvent(new EventCtor(type)); } catch {} };

        if (typeof document.readyState !== "string") {
          try { document.readyState = "loading"; } catch {}
        }

        dispatchDoc("readystatechange");
        try { document.readyState = "interactive"; } catch {}
        dispatchDoc("readystatechange");
        dispatchDoc("DOMContentLoaded");
        try { document.readyState = "complete"; } catch {}
        dispatchDoc("readystatechange");

        try {
          if (typeof document.visibilityState !== "string") document.visibilityState = "visible";
          if (typeof document.hidden !== "boolean") document.hidden = false;
          if (typeof document.hasFocus !== "function") document.hasFocus = () => true;
        } catch {}
        dispatchDoc("visibilitychange");

        dispatchWin("pageshow");
        dispatchWin("load");

        try { window.dispatchEvent(new PopStateEvent("popstate", { state: (history && history.state) })); } catch {}
        try {
          const href = String((location && location.href) || "");
          window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: href, newURL: href }));
        } catch {}
      } catch {}
    `,
    context,
    { timeout: timeoutMs },
  );
}
