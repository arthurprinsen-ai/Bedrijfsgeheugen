import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('manual specialist workspaces keep the functional workspace identity used by production readback',()=>{
  const source=fs.readFileSync(new URL('../portal-v2/workspace-shell.js',import.meta.url),'utf8');
  assert.match(source,/contract\?\.legacyCapability&&\(!specialist\|\|context\.delegate===false\)/);
  assert.match(source,/shell\.dataset\.functionalWorkspace=contract\.id/);
});
