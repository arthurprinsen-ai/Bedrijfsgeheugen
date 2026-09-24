import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const cases = [
  ['.github/workflows/canonical-brand-shell-test.yml', 'test'],
  ['.github/workflows/canonical-brand-shell-full-build.yml', 'build'],
  ['.github/workflows/live-preview-smoke.yml', 'smoke'],
  ['.github/workflows/prijzen-hero-seo-regression.yml', 'regression'],
];

test('expensive PR workflows are single-flight and bounded', async () => {
  for (const [path, job] of cases) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /concurrency:\n[\s\S]*?group:[^\n]*github\.event\.pull_request\.number[\s\S]*?cancel-in-progress:\s*true/);
    assert.match(source, new RegExp(`\\n  ${job}:\\n    timeout-minutes: \\d+`));
  }
});
