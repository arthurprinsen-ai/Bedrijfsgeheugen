import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('chat-learning preflight keeps byte budget primary and source fanout bounded', () => {
  const contract=JSON.parse(readFileSync('config/brain-chat-learning-contract.json','utf8'));
  const source=readFileSync('scripts/brain/chat-learning-preflight.mjs','utf8');
  assert.equal(contract.preflightBudget.maxSources,128);
  assert.equal(contract.preflightBudget.maxBytes,256000);
  assert.equal(contract.preflightBudget.primaryBound,'maxBytes');
  assert.match(source,/contract\.preflightBudget\?\.maxSources/);
  assert.match(source,/contract\.preflightBudget\?\.maxBytes/);
  assert.match(source,/effectiveMaxSources/);
  assert.match(source,/effectiveMaxBytes/);
  assert.match(source,/maxBytes exceeded/);
  assert.doesNotMatch(source,/DEFAULT_MAX_SOURCES = 96/);
});
