import { setTimeout as nodeSetTimeout } from 'node:timers';

import type { SwoopInit } from './types.js';

export function isNodeRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    typeof process.versions.node === 'string'
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => nodeSetTimeout(resolve, ms));
}

export function normalizeInit(init?: SwoopInit): Required<SwoopInit> {
  return {
    engine: init?.engine ?? 'vm',
    pluck: init?.pluck ?? {},
    executeScripts: init?.executeScripts ?? true,
    timeout: init?.timeout ?? 3000,
    waitStrategy: init?.waitStrategy ?? 'networkidle',
    idleTime: init?.idleTime ?? 250,
    pollInterval: init?.pollInterval ?? 25,
    maxScripts: init?.maxScripts ?? 64,
    forwardConsole: init?.forwardConsole ?? false,
    permissiveShims: init?.permissiveShims ?? true,
    debugFetch: init?.debugFetch ?? false,
    debugProbes: init?.debugProbes ?? false,
  };
}
