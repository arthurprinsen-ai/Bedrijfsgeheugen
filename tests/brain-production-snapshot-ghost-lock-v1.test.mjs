import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production snapshot uses the recovered stable concurrency group', () => {
  const source = fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(source,/group:\s*production-source-snapshot-main-v2/);
  assert.match(source,/cancel-in-progress:\s*false/);
  assert.doesNotMatch(source,/group:\s*production-source-snapshot-main\s*$/m);
});


test('ghost-lock learning uses executable evaluation test paths', () => {
  const learning = JSON.parse(fs.readFileSync('brain/learning/production-snapshot-ghost-lock-20260925-v1.json','utf8'));
  for (const lane of ['historical_replay','shadow','canary']) {
    assert.deepEqual(learning.evaluation[lane], ['tests/brain-production-snapshot-ghost-lock-v1.test.mjs']);
  }
});
