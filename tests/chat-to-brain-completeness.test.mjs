import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

test('chat learning preflight always includes chat-to-brain policy and latest continuity snapshot', () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const paths = new Set(packet.sources.map(source => source.path));

  assert.equal(packet.status, 'READY');
  assert.ok(paths.has('brain/policies/chat-to-brain-completeness-v1.json'));
  assert.ok(paths.has('brain/learning/chat-continuity-2026-08-31.json'));
});

test('known durable failure fingerprints from the continuity snapshot are visible to every preflight', () => {
  const packet = compileChatLearningPreflight({ rootDir });

  assert.ok(packet.fingerprints.includes('repeated-known-blocker-no-state-v1'));
  assert.ok(packet.fingerprints.includes('make|cost|polling-retry-full-refresh-fanout'));
  assert.ok(packet.fingerprints.includes('github|repository|auto-merge-disabled'));
});

test('current chat Brain-writeback replay obligation is canonical and visible to every preflight', () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const paths = new Set(packet.sources.map(source => source.path));

  assert.ok(paths.has('brain/learning/chat-session-brain-writeback-2026-08-31.json'));
  assert.ok(packet.fingerprints.includes('brain-writeback|bg168-bg166|make-capacity-paused-pending-replay-v1'));
});
