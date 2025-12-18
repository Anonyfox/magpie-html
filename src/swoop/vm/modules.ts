import vm from 'node:vm';
import type { PluckInit } from '../../pluck/index.js';
import { pluck } from '../../pluck/index.js';

type PluckLike = typeof pluck;

export interface ModuleLoaderInit {
  context: vm.Context;
  remainingMs: () => number;
  pluckInit: PluckInit;
  pluckFn?: PluckLike;
}

export interface ModuleLoader {
  loadModule: (specifier: string, referencingUrl: string) => Promise<vm.Module>;
  linkerFor: (referencingUrl: string) => (specifier: string) => Promise<vm.Module>;
}

export function createModuleLoader(init: ModuleLoaderInit): ModuleLoader {
  const SourceTextModule = (vm as any).SourceTextModule as
    | (new (
        code: string,
        options: any,
      ) => vm.Module)
    | undefined;

  const moduleCache = new Map<string, vm.Module>();
  const pluckFn = init.pluckFn ?? pluck;

  const loadModule = async (specifier: string, referencingUrl: string): Promise<vm.Module> => {
    if (init.remainingMs() <= 0)
      throw new Error('swoop() time budget exhausted while loading modules');
    const resolved = new URL(specifier, referencingUrl).href;
    const cached = moduleCache.get(resolved);
    if (cached) return cached;

    if (!SourceTextModule) {
      throw new Error(
        'Module scripts require Node `--experimental-vm-modules` (vm.SourceTextModule is unavailable).',
      );
    }

    const modRes = await pluckFn(resolved, {
      ...init.pluckInit,
      timeout: Math.min(init.pluckInit.timeout ?? 30000, init.remainingMs()),
      strictContentType: false,
      throwOnHttpError: true,
    });
    const rawSource = await modRes.textUtf8();

    const mod = new SourceTextModule(rawSource, {
      context: init.context,
      identifier: resolved,
      initializeImportMeta: (meta: any) => {
        meta.url = resolved;
      },
      importModuleDynamically: async (spec: string) => {
        const child = await loadModule(spec, resolved);
        await child.link(linkerFor(resolved));
        await child.evaluate();
        return child;
      },
    });

    moduleCache.set(resolved, mod);
    return mod;
  };

  const linkerFor =
    (referencingUrl: string) =>
    async (specifier: string): Promise<vm.Module> => {
      return await loadModule(specifier, referencingUrl);
    };

  return { loadModule, linkerFor };
}
