import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync('.github/workflows/' + name,'utf8');

function eventBlock(source,event){
  const start=source.indexOf('  '+event+':');
  assert.ok(start>=0,event+' trigger missing');
  const tail=source.slice(start+2);
  const next=tail.search(/^  (?:pull_request|push|workflow_dispatch|schedule|workflow_call):/m);
  return next>=0 ? tail.slice(0,next) : tail.split('\njobs:')[0];
}

test('production deploy and readback skip closure-only main pushes', () => {
  for(const name of ['production-source-snapshot.yml','production-release-readback.yml']){
    const push=eventBlock(read(name),'push');
    assert.match(push,/paths-ignore:/);
    for(const path of ["docs/**",".agents/**","tests/**",".github/**","brain/learning/**"]){
      assert.ok(push.includes(path), name+' must ignore '+path+' when it is the only change');
    }
  }
});

test('website and SEO post-merge checks are domain scoped', () => {
  for(const name of ['canonical-brand-shell-live-readback.yml','seo-order-engine.yml']){
    assert.match(eventBlock(read(name),'push'),/paths:/,name+' main push must be path scoped');
  }
});

test('CodeQL main scans are code-scoped and stale scans single-flight by ref', () => {
  const source=read('powerhouse-codeql.yml');
  const push=eventBlock(source,'push');
  assert.match(push,/paths:/);
  assert.match(push,/\*\*\/\*\.mjs/);
  assert.match(source,/github\.event\.pull_request\.number \|\| github\.ref_name/);
  assert.doesNotMatch(source,/github\.event\.pull_request\.number \|\| github\.run_id/);
  assert.match(source,/cancel-in-progress:\s*true/);
});

test('Shared Agent Memory no longer duplicates every main push', () => {
  const push=eventBlock(read('shared-agent-memory-tests.yml'),'push');
  assert.match(push,/automation\/\*\*/);
  assert.doesNotMatch(push,/[-\s]main(?:\s|$)/);
});

test('SEO order stale same-ref runs are cancelled', () => {
  const source=read('seo-order-engine.yml');
  assert.match(source,/group:\s*seo-order-engine-/);
  assert.match(source,/cancel-in-progress:\s*true/);
});

test('Main Write Integrity deliberately observes every main write', () => {
  const push=eventBlock(read('main-write-integrity.yml'),'push');
  assert.match(push,/branches:\s*\[main\]/);
  assert.doesNotMatch(push,/paths(?:-ignore)?:/);
});
