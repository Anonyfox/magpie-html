import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { createModuleLoader } from './modules.js';

test('swoop/vm/modules: throws helpful error when SourceTextModule is unavailable', async () => {
  const context = vm.createContext({});
  const loader = createModuleLoader({
    context,
    remainingMs: () => 1000,
    pluckInit: {},
  });

  await assert.rejects(
    () => loader.loadModule('./x.js', 'https://example.com/'),
    /--experimental-vm-modules/,
  );
});
