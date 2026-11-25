import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('third specialist batch no longer fans out directly on pull_request', () => {
  for (const path of [
    '.github/workflows/powerhouse-public-rls-regression-guard.yml',
    '.github/workflows/linkedin-revenue-cockpit-tests.yml',
  ]) {
    const source = readFileSync(path, 'utf8');
    assert.doesNotMatch(source, /^\s{2}pull_request:/m, path);
  }
});

test('Required merge_group preserves third-batch assurance', () => {
  const required = readFileSync('.github/workflows/required-test.yml', 'utf8');
  for (const path of [
    'tests/supabase-public-rls-regression-guard.test.mjs',
    'tests/linkedin-revenue-cockpit.test.mjs',
    'tests/linkedin-revenue-runtime.test.mjs',
    'tests/linkedin-revenue-engagement-cockpit.test.mjs',
  ]) assert.ok(required.includes(path), path);
});
