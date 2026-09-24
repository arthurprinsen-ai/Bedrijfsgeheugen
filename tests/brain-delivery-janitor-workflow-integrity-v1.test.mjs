import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url),'utf8');

test('repository janitor workflow has one canonical cleanup/readback tail',()=>{
  assert.equal((source.match(/name: Reconcile stale Actions and merged branch debris/g)||[]).length,1);
  assert.equal((source.match(/name: Read back applied cleanup/g)||[]).length,1);
  assert.equal((source.match(/name: Upload janitor evidence/g)||[]).length,1);
});

test('stale-run loop uses JSON rows instead of tab-delimited shell parsing',()=>{
  assert.match(source,/\| @json/);
  assert.match(source,/while read -r run_json/);
  assert.doesNotMatch(source,/@tsv/);
  assert.doesNotMatch(source,/while IFS=/);
});

test('queue governor remains fail-safe',()=>{
  assert.match(source,/\[ "\$branch" != main \] \|\| continue/);
  assert.match(source,/\[ "\$run_status" = queued \]/);
  assert.match(source,/stale_after_seconds=21600/);
  assert.match(source,/reason=STALE_QUEUED_NO_OPEN_PR/);
});
