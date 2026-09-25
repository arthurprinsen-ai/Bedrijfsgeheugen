import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const scoped = [
  '.github/workflows/powerhouse-assurance.yml',
  '.github/workflows/engineering-supply-chain-trust.yml',
  '.github/workflows/seo-growth-intelligence.yml',
  '.github/workflows/engineering-intelligence-trust.yml',
  '.github/workflows/content-growth-ci.yml',
  '.github/workflows/powerhouse-quality-intelligence.yml',
];

test('specialist main workflows are path scoped', async () => {
  for (const path of scoped) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /push:\s*\n[\s\S]*?branches:[\s\S]*?\bmain\b[\s\S]*?\n\s+paths:/, path);
  }
});

test('supersedable workflow concurrency does not use run_id', async () => {
  for (const path of [
    '.github/workflows/engineering-supply-chain-trust.yml',
    '.github/workflows/shared-agent-memory-tests.yml',
    '.github/workflows/brain-foundation-verify.yml',
  ]) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /concurrency:[\s\S]*?cancel-in-progress:\s*true/, path);
    assert.doesNotMatch(source, /group:[^\n]*github\.run_id/, path);
  }
});
