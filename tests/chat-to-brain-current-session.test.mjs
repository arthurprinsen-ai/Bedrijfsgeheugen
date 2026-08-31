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
  assert.ok(paths.has('brain/learning/chat-materialization-2026-08-31-v3.json'));
  assert.ok(paths.has('brain/learning/ph-agent-materiality-preflight-v1.json'));
  assert.ok(packet.fingerprints.includes('netlify-preview-provider-scope-mismatch-v1'));
  assert.ok(packet.fingerprints.includes('delivery|runtime-path|unclassified-netlify-build-control-v1'));
  assert.ok(packet.fingerprints.includes('delivery|verification|provider-impact-guard-needs-two-sided-proof-v1'));
  assert.ok(packet.fingerprints.includes('delivery|candidate|stale-open-pr-after-material-main-drift-v1'));
  assert.ok(packet.fingerprints.includes('make|multi-agent-context-learning-credit-storm|2026-08-30-v1'));
  assert.ok(packet.fingerprints.includes('make|agent-template|unconditional-bg168-dispatch-on-resume-v1'));
  assert.ok(packet.fingerprints.includes('make|ph-agent-template|caller-side-materiality-v1'));
  assert.ok(packet.preventions.includes('CLASSIFY_AND_EXECUTE_CHANGED_TEST_PATHS'));
  assert.ok(packet.preventions.includes('SKIP_NETLIFY_PREVIEW_ONLY_FOR_PROVEN_NON_SITE_DIFFS'));
  assert.ok(packet.preventions.includes('PH_AGENT_MATERIALITY_BEFORE_BG168'));
});
