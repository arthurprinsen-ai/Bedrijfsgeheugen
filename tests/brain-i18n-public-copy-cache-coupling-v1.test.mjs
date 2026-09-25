import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

test('current public-copy cache patch is versioned and covers the AI ecosystem copy', async () => {
  const patch=JSON.parse(await readFile('config/bg-static-i18n-en.d/2026-09-25-current-main-public-copy.json','utf8'));
  assert.equal(Object.keys(patch).length,126);
  assert.equal(patch['AI-ecosysteem'],'AI ecosystem');
  assert.equal(patch['AI-ecosysteem voor het mkb | Data, systemen, processen en AI-agents | Bedrijfsgeheugen'],'AI ecosystem for SMEs | Data, systems, processes and AI agents | Bedrijfsgeheugen');
  const output=execFileSync(process.execPath,['tools/site-shell/build-localized-routes.mjs','--validate-cache'],{
    encoding:'utf8',
    env:{...process.env,STATIC_I18N_NETWORK:'0',STATIC_I18N_REQUIRE_CACHE:'1'}
  });
  assert.match(output,/STATIC_I18N_CACHE_COMPLETE/);
});
