import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(path,'utf8');

test('Required has no workflow-level concurrency lock and stale heads yield before heavy work',()=>{
  const source=read('.github/workflows/required-test.yml');
  const header=source.slice(0,source.indexOf('\njobs:'));
  assert.doesNotMatch(header,/^concurrency:/m);
  assert.match(source,/REQUIRED_STALE_HEAD_YIELD/);
  assert.match(source,/REQUIRED_STALE_HEAD_YIELD_BEFORE_FULL_SUITE/);
  for(const lane of ['netlify','supabase','backend','portal','automation','website']){
    assert.match(source,new RegExp(`group: required-${lane}-`));
  }
});

test('PR janitor cancels only orphaned pull-request runs and keeps bounded fallback scanning',()=>{
  const [workflow,script]=[
    read('.github/workflows/pr-janitor.yml'),
    read('.github/scripts/pr-janitor.mjs')
  ];
  assert.match(workflow,/pull_request:\n    types: \[closed\]/);
  assert.match(workflow,/actions:\s*write/);
  assert.match(script,/openHeadShas/);
  assert.match(script,/openHeadRefs/);
  assert.match(script,/ACTION_ORPHAN_CUTOFF_MS=6\*60\*60\*1000/);
  assert.match(script,/ACTION_MAX_PAGES=5/);
  assert.match(script,/\['queued','pending','waiting','requested'\]/);
  assert.match(script,/\/actions\/runs\/\$\{run\.id\}\/cancel/);
  assert.match(script,/PR_JANITOR_CANCELLED_ORPHAN_RUN/);
  assert.match(script,/stillOwned/);
});
