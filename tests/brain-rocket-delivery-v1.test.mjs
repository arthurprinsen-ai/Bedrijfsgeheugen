import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Rocket Delivery v1 keeps one PR authority and collapses obsolete work', async () => {
  const [codeql, fullBuild, liveReadback, v18, productionReadback] = await Promise.all([
    read('.github/workflows/powerhouse-codeql.yml'),
    read('.github/workflows/canonical-brand-shell-full-build.yml'),
    read('.github/workflows/canonical-brand-shell-live-readback.yml'),
    read('.github/workflows/v18-production-promotion.yml'),
    read('.github/workflows/production-release-readback.yml'),
  ]);

  assert.doesNotMatch(fullBuild, /pull_request:/);
  assert.doesNotMatch(v18, /pull_request:/);
  assert.doesNotMatch(liveReadback, /pull_request:/);
  assert.ok(
    codeql.includes('group: powerhouse-codeql-${{ github.event_name }}-${{ github.event.pull_request.number || github.ref_name }}'),
    'CodeQL concurrency must collapse obsolete same-ref work',
  );
  assert.doesNotMatch(codeql, /github\.run_id/);
  assert.match(codeql, /cancel-in-progress: true/);
  assert.match(productionReadback, /paths-ignore:/);
});
