export interface FetchShimInit {
  globalObj: any;
  hostFetch: typeof fetch | undefined;
  baseForResolveHref: string;
  remainingMs: () => number;
  hostSetTimeout: (cb: () => void, ms: number) => any;
  hostClearTimeout: (h: any) => void;
  noteAsyncActivity: () => void;
  debugFetch: boolean;
  recordDebug: (args: unknown[]) => void;
  queueMicrotask: (cb: () => void) => void;
}

export interface FetchShim {
  getPendingFetches: () => number;
}

export function installFetchShim(init: FetchShimInit): FetchShim {
  let pendingFetches = 0;

  init.globalObj.__swoop_fetch =
    typeof init.hostFetch === 'function'
      ? (...args: Parameters<typeof fetch>) => {
          init.noteAsyncActivity();
          pendingFetches++;
          try {
            const input = args[0];
            const initReq = args[1];

            // Browser fetch resolves relative URLs against document/base URL.
            // Node fetch rejects them. Emulate browser resolution here.
            let resolvedInput: typeof input = input;
            if (typeof input === 'string') {
              resolvedInput = new URL(input, init.baseForResolveHref).href;
            } else if (input instanceof URL) {
              resolvedInput = input.href;
            } else if (typeof (input as Request).url === 'string') {
              try {
                resolvedInput = new URL((input as Request).url, init.baseForResolveHref).href;
              } catch {
                // keep as-is
              }
            }

            if (init.debugFetch) {
              init.recordDebug(['[fetch]', resolvedInput]);
            }

            const controller = new AbortController();
            const timeoutHandle = init.hostSetTimeout(() => controller.abort(), init.remainingMs());
            const mergedInit = { ...(initReq as any), signal: controller.signal };

            const p = init.hostFetch!(resolvedInput as any, mergedInit as any).finally(() => {
              init.hostClearTimeout(timeoutHandle);
            });

            return p.finally(() => {
              try {
                init.queueMicrotask(() => {
                  pendingFetches--;
                  init.noteAsyncActivity();
                });
              } catch {
                pendingFetches--;
                init.noteAsyncActivity();
              }
            });
          } catch (err) {
            pendingFetches--;
            init.noteAsyncActivity();
            throw err;
          }
        }
      : undefined;

  return {
    getPendingFetches: () => pendingFetches,
  };
}
