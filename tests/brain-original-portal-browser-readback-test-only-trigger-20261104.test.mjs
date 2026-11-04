import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflow=await readFile(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');

test('original production browser reruns when its own contract or original integration spec changes',()=>{
 assert.match(workflow,/name: Portal V2 Production DOM Readback/);
 assert.match(workflow,/      - 'portal-v2\/\*\*'/);
 assert.match(workflow,/      - 'tests\/integration\/portal-v2-production-\*\.spec\.js'/);
 assert.match(workflow,/      - '\.github\/workflows\/portal-v2-production-dom-readback\.yml'/);
 assert.match(workflow,/run: npx playwright test tests\/integration\/portal-v2-production-\*\.spec\.js --workers=1/);
 assert.match(workflow,/node tools\/ci\/portal-canonical-browser-release-fence\.mjs --verify/);
});

test('CI-only source replay must derive published SHA from independent Netlify manifest, not arbitrary input',()=>{
 assert.match(workflow,/Pin already-published Netlify SHA only for exact evidence-only push/);
 assert.match(workflow,/\$\{PORTAL_ALIAS_URL\}\/release\.json/);
 assert.match(workflow,/git merge-base --is-ancestor "\$published_sha" "\$GITHUB_SHA"/);
 assert.match(workflow,/RUNTIME_DRIFT_NOT_ELIGIBLE_FOR_PUBLISHED_SHA/);
 assert.match(workflow,/PORTAL_PUBLISHED_CI_ONLY_VERIFIED=true/);
 assert.match(workflow,/\$\{PORTAL_PUBLISHED_CI_ONLY_VERIFIED:-false\}/);
 assert.match(workflow,/PORTAL_EXPECTED_SHA=\$published_sha/);
 assert.match(workflow,/Exact immutable deploy ready/);
 assert.match(workflow,/PORTAL_CANONICAL_BROWSER_RELEASE_PINN/);
});

test('no source runtime can be reclassified as evidence-only and both original fail-closed scope gates agree',()=>{
 const matches=[...workflow.matchAll(/case "\$file" in\n\s+([^\n]+)\n\s+\*\)/g)];
 assert.equal(matches.length,2,'source pin and final protected verify must enforce the same exact paths');
 assert.equal(matches[0][1].trim(),matches[1][1].trim(),'scope checks cannot drift');
 const list=matches[0][1];
 for(const expected of ['AGENTS.md','.agents/skills/*','.github/workflows/*','tests/*','docs/*','brain/learning/*','tools/ci/*','supabase/migration-history.lock.json']){
  assert.ok(list.includes(expected),'documented CI-only path: '+expected);
 }
 for(const runtime of ['portal-v2/app.js','portal-v2/modules/overview.js','netlify/functions/checkout.js']){
  assert.ok(!list.includes(runtime),'runtime source must not be on CI-only list: '+runtime);
 }
 assert.match(workflow,/echo "::error::Runtime source changed after selected production SHA:/);
 assert.match(workflow,/git diff --name-only "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(workflow,/PORTAL_READBACK_URL=\$\{immutable\}/);
});
