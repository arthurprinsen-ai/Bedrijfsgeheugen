import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url),'utf8');

test('repository janitor workflow has one canonical cleanup/readback tail',()=>{
  assert.equal((source.match(/name: Reconcile stale Actions and merged branch debris/g)||[]).length,1);
  assert.equal((source.match(/name: Read back applied cleanup/g)||[]).length,1);
  assert.equal((source.match(/name: Upload janitor evidence/g)||[]).length,1);
});

test('stale-run loop uses JSON rows rather than unsafe TSV for run identities',()=>{
  // The later, independent merged-branch sweep deliberately uses branch + SHA TSV.
  // Scope this assertion to stale ACTION RUN parsing; do not ban safe TSV everywhere.
  const start='for status in queued in_progress; do';
  const boundary='# Delete only unprotected non-main refs';
  assert.equal(source.split(start).length,2,'exactly one original stale-run loop');
  const tail=source.split(start)[1];
  assert.ok(tail.includes(boundary),'must locate independent branch-cleanup boundary');
  const staleRunLoop=tail.split(boundary)[0];
  assert.match(staleRunLoop,/\| @json/);
  assert.match(staleRunLoop,/while read -r run_json/);
  assert.doesNotMatch(staleRunLoop,/@tsv/, 'run ID, SHA, status and time must not pass through lossy TSV');
  assert.match(source,/sweep-candidates\.tsv/,'unrelated merger sweep retains original bounded inventory');
});

test('queue governor remains fail-safe',()=>{
  assert.match(source,/\[ "\$branch" != main \] \|\| continue/);
  assert.match(source,/\[ "\$run_status" = queued \]/);
  assert.match(source,/stale_after_seconds=21600/);
  assert.match(source,/reason=STALE_QUEUED_NO_OPEN_PR/);
});
