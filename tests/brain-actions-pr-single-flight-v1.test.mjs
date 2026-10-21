import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const cases = [
  ['.github/workflows/canonical-brand-shell-test.yml', 'brand-shell-contracts'],
  ['.github/workflows/canonical-brand-shell-full-build.yml', 'build'],
  ['.github/workflows/live-preview-smoke.yml', 'smoke'],
  ['.github/workflows/prijzen-hero-seo-regression.yml', 'regression'],
];

test('expensive diagnostic workflows are manual, single-flight and bounded', async () => {
  for (const [path, job] of cases) {
    const source = await readFile(path, 'utf8');
    assert.match(source, /^  workflow_dispatch:\s*$/m, `${path} requires explicit dispatch`);
    assert.doesNotMatch(source, /^  (?:pull_request|pull_request_target|push):\s*$/m,
      `${path} must not fan out on every PR or push`);
    assert.match(source, /^  group:[^\n]*github\.ref_name[^\n]*$/m,
      `${path} must coalesce manual executions for the same ref`);
    assert.match(source, /^  cancel-in-progress:\s*true\s*$/m,
      `${path} must cancel superseded runs`);
    assert.match(source, new RegExp(`^  ${job}:\\n    timeout-minutes: [1-9]\\d*$`, 'm'),
      `${path} must bound the ${job} job runtime`);
  }
});
