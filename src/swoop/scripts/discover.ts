import { pluck } from '../../pluck/index.js';
import { parseHTML } from '../../utils/html-parser.js';
import type { SwoopInit, SwoopScriptError } from '../types.js';

export type DiscoveredScript =
  | { kind: 'inline'; code: string; isModule: boolean }
  | { kind: 'external'; url: string; code: string; isModule: boolean };

function isExecutableScriptType(type: string | null): boolean {
  if (!type) return true; // default JS
  const t = type.trim().toLowerCase();
  if (t === '') return true;
  if (t === 'text/javascript') return true;
  if (t === 'application/javascript') return true;
  if (t === 'application/ecmascript') return true;
  if (t === 'text/ecmascript') return true;
  return false;
}

function isModuleScript(type: string | null): boolean {
  return (type ?? '').trim().toLowerCase() === 'module';
}

type PluckLike = typeof pluck;

export async function discoverAndFetchScripts(
  html: string,
  finalUrl: string,
  init: Required<SwoopInit>,
  pluckFn: PluckLike = pluck,
): Promise<{ scripts: DiscoveredScript[]; errors: SwoopScriptError[] }> {
  const errors: SwoopScriptError[] = [];
  const scripts: DiscoveredScript[] = [];

  if (!init.executeScripts) return { scripts, errors };

  const doc = parseHTML(html, finalUrl);
  const baseHref = doc.querySelector('base[href]')?.getAttribute('href') ?? null;
  const baseUrl = baseHref ? new URL(baseHref, finalUrl).href : finalUrl;

  const scriptEls = Array.from(doc.querySelectorAll('script'));
  for (const el of scriptEls.slice(0, init.maxScripts)) {
    const type = el.getAttribute('type');
    const isModule = isModuleScript(type);
    if (!isModule && !isExecutableScriptType(type)) continue;

    const src = el.getAttribute('src');
    if (src) {
      const scriptUrl = new URL(src, baseUrl).href;
      try {
        const res = await pluckFn(scriptUrl, {
          ...init.pluck,
          strictContentType: false,
          throwOnHttpError: true,
        });
        const code = await res.textUtf8();
        scripts.push({ kind: 'external', url: scriptUrl, code, isModule });
      } catch (err) {
        const e = err as Error;
        errors.push({
          stage: 'script',
          scriptUrl,
          message: `Failed to fetch external script: ${e.message || String(e)}`,
          stack: e.stack,
        });
      }
      continue;
    }

    const code = el.textContent ?? '';
    if (code.trim().length === 0) continue;
    scripts.push({ kind: 'inline', code, isModule });
  }

  return { scripts, errors };
}
