import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production snapshot uses the recovered stable concurrency group', () => {
  const source = fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(source,/group:\s*production-source-snapshot-main-v2/);
  assert.match(source,/cancel-in-progress:\s*false/);
  assert.doesNotMatch(source,/group:\s*production-source-snapshot-main\s*$/m);
});
