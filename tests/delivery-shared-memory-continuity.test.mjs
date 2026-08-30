import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/shared-agent-memory-tests.yml', 'utf8');

test('Shared Agent Memory auto-discovers the delivery chat regression family', () => {
  assert.match(
    workflow,
    /tests\/delivery-chat-\*\.test\.mjs/,
    'Shared Agent Memory must auto-discover tests/delivery-chat-*.test.mjs so future canonical execution regressions cannot be omitted manually'
  );
});
