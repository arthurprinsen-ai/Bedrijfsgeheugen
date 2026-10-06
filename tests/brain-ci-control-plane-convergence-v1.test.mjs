import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read=p=>readFileSync(p,'utf8');

test('Required and website classifiers avoid full repository history fetches',()=>{
  const required=read('.github/workflows/required-test.yml');
  const website=read('.github/workflows/lane-website.yml');
  assert.doesNotMatch(required,/fetch-depth:\s*0/);
  assert.doesNotMatch(website,/fetch-depth:\s*0/);
  assert.match(required,/TARGETED_BASE_FETCH/);
  assert.match(website,/TARGETED_BASE_FETCH/);
});

test('heavy duplicate PR fanout is removed while scheduled assurance remains',()=>{
  for(const path of [
    '.github/workflows/website-cross-browser-screenshot-assurance.yml',
    '.github/workflows/paginacontrole.yml',
    '.github/workflows/powerhouse-quality-intelligence.yml',
    '.github/workflows/powerhouse-skill-projection.yml'
  ]){
    const yaml=read(path);
    assert.doesNotMatch(yaml,/^\s{2}pull_request:/m,path);
  }
});

test('Supabase preview applicability is owned by Required only',()=>{
  assert.equal(existsSync('.github/workflows/supabase-preview-applicability.yml'),false);
  const required=read('.github/workflows/required-test.yml');
  assert.match(required,/supabase_preview:/);
  assert.match(required,/Supabase Preview/);
});

test('watchdog and janitor remain bounded and deterministic',()=>{
  const watchdog=read('.github/scripts/required-gate-watchdog.mjs');
  const janitor=read('.github/scripts/pr-janitor.mjs');
  assert.match(watchdog,/MIN_AGE_MS=90_000/);
  assert.match(watchdog,/MAX_AGE_MS=2\*60\*60\*1000/);
  assert.match(janitor,/Supersedes:/);
  assert.match(janitor,/30\*24\*60\*60\*1000/);
});
