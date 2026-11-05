import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
const LOCK_TESTS = [
  'tests/supabase-migration-history-integrity.test.mjs',
  'tests/brain-cro-production-migration-lock-20261029.test.mjs',
  'tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs',
  'tests/brain-production-supabase-790-provider-source-parity-20261102.test.mjs',
  'tests/brain-supabase-migration-lock-provider-20261029.test.mjs',
];

test('required PR check runs every migration-lock test before merge', () => {
  const start = workflow.indexOf('Enforce Supabase migration lock parity before merge');
  assert.ok(start > -1, 'Migration lock parity step must exist in required-test.yml');
  const step = workflow.slice(start, start + 1200);
  for (const file of LOCK_TESTS) assert.ok(step.includes(file), `PR gate must run ${file}`);
  assert.ok(!/if:\s*steps\.integration\.outputs\.full_shared_suite/.test(step.split('- name:')[0]), 'Gate must not be conditional on the full shared suite');
});

test('every lock test file named by the gate exists', async () => {
  for (const file of LOCK_TESTS) await readFile(new URL(`../${file}`, import.meta.url));
});

test('lock rows and executable migrations stay one-to-one', async () => {
  const lock = JSON.parse(await readFile(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
  const versions = lock.applied.map(item => item.version);
  assert.equal(new Set(versions).size, versions.length, 'Duplicate lock versions are forbidden');
});
