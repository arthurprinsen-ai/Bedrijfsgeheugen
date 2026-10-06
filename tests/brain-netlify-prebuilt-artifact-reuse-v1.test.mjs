import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('Netlify build has one canonical runner and immutable tree-keyed reuse',async()=>{
  const [required,snapshot,toml,runner,parallel,localizer,authority]=await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('.github/workflows/production-source-snapshot.yml'),
    read('netlify.toml'),
    read('tools/netlify-build/run-netlify-build.mjs'),
    read('tools/netlify-build/run-localized-routes-parallel.mjs'),
    read('tools/site-shell/build-localized-routes.mjs'),
    read('tools/delivery/netlify-deployment-applicability.mjs'),
  ]);
  assert.equal((toml.match(/command = "node tools\/ci\/run-netlify-build\.mjs"/g)||[]).length,2);
  assert.match(required,/Run canonical Netlify production build once[\s\S]*node tools\/ci\/run-netlify-build\.mjs/);
  assert.match(required,/netlify-prebuilt-tree-\$\{\{ steps\.prebuilt\.outputs\.tree_sha \}\}/);
  assert.match(required,/actions\/upload-artifact@v4/);
  assert.match(snapshot,/actions:\s*read/);
  assert.match(snapshot,/netlify-prebuilt-tree-\$\{tree_sha\}/);
  assert.match(snapshot,/PREBUILT_SOURCE_TREE_MISMATCH/);
  assert.match(snapshot,/PREBUILT_REUSED:/);
  assert.match(runner,/\.bg-prebuilt-artifact\.json/);
  assert.match(runner,/restamp-prebuilt-release\.mjs/);
  assert.match(runner,/run-localized-routes-parallel\.mjs/);
  assert.match(parallel,/STATIC_I18N_BUILD_SHARDS/);
  assert.match(localizer,/--shard-index=/);
  assert.match(localizer,/processingFiles/);
  assert.match(authority,/NETLIFY_BUILD_RUNTIME_EXACT/);
});

test('prebuilt reuse remains fail-closed and falls back to canonical source build',async()=>{
  const snapshot=await read('.github/workflows/production-source-snapshot.yml');
  assert.match(snapshot,/reused=false/);
  assert.match(snapshot,/Artifact tree mismatch; canonical source build will be used/);
  assert.match(snapshot,/if \[ "\$PREBUILT_REUSED" != "true" \]; then/);
  assert.match(snapshot,/@netlify\/mcp@latest/);
});
