import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const learningPath='brain/learning/2026-10-08-source-universe-operational-truth-v1.json';
const learning=JSON.parse(readFileSync(learningPath,'utf8'));
const workflow=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');

test('Source Universe learning projection has executable historical, shadow and canary evidence',()=>{
  for(const mode of ['historical_replay','shadow','canary']){
    const paths=learning.evaluation?.[mode];
    assert.ok(Array.isArray(paths)&&paths.length>0,mode);
    for(const p of paths){
      assert.match(p,/^tests\/brain-[a-z0-9-]+\.test\.mjs$/);
      assert.ok(existsSync(p),'Missing learning regression: '+p);
    }
  }
  assert.equal(learning.production_claim,'NOT_PROVEN');
  assert.match(learning.compiler.failure_class,/SOURCE_UNIVERSE/);
});

test('terminal historical projection failure requires protected-main descendant proof, never an implicit green',()=>{
  assert.match(workflow,/SKILL_PROJECTION_HISTORICAL_FAILURE/);
  assert.match(workflow,/SKILL_PROJECTION_DESCENDANT_NOT_PROVEN/);
  assert.match(workflow,/git merge-base --is-ancestor "\$MERGE_SHA" "\$descendant_sha"/);
  assert.match(workflow,/git merge-base --is-ancestor "\$descendant_sha" "\$current_main"/);
  assert.match(workflow,/main_blob.*proven_blob/);
  assert.match(workflow,/\.conclusion=="success"/);
  assert.match(workflow,/record\.evaluation\?\.\[mode\]/);
  assert.match(workflow,/run_id=\$descendant_id/);
  assert.doesNotMatch(workflow,/SKILL_PROJECTION_HISTORICAL_FAILURE:[^\n]*exit 0/);
});
