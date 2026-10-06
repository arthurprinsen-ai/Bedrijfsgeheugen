import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(path,'utf8');

test('delivery hygiene proves PR state without fetching the complete repository history',()=>{
  const workflow=read('.github/workflows/powerhouse-delivery-hygiene.yml');
  assert.doesNotMatch(workflow,/fetch-depth:\s*0\b/);
  assert.match(workflow,/fetch-depth:\s*1\b/);
  assert.doesNotMatch(workflow,/git fetch origin main --no-tags/);
  assert.doesNotMatch(workflow,/merge-base','origin\/main/);
  assert.match(workflow,/git\/ref\/heads\/main/);
  assert.match(workflow,/compare\/\$\{currentMainSha\}\.\.\.\$\{headSha\}/);
  assert.match(workflow,/pulls\/\$\{prNumber\}\/files\?per_page=100/);
  assert.match(workflow,/\['pr','diff',String\(prNumber\).*'--patch'/s);
});

test('repository writer polling yields after the 30-second synchronous budget',()=>{
  const workflow=read('.github/workflows/repo-writer-operational-verification.yml');
  assert.match(workflow,/seq 1 6/);
  assert.doesNotMatch(workflow,/seq 1 72/);
  assert.match(workflow,/sleep 5/);
  assert.match(workflow,/WAITING_EXTERNAL:WRITER_PR_NOT_MATERIALIZED/);
  assert.match(workflow,/resume from this exact verify SHA/);
});


test('integration bundle compiler is shallow-safe and never requires a merge base',()=>{
  const source=read('tools/delivery/integration-bundle-compiler.mjs');
  assert.match(source,/\['diff', '--name-only', baseSha, headSha\]/);
  assert.doesNotMatch(source,/\$\{baseSha\}\.\.\.\$\{headSha\}/);
});


test('material writeback closure guard is shallow-safe and never requires a merge base',()=>{
  const source=read('scripts/brain/material-writeback-closure-guard.mjs');
  assert.match(source,/\['diff','--name-only',base,head\]/);
  assert.doesNotMatch(source,/base\+'\.\.\.'\+head/);
});
