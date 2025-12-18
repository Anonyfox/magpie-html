import {
  clearImmediate as nodeClearImmediate,
  clearInterval as nodeClearInterval,
  clearTimeout as nodeClearTimeout,
  setImmediate as nodeSetImmediate,
  setInterval as nodeSetInterval,
  setTimeout as nodeSetTimeout,
} from 'node:timers';

export interface AsyncEnvInit {
  globalObj: any;
  debugProbes: boolean;
}

export interface AsyncEnv {
  hostSetTimeout: typeof nodeSetTimeout;
  hostClearTimeout: typeof nodeClearTimeout;
  hostSetInterval: typeof nodeSetInterval;
  hostClearInterval: typeof nodeClearInterval;
  hostSetImmediate: typeof nodeSetImmediate;
  hostClearImmediate: typeof nodeClearImmediate;
  noteAsyncActivity: () => void;
  getLastAsyncActivityAt: () => number;
  cleanup: () => void;
}

export function installAsyncEnv(init: AsyncEnvInit): AsyncEnv {
  const { globalObj } = init;

  const hostSetTimeout = nodeSetTimeout;
  const hostClearTimeout = nodeClearTimeout;
  const hostSetInterval = nodeSetInterval;
  const hostClearInterval = nodeClearInterval;
  const hostSetImmediate = nodeSetImmediate;
  const hostClearImmediate = nodeClearImmediate;

  const activeTimeouts = new Set<ReturnType<typeof nodeSetTimeout>>();
  const activeIntervals = new Set<ReturnType<typeof nodeSetInterval>>();
  const activeImmediates = new Set<ReturnType<typeof nodeSetImmediate>>();

  let lastAsyncActivityAt = Date.now();
  const noteAsyncActivity = () => {
    lastAsyncActivityAt = Date.now();
    if (init.debugProbes) {
      try {
        globalObj.__swoopStats.lastAsyncActivityAt = lastAsyncActivityAt;
      } catch {
        // ignore
      }
    }
  };

  globalObj.__swoop_requestIdleCallback = (cb: any, _opts?: any) => {
    return hostSetTimeout(() => {
      try {
        noteAsyncActivity();
        cb({
          didTimeout: false,
          timeRemaining: () => 0,
        });
      } catch {
        // ignore
      }
    }, 0) as any;
  };
  globalObj.__swoop_cancelIdleCallback = (handle: any) => hostClearTimeout(handle);

  globalObj.__swoop_setTimeout = (...args: Parameters<typeof setTimeout>) => {
    const handle = hostSetTimeout(() => {
      activeTimeouts.delete(handle);
      noteAsyncActivity();
      if (init.debugProbes) {
        try {
          globalObj.__swoopStats.timers.timeoutFired++;
        } catch {}
      }
      (args[0] as any)?.call?.(globalObj);
    }, args[1] as number);
    activeTimeouts.add(handle);
    if (init.debugProbes) {
      try {
        globalObj.__swoopStats.timers.timeoutScheduled++;
      } catch {}
    }
    return handle;
  };
  globalObj.__swoop_clearTimeout = (handle: ReturnType<typeof setTimeout>) => {
    activeTimeouts.delete(handle as any);
    hostClearTimeout(handle as any);
  };

  globalObj.__swoop_setInterval = (...args: Parameters<typeof setInterval>) => {
    const handle = hostSetInterval(() => {
      noteAsyncActivity();
      if (init.debugProbes) {
        try {
          globalObj.__swoopStats.timers.intervalFired++;
        } catch {}
      }
      (args[0] as any)?.call?.(globalObj);
    }, args[1] as number);
    activeIntervals.add(handle);
    if (init.debugProbes) {
      try {
        globalObj.__swoopStats.timers.intervalScheduled++;
      } catch {}
    }
    return handle;
  };
  globalObj.__swoop_clearInterval = (handle: ReturnType<typeof setInterval>) => {
    activeIntervals.delete(handle as any);
    hostClearInterval(handle as any);
  };

  globalObj.__swoop_queueMicrotask = (cb: () => void) => {
    try {
      process.nextTick(() => {
        noteAsyncActivity();
        cb.call(globalObj);
      });
    } catch {
      hostSetTimeout(() => {
        noteAsyncActivity();
        cb.call(globalObj);
      }, 0);
    }
  };

  globalObj.__swoop_setImmediate = (cb: (...a: any[]) => void, ...args: any[]) => {
    const handle = hostSetImmediate(() => {
      activeImmediates.delete(handle);
      try {
        noteAsyncActivity();
        cb.call(globalObj, ...args);
      } catch {
        // ignore
      }
    });
    activeImmediates.add(handle);
    return handle;
  };
  globalObj.__swoop_clearImmediate = (handle: ReturnType<typeof nodeSetImmediate>) => {
    activeImmediates.delete(handle);
    hostClearImmediate(handle);
  };

  globalObj.__swoop_requestAnimationFrame = (cb: FrameRequestCallback) => {
    if (init.debugProbes) {
      try {
        globalObj.__swoopStats.timers.rafScheduled++;
      } catch {}
    }
    const id = hostSetTimeout(() => {
      if (init.debugProbes) {
        try {
          globalObj.__swoopStats.timers.rafFired++;
        } catch {}
      }
      noteAsyncActivity();
      cb.call(globalObj, Date.now());
    }, 16) as any;
    return id;
  };
  globalObj.__swoop_cancelAnimationFrame = (id: number) => hostClearTimeout(id as any);

  const cleanup = () => {
    for (const h of activeTimeouts) hostClearTimeout(h);
    for (const h of activeIntervals) hostClearInterval(h as any);
    for (const h of activeImmediates) hostClearImmediate(h);
  };

  return {
    hostSetTimeout,
    hostClearTimeout,
    hostSetInterval,
    hostClearInterval,
    hostSetImmediate,
    hostClearImmediate,
    noteAsyncActivity,
    getLastAsyncActivityAt: () => lastAsyncActivityAt,
    cleanup,
  };
}
