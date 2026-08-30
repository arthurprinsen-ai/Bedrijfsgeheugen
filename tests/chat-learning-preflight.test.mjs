import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('AGENTS.md requires the Powerhouse chat learning checkpoint in preflight', async () => {
  const agents = await readFile('AGENTS.md', 'utf8');
  assert.match(agents, /docs\/powerhouse-chat-learning-checkpoint-2026-08-30\.md/);
});
