import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');

test('privileged Janitor has native GitHub Actions cache-mode none',()=>{
  for(const name of ['janitor','branch_reconciler']) {
    const block=source.split('  '+name+':\n')[1]?.split(/\n  [a-zA-Z_]+:\n/)[0];
    assert.ok(block,name+' job exists');
    assert.match(block,/^    cache-mode: none$/m);
  }
  assert.doesNotMatch(source,/uses:\s*actions\/cache(?:\/|@)/i);
  assert.doesNotMatch(source,/cache-mode:\s*(?:write|read|write-only)\b/);
  assert.doesNotMatch(source,/\n\s+cache:\s*(?:npm|pnpm|yarn|pip)\b/);
});
test('single-flight Janitor has unchanged scheduler, dry run and security evidence',()=>{
  assert.match(source,/cron: '17 \* \* \* \*'/);
  assert.match(source,/group: powerhouse-repository-janitor/);
  assert.match(source,/cancel-in-progress: false/);
  assert.match(source,/default: dry-run/);
  assert.match(source,/name: Observe bounded CI throughput on existing hourly Janitor/);
  assert.match(source,/node tools\/delivery\/ci-throughput-telemetry\.mjs/);
  assert.match(source,/powerhouse-ci-throughput\.json/);
  assert.match(source,/Reconcile provider-owned GitHub Actions zero-job ghosts/);
});
test('cache isolation covers both existing Janitor jobs without lowering permissions',()=>{
  for(const value of ['actions','contents','pull-requests','issues']){
    assert.match(source,new RegExp('^  '+value+': write$','m'));
  }
  assert.equal((source.match(/^  janitor:$/gm)||[]).length,1);
  assert.deepEqual([...source.split('\njobs:\n')[1].matchAll(/^  ([a-zA-Z_-]+):$/gm)].map(match=>match[1]),['janitor','branch_reconciler']);
});
