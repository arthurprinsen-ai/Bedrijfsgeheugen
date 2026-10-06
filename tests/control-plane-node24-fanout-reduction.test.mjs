import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Node 24 specialist assurance is inside Required merge_group', () => {
  const required = readFileSync('.github/workflows/required-test.yml','utf8');
  assert.ok(required.includes('merge_specialist_node24:'));
  assert.ok(required.includes("node-version: '24'"));
  assert.ok(required.includes('node tools/site-shell/test-shell-components.mjs'));
  assert.ok(required.includes('tests/site-shell-compare-slider-physical-edges.test.mjs'));
  assert.ok(required.includes('node tools/content-growth/validate-policy.mjs'));
  assert.ok(required.includes('tests/content-growth-*.test.mjs'));
  assert.ok(required.includes('MERGE_SPECIALIST_NODE24'));
  assert.match(required, /needs: \[hygiene, preflight, merge_specialist, merge_specialist_node24, netlify_build_parity/);
  assert.ok(required.includes('[ "$EVENT_NAME" != merge_group ] || [ "$MERGE_SPECIALIST" = success ]'));
  assert.ok(required.includes('[ "$EVENT_NAME" != merge_group ] || [ "$MERGE_SPECIALIST_NODE24" = success ]'));
});

test('Node 24 specialist workflows no longer fan out on pull_request', () => {
  for (const path of [
    '.github/workflows/canonical-brand-shell-test.yml',
    '.github/workflows/content-growth-ci.yml',
  ]) {
    const source = readFileSync(path,'utf8');
    assert.doesNotMatch(source, /^\s{2}pull_request:/m, path);
  }
});
