import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = new URL('../config/brain-chat-learning-contract.json', import.meta.url);
const CHECKPOINT_PATH = new URL('../docs/learning/chat-learning-checkpoint-2026-08-30.md', import.meta.url);

test('Instagram/Make migration lessons live in the canonical chat-learning checkpoint', async () => {
  const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));
  const checkpoint = await readFile(CHECKPOINT_PATH, 'utf8');

  assert.ok(
    contract.canonicalSources.includes('docs/learning/chat-learning-checkpoint-2026-08-30.md'),
    'the shared chat checkpoint must remain a canonical BRAIN learning source',
  );

  assert.match(checkpoint, /## Instagram \/ Make native migration contract/);
  assert.match(checkpoint, /create.*(?:niet|≠).*verified/i);
  assert.match(checkpoint, /echte Notion page[- ]?ID/i);
  assert.match(checkpoint, /native.*Buffer.*gescheiden/i);
  assert.match(checkpoint, /429|502/);
  assert.match(checkpoint, /dedup/i);
  assert.match(checkpoint, /fail[- ]closed/i);
  assert.match(checkpoint, /één canonical.*Instagram.*connection/i);
  assert.match(checkpoint, /temporary|tijdelijke.*diagnos/i);
  assert.match(checkpoint, /zero[- ]legacy|0 legacy/i);
});
