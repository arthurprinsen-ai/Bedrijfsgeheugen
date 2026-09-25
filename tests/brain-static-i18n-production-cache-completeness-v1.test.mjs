import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('production static English cache is complete for every public route', () => {
  const run = spawnSync(process.execPath, ['tools/site-shell/build-localized-routes.mjs','--validate-cache'], {
    encoding:'utf8',
    env:{...process.env,STATIC_I18N_NETWORK:'0',STATIC_I18N_REQUIRE_CACHE:'1'},
    maxBuffer: 20 * 1024 * 1024
  });
  const output=(run.stdout||'')+(run.stderr||'');
  assert.equal(run.status,0,output);
  assert.match(output,/STATIC_I18N_CACHE_COMPLETE/);
});
