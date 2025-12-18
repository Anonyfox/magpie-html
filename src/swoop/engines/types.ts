import type { SwoopConsoleEntry, SwoopScriptError } from '../types.js';

export interface EngineRunResult {
  snapshot: string;
  consoleEntries: SwoopConsoleEntry[];
  engineErrors: SwoopScriptError[];
}
