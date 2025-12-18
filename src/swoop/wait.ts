export type WaitStrategy = 'timeout' | 'networkidle';

export interface WaitForSettleInit {
  strategy: WaitStrategy;
  deadlineMs: number;
  idleTimeMs: number;
  pollIntervalMs: number;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  getPendingFetches: () => number;
  getPendingScriptLoads: () => number;
  getLastAsyncActivityAt: () => number;
}

export async function waitForSettle(init: WaitForSettleInit): Promise<{ timedOut: boolean }> {
  if (init.strategy === 'timeout') {
    await init.sleep(Math.max(0, init.deadlineMs - init.now()));
    return { timedOut: init.now() >= init.deadlineMs };
  }

  while (init.now() < init.deadlineMs) {
    if (
      init.getPendingFetches() === 0 &&
      init.getPendingScriptLoads() === 0 &&
      init.now() - init.getLastAsyncActivityAt() >= init.idleTimeMs
    ) {
      return { timedOut: false };
    }
    await init.sleep(init.pollIntervalMs);
  }

  return { timedOut: true };
}
