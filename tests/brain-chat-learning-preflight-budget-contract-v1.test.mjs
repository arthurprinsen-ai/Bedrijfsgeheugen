import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('chat-learning compiler regression follows canonical source and byte budgets', async () => {
  const contract=JSON.parse(await readFile('config/brain-chat-learning-contract.json','utf8'));
  const source=await readFile('scripts/brain/test-chat-learning-preflight-compiler.mjs','utf8');
  assert.equal(contract.preflightBudget.maxSources,128);
  assert.equal(contract.preflightBudget.maxBytes,256000);
  assert.match(source,/const maxSources = contract\.preflightBudget\?\.maxSources/);
  assert.match(source,/const maxBytes = contract\.preflightBudget\?\.maxBytes/);
  assert.match(source,/packet\.sources\.length <= maxSources/);
  assert.match(source,/packet\.totalBytes <= maxBytes/);
  assert.doesNotMatch(source,/packet\.sources\.length <= 96/);
});
