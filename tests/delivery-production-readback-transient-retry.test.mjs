import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const path of [
  '.github/workflows/production-release-readback.yml',
  '.github/workflows/canonical-brand-shell-live-readback.yml',
]) {
  test(`${path} retries transient page fetch failures instead of aborting`, () => {
    const workflow = readFileSync(path, 'utf8');
    assert.match(workflow, /for attempt in \$\(seq 1 \d+\); do/);
    assert.match(workflow, /if\s+curl -fsSL[\s\S]*&&\s*curl -fsSL/);
    assert.match(workflow, /retry \$\{attempt\}\//);
    assert.doesNotMatch(workflow, /\n\s{12}curl -fsSL[^\n]+\n\s{12}curl -fsSL/);
  });
}
