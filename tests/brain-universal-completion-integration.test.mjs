import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

test('canonical chat-to-Brain policy requires the universal postflight manifest', async () => {
  const policy = await readJson('brain/policies/chat-to-brain-completeness-v1.json');
  assert.equal(policy.status, 'ACTIVE');
  assert.equal(policy.completionGate.universalManifestRequired, true);
  assert.equal(policy.enforcement.universalPostflightManifestRequired, true);
  assert.equal(policy.enforcement.failClosedOnMissingCategory, true);
  assert.equal(policy.enforcement.terminalClaimWithoutValidatorPassForbidden, true);
  assert.equal(policy.crossChatRequirement.allCurrentAndFutureMaterialRunsMustUseUniversalCompletionGate, true);
});

test('mandatory preflight exposes the fail-closed universal completion contract to every material chat and agent', () => {
  const packet = compileChatLearningPreflight();
  assert.equal(packet.status, 'READY');
  assert.equal(packet.universalCompletion.version, 'POWERHOUSE-UNIVERSAL-COMPLETION-v1');
  assert.equal(packet.universalCompletion.defaultEnabled, true);
  assert.equal(packet.universalCompletion.failClosed, true);
  assert.equal(packet.universalCompletion.entrypoint, 'scripts/brain/powerhouse-universal-completion-gate.mjs');
  assert.ok(packet.universalCompletion.requiredCategories.length >= 20);
  assert.ok(packet.sources.some(source => source.path === 'config/powerhouse-universal-completion-v1.json'));
});

test('universal completion policy has no opt-out path for material runs', async () => {
  const policy = await readJson('config/powerhouse-universal-completion-v1.json');
  assert.equal(policy.status, 'ACTIVE');
  assert.equal(policy.default_enabled, true);
  assert.equal(policy.fail_closed, true);
  assert.match(policy.scope, /all current and future material/i);
  for (const invariant of [
    'NO_TERMINAL_STATUS_WITHOUT_UNIVERSAL_MANIFEST',
    'NO_SILENT_OMISSION',
    'NO_CHAT_ONLY_MATERIAL_LEARNING',
    'NO_PRODUCTION_GREEN_AS_SUBSTITUTE_FOR_CANONICAL_WRITEBACK',
    'NO_OPEN_OBLIGATION_UNDER_LIVE_AND_PROVEN'
  ]) assert.ok(policy.invariants.includes(invariant), `missing invariant ${invariant}`);
});
