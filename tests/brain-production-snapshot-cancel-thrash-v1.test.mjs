import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production snapshot finishes active deploy instead of cancel thrash', () => {
  const workflow = fs.readFileSync('.github/workflows/production-source-snapshot.yml', 'utf8');
  assert.match(workflow, /group:\s*production-source-snapshot-main/);
  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(workflow, /cancel-in-progress:\s*true/);
});
