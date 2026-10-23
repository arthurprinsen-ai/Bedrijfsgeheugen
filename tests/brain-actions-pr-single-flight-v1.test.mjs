import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// The job identifier and concurrency key must match the ACTUAL workflow.
// workflow_dispatch uses ref_name; PR-driven workflows use the PR number.
const cases = [
  ['.github/workflows/canonical-brand-shell-test.yml', 'brand-shell-contracts', 'github.event.pull_request.number'],
  ['.github/workflows/canonical-brand-shell-full-build.yml', 'build', 'github.ref_name'],
  ['.github/workflows/live-preview-smoke.yml', 'smoke', 'github.event.pull_request.number'],
  ['.github/workflows/prijzen-hero-seo-regression.yml', 'regression', 'github.event.pull_request.number'],
];

test('expensive workflows use actual job identity, single-flight and a bounded timeout', async () => {
  for (const [path, job, scope] of cases) {
    const source = await readFile(path, 'utf8');
    const concurrency = source.match(/^concurrency:\r?\n[ \t]+group:([^\r\n]+)\r?\n[ \t]+cancel-in-progress:\s*true/m);
    assert.ok(concurrency, `${path}: must have concurrency grouping and cancel-in-progress`);
    assert.ok(concurrency[1].includes(scope), `${path}: wrong identity scope for ${job}`);
    assert.match(
      source,
      new RegExp(`\\n  ${job}:\\r?\\n    timeout-minutes: [1-9]\\d*\\b`),
      `${path}: actual job ${job} must have a positive bounded timeout`,
    );
  }
});
