import type { PluckInit } from '../pluck/index.js';

/**
 * How `swoop()` decides when a client-rendered page is "done enough" to snapshot.
 *
 * @remarks
 * This is DOM-only rendering (no layout/paint). "Done" is best-effort.
 */
export type SwoopWaitStrategy = 'timeout' | 'networkidle';

export type SwoopEngine = 'vm';

export interface SwoopInit {
  /**
   * Execution engine used for running third-party scripts.
   *
   * @remarks
   * - `vm` (default): practical, supports `fetch` by reusing host globals
   *
   * @defaultValue 'vm'
   */
  engine?: SwoopEngine;

  /**
   * Pluck options used for the initial HTML request and external script fetching.
   */
  pluck?: PluckInit;

  /**
   * Execute inline and external scripts found in the HTML.
   *
   * @defaultValue true
   */
  executeScripts?: boolean;

  /**
   * Maximum time to wait for the page to "settle" before taking a snapshot.
   *
   * @defaultValue 3000
   */
  timeout?: number;

  /**
   * Which waiting strategy to use.
   *
   * - `timeout`: sleep for `timeout` and snapshot
   * - `networkidle`: wait until no tracked fetches are pending for `idleTime`
   *
   * @defaultValue 'networkidle'
   */
  waitStrategy?: SwoopWaitStrategy;

  /**
   * Required quiet period (ms) for `networkidle`.
   *
   * @defaultValue 250
   */
  idleTime?: number;

  /**
   * Poll interval (ms) for `networkidle`.
   *
   * @defaultValue 25
   */
  pollInterval?: number;

  /**
   * How many scripts to load/execute at most.
   *
   * @defaultValue 64
   */
  maxScripts?: number;

  /**
   * If true, forward console output from the isolated realm to the host console.
   *
   * @defaultValue false
   */
  forwardConsole?: boolean;

  /**
   * If true, installs permissive Proxy-based stubs for common missing browser APIs.
   *
   * @remarks
   * This may hide some failures (by turning hard crashes into no-ops), but improves
   * compatibility for a best-effort snapshotter.
   *
   * @defaultValue true
   */
  permissiveShims?: boolean;

  /**
   * Record all sandbox `fetch()` calls into the captured console output.
   *
   * @defaultValue false
   */
  debugFetch?: boolean;

  /**
   * Enable additional sandbox probes to help iterative shim development.
   *
   * @remarks
   * Collects lightweight runtime stats (DOM ops/mutations, app-root growth, etc.)
   * and emits them via captured console.
   *
   * @defaultValue false
   */
  debugProbes?: boolean;
}

export interface SwoopConsoleEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'log';
  message: string;
  args?: string[];
  time: number;
}

export interface SwoopScriptError {
  stage: 'bootstrap' | 'script' | 'wait';
  scriptUrl?: string;
  message: string;
  stack?: string;
}

export interface SwoopResult {
  /**
   * Final URL after redirects.
   */
  url: string;

  /**
   * Snapshot HTML (best-effort).
   */
  html: string;

  /**
   * Console output captured from the isolated execution environment.
   */
  console: SwoopConsoleEntry[];

  /**
   * Script/bootstrap errors captured during execution.
   */
  errors: SwoopScriptError[];

  /**
   * Timing metadata (ms).
   */
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}
