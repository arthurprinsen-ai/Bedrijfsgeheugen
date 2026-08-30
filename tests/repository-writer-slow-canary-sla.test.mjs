import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('operational shadow handoff allows slow browser writers enough bounded time', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  const handoff = workflow.split('  handoff-shadow-after-writer:')[1] || '';
  assert.match(handoff, /timeout-minutes:\s*8/);
  assert.match(handoff, /seq\s+1\s+72/);
  assert.match(handoff, /sleep\s+5/);
  assert.match(handoff, /WRITER_PR_NOT_FOUND/);
  assert.match(handoff, /AMBIGUOUS_WRITER_PR/);
});
