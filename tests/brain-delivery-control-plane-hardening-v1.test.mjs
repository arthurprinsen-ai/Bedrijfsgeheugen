import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path,'utf8');

test('critical PR gates never fetch the complete repository history', () => {
  for (const path of [
    '.github/workflows/powerhouse-delivery-hygiene.yml',
    '.github/workflows/required-test.yml',
    '.github/workflows/powerhouse-skill-projection.yml',
  ]) {
    const source=read(path);
    assert.doesNotMatch(source,/fetch-depth:\s*0\b/, path+' must not full-fetch history');
    assert.match(source,/fetch-depth:\s*1\b/, path+' must use shallow checkout');
  }
});

test('delivery hygiene derives exact PR scope from GitHub instead of all remote refs', () => {
  const source=read('.github/workflows/powerhouse-delivery-hygiene.yml');
  assert.doesNotMatch(source,/git fetch origin main --no-tags/);
  assert.doesNotMatch(source,/merge-base','origin\/main/);
  assert.match(source,/git\/ref\/heads\/main/);
  assert.match(source,/pulls\/\$\{prNumber\}\/files\?per_page=100/);
  assert.match(source,/gh',\['pr','diff',String\(prNumber\).*'--patch'/s);
});

test('Required fetches only its exact comparison base and uses tree diff', () => {
  const source=read('.github/workflows/required-test.yml');
  assert.match(source,/git',\['fetch','--no-tags','--depth=1','origin',comparisonBaseSha\]/);
  assert.match(source,/git',\['diff','--name-only',comparisonBaseSha,context\.changeHeadSha\]/);
  assert.doesNotMatch(source,/comparisonBaseSha\}\.\.\.\$\{context\.changeHeadSha/);
});

test('skill projection fetches only the exact learning base commit', () => {
  const source=read('.github/workflows/powerhouse-skill-projection.yml');
  assert.match(source,/Fetch exact learning base only/);
  assert.match(source,/git fetch --no-tags --depth=1 origin "\$POWERHOUSE_BASE_SHA"/);
});

test('writer materialization polling is bounded to the synchronous 30-second budget', () => {
  const source=read('.github/workflows/repo-writer-operational-verification.yml');
  assert.match(source,/seq 1 6/);
  assert.doesNotMatch(source,/seq 1 72/);
  assert.match(source,/WAITING_EXTERNAL:WRITER_PR_NOT_MATERIALIZED/);
  assert.match(source,/sleep 5/);
});

test('delivery supervisor recovers only missing exact-head Required runs', () => {
  const source=read('.github/workflows/powerhouse-delivery-supervisor.yml');
  assert.match(source,/required-test\.yml\/runs/);
  assert.match(source,/select\(\.head_sha == \$sha\)/);
  assert.match(source,/exact_count/);
  assert.match(source,/ZERO_RUN_RECOVERY/);
  assert.match(source,/gh workflow run required-test\.yml/);
  assert.match(source,/dispatch_budget=5/);
});

test('PR janitor is explicit-state and same-obligation supersession only', () => {
  const source=read('.github/workflows/powerhouse-delivery-supervisor.yml');
  assert.match(source,/RETIRED/);
  assert.match(source,/Terminal-State:.*SUPERSEDED/);
  assert.match(source,/Obligation-ID/);
  assert.match(source,/Supersedes/);
  assert.match(source,/predecessor_obligation.*obligation/s);
  assert.doesNotMatch(source,/gh pr close[^\n]*(older|age|days)/i);
  assert.match(source,/close_budget=20/);
});
