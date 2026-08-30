import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/shared-agent-memory-tests.yml', 'utf8');

test('Shared Agent Memory permanently executes delivery chat continuity regression', () => {
  assert.match(
    workflow,
    /tests\/delivery-chat-continuity\.test\.mjs/,
    'Shared Agent Memory must execute delivery-chat-continuity.test.mjs so canonical execution learnings cannot regress silently'
  );
});
