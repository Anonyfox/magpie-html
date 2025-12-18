import vm from 'node:vm';

export function defineWindowInContext(context: vm.Context, timeoutMs: number = 50): void {
  vm.runInContext(
    `
      globalThis.Window ??= function Window() {};
      try { globalThis.Window.prototype = Object.getPrototypeOf(globalThis); } catch {}
    `,
    context,
    { timeout: timeoutMs },
  );
}

export function ensureRealmFunctionIntrinsic(context: vm.Context, timeoutMs: number = 50): void {
  vm.runInContext(
    `
      try { globalThis.Function = (function(){}).constructor; } catch {}
    `,
    context,
    { timeout: timeoutMs },
  );
}

export function installRealmWrappers(context: vm.Context, timeoutMs: number = 50): void {
  vm.runInContext(
    `
      // timers
      if (typeof globalThis.__swoop_setTimeout === "function") {
        globalThis.setTimeout = (...args) => globalThis.__swoop_setTimeout(...args);
      }
      if (typeof globalThis.__swoop_clearTimeout === "function") {
        globalThis.clearTimeout = (...args) => globalThis.__swoop_clearTimeout(...args);
      }
      if (typeof globalThis.__swoop_setInterval === "function") {
        globalThis.setInterval = (...args) => globalThis.__swoop_setInterval(...args);
      }
      if (typeof globalThis.__swoop_clearInterval === "function") {
        globalThis.clearInterval = (...args) => globalThis.__swoop_clearInterval(...args);
      }
      if (typeof globalThis.__swoop_setImmediate === "function") {
        globalThis.setImmediate = (...args) => globalThis.__swoop_setImmediate(...args);
      }
      if (typeof globalThis.__swoop_clearImmediate === "function") {
        globalThis.clearImmediate = (...args) => globalThis.__swoop_clearImmediate(...args);
      }

      // microtasks / raf / idle
      if (typeof globalThis.__swoop_queueMicrotask === "function") {
        globalThis.queueMicrotask = (...args) => globalThis.__swoop_queueMicrotask(...args);
      }
      if (typeof globalThis.__swoop_requestAnimationFrame === "function") {
        globalThis.requestAnimationFrame = (...args) => globalThis.__swoop_requestAnimationFrame(...args);
      }
      if (typeof globalThis.__swoop_cancelAnimationFrame === "function") {
        globalThis.cancelAnimationFrame = (...args) => globalThis.__swoop_cancelAnimationFrame(...args);
      }
      if (typeof globalThis.__swoop_requestIdleCallback === "function") {
        globalThis.requestIdleCallback = (...args) => globalThis.__swoop_requestIdleCallback(...args);
      }
      if (typeof globalThis.__swoop_cancelIdleCallback === "function") {
        globalThis.cancelIdleCallback = (...args) => globalThis.__swoop_cancelIdleCallback(...args);
      }

      // fetch
      if (typeof globalThis.__swoop_fetch === "function") {
        globalThis.fetch = (...args) => globalThis.__swoop_fetch(...args);
      }
    `,
    context,
    { timeout: timeoutMs },
  );
}
