import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CONTRACT_PATH = new URL('../config/brain-chat-learning-contract.json', import.meta.url);
const CHECKPOINT_PATH = new URL('../docs/learning/instagram-make-chat-learning-checkpoint-2026-08-30.md', import.meta.url);

const REQUIRED_LESSON_IDS = [
  'INSTAGRAM_NATIVE_CREATE_REQUIRES_READBACK_VERIFICATION',
  'INSTAGRAM_NOTION_UPDATE_REQUIRES_REAL_PAGE_ID',
  'INSTAGRAM_NATIVE_AND_BUFFER_IDS_MUST_STAY_SEPARATE',
  'INSTAGRAM_INSIGHTS_STAY_FAIL_CLOSED_UNTIL_LIVE_PROVEN',
  'INSTAGRAM_USE_ONE_CANONICAL_CONNECTION_PER_PRODUCTION_CHAIN',
  'INSTAGRAM_DIAGNOSTICS_ARE_TEMPORARY_AND_RETIRE_AFTER_EVIDENCE',
  'INSTAGRAM_LEARNING_SNAPSHOT_DEDUPES_BEFORE_WRITE',
  'INSTAGRAM_BUFFER_RETIRES_ONLY_AFTER_ZERO_LEGACY_EVIDENCE',
];

test('BRAIN chat-learning contract canonically includes Instagram/Make migration lessons', async () => {
  const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));

  assert.ok(
    contract.canonicalSources.includes('docs/learning/instagram-make-chat-learning-checkpoint-2026-08-30.md'),
    'Instagram/Make chat checkpoint must be a canonical learning source',
  );

  const ids = new Set(contract.lessons.map((lesson) => lesson.id));
  for (const id of REQUIRED_LESSON_IDS) {
    assert.ok(ids.has(id), `missing canonical Instagram/Make lesson: ${id}`);
  }
});

test('Instagram/Make checkpoint documents proof, retry, dedupe and retirement invariants', async () => {
  const checkpoint = await readFile(CHECKPOINT_PATH, 'utf8');

  assert.match(checkpoint, /create.*niet.*verified|create.*≠.*verified/i);
  assert.match(checkpoint, /page[- ]?id/i);
  assert.match(checkpoint, /429|502/);
  assert.match(checkpoint, /dedup/i);
  assert.match(checkpoint, /zero[- ]legacy|0 legacy/i);
  assert.match(checkpoint, /fail[- ]closed/i);
});
