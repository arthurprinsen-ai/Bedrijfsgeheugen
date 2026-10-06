import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read=p=>readFileSync(p,'utf8');

test('canonical Required keeps current Netlify semantics and bounded Git history',()=>{
  const required=read('.github/workflows/required-test.yml');
  const website=read('.github/workflows/lane-website.yml');
  assert.doesNotMatch(required,/fetch-depth:\s*0/);
  assert.doesNotMatch(website,/fetch-depth:\s*0/);
  assert.match(required,/TARGETED_BASE_FETCH/);
  assert.match(website,/TARGETED_BASE_FETCH/);
  assert.match(required,/netlifyGovernanceExact/);
  assert.match(required,/if: needs\.preflight\.outputs\.netlify_build_required == 'true'/);
  assert.doesNotMatch(required,/fullAssurance|full_assurance/);
});

test('heavy duplicate PR fanout is removed while post-merge and scheduled assurance remains',()=>{
  for(const path of [
    '.github/workflows/website-cross-browser-screenshot-assurance.yml',
    '.github/workflows/paginacontrole.yml',
    '.github/workflows/powerhouse-quality-intelligence.yml',
    '.github/workflows/powerhouse-skill-projection.yml',
    '.github/workflows/business-os-migration.yml'
  ]){
    const yaml=read(path);
    assert.doesNotMatch(yaml,/^\s{2}pull_request:/m,path);
  }
  assert.match(read('.github/workflows/business-os-migration.yml'),/^\s{2}push:/m);
});

test('Supabase applicability is owned by Required and config semantics remain fail closed',()=>{
  assert.equal(existsSync('.github/workflows/supabase-preview-applicability.yml'),false);
  const required=read('.github/workflows/required-test.yml');
  assert.match(required,/^  supabase_preview:/m);
  assert.match(required,/databaseRelevantSupabase/);
  assert.match(required,/supabaseConfigDatabaseRelevant/);
  assert.match(required,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
});

test('watchdog and janitor are bounded and lineage-safe',()=>{
  const watchdog=read('.github/scripts/required-gate-watchdog.mjs');
  const janitor=read('.github/scripts/pr-janitor.mjs');
  assert.match(watchdog,/MIN_AGE_MS=90_000/);
  assert.match(watchdog,/MAX_AGE_MS=2\*60\*60\*1000/);
  assert.match(watchdog,/pr_labels_json:JSON\.stringify/);
  assert.match(janitor,/obligationId\(predecessor\.body\)!==successorObligation/);
  assert.match(janitor,/PR_JANITOR_SKIP_CROSS_OBLIGATION/);
  assert.match(janitor,/30\*24\*60\*60\*1000/);
});
