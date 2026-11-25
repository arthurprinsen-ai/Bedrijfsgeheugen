import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/powerhouse-daily-blog.yml',import.meta.url),'utf8');
const start=workflow.indexOf('name: Persist English cache before protected CI');
const end=workflow.indexOf('name: Self-heal required checks',start);
const phase=workflow.slice(start,end);

test('reviewed daily blog with an existing English patch receives missing translations on the same candidate',()=>{
  assert.ok(start>=0&&end>start);
  assert.ok(phase.includes('git checkout -B "$branch" "origin/$branch"'));
  assert.ok(phase.includes('CANONICAL_EXISTING_CANDIDATE_I18N_RECONCILE'));
  assert.ok(!phase.includes('CANONICAL_EXISTING_CANDIDATE_CACHE_PRESERVED'));
  assert.ok(phase.includes('STATIC_I18N_NETWORK=1 node tools/ci/netlify-build-entry.mjs'));
  assert.ok(phase.includes('--prepare-i18n-cache="powerhouse-blog-$DATE.json"'));
  assert.ok(phase.includes('STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1'));
  assert.ok(phase.includes('node tools/site-shell/build-localized-routes.mjs --validate-cache'));
  assert.ok(phase.includes('git add -- "$patch"'));
  assert.ok(phase.includes('git push origin "HEAD:$branch"'));
  assert.ok(!phase.includes('continue-on-error: true'));
});
