import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');

test('privileged Janitor has native GitHub Actions cache-mode none',()=>{
  assert.match(source,/^jobs:\n  janitor:\n(?:    #[^\n]*\n)*    cache-mode: none\n    runs-on: ubuntu-latest/m);
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
test('cache isolation does not lower canonical Janitor permissions or introduce new jobs',()=>{
  for(const value of ['actions','contents','pull-requests','issues']){
    assert.match(source,new RegExp('^  '+value+': write$','m'));
  }
  assert.equal((source.match(/^  janitor:$/gm)||[]).length,1);
  assert.equal((source.match(/^  [a-zA-Z_-]+:\n    (?:#|cache-mode|runs-on)/gm)||[]).length,1);
});
