import type { SwoopConsoleEntry } from './types.js';

export interface ConsoleCapture {
  entries: SwoopConsoleEntry[];
  record: (level: SwoopConsoleEntry['level'], args: unknown[]) => void;
}

export function createConsoleCapture(now: () => number = () => Date.now()): ConsoleCapture {
  const entries: SwoopConsoleEntry[] = [];

  const formatError = (err: Error) => {
    const parts: string[] = [];
    parts.push(`${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ''}`.trim());
    try {
      const props: Record<string, unknown> = {};
      for (const key of Object.getOwnPropertyNames(err)) {
        if (key === 'name' || key === 'message' || key === 'stack') continue;
        props[key] = (err as any)[key];
      }
      if (Object.keys(props).length > 0) {
        parts.push(`props: ${JSON.stringify(props)}`);
      }
    } catch {
      // ignore
    }
    return parts.join('\n');
  };

  const record: ConsoleCapture['record'] = (level, args) => {
    const msg = args
      .map((a) => {
        try {
          if (a instanceof Error) return formatError(a);
          if (typeof a === 'string') return a;
          return String(a);
        } catch {
          return '[unstringifiable]';
        }
      })
      .join(' ');

    const argStrings = args.map((a) => {
      try {
        if (a instanceof Error) return formatError(a);
        if (typeof a === 'string') return a;
        return String(a);
      } catch {
        return '[unstringifiable]';
      }
    });

    entries.push({ level, message: msg, args: argStrings, time: now() });
  };

  return { entries, record };
}
