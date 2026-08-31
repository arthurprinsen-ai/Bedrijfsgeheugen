import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

test('latest material chat learnings are persisted in the canonical Brain preflight', () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const paths = new Set(packet.sources.map(source => source.path));

  assert.ok(paths.has('brain/learning/chat-materialization-2026-08-31-v2.json'));
  assert.ok(packet.fingerprints.includes('netlify-preview-provider-scope-mismatch-v1'));
  assert.ok(packet.fingerprints.includes('delivery|runtime-path|unclassified-netlify-build-control-v1'));
  assert.ok(packet.fingerprints.includes('delivery|verification|provider-impact-guard-needs-two-sided-proof-v1'));
  assert.ok(packet.fingerprints.includes('delivery|candidate|stale-open-pr-after-material-main-drift-v1'));
});
