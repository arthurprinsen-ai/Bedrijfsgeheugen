import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const continuity = JSON.parse(await readFile('brain/policies/powerhouse-agent-continuity-v1.json', 'utf8'));
const completion = JSON.parse(await readFile('brain/policies/live-completion-learning-contract-v1.json', 'utf8'));
const preflight = await readFile('scripts/brain/chat-learning-preflight.mjs', 'utf8');

test('all material autonomous work must join the existing Powerhouse', () => {
  assert.equal(continuity.status, 'ACTIVE');
  assert.match(continuity.scope, /all current and future material/i);
  assert.match(continuity.automatic_integration_rule, /existing Powerhouse architecture/);
  assert.match(continuity.automatic_integration_rule, /may not remain an isolated script/);
});

test('green completion requires reusable operating handoff for following agents', () => {
  const required = continuity.mandatory_post_change_handoff.fields;
  for (const field of [
    'canonical_owner',
    'repository_or_runtime_location',
    'dependencies',
    'execution_or_runtime_flow',
    'deployment_or_publication_route',
    'production_or_provider_readback',
    'rollback_or_recovery_route',
    'learning_and_outcome_lineage',
    'known_open_gaps',
    'last_verified_identity'
  ]) assert.ok(required.includes(field), `missing handoff field: ${field}`);
  assert.ok(continuity.terminal_green_requires.includes('current_state_or_handoff_updated'));
  assert.ok(continuity.terminal_green_requires.includes('shared_preflight_can_discover_the_new_state'));
});

test('live completion contract cannot finish before registration, handoff and learning', () => {
  assert.ok(completion.invariants.includes('NO_DONE_WITHOUT_AGENT_CONTINUITY'));
  assert.ok(completion.required_execution_loop.includes('register_or_update_the_capability_in_existing_powerhouse_architecture_when_applicable'));
  assert.ok(completion.required_execution_loop.includes('persist_how_the_capability_works_owner_dependencies_runtime_deploy_readback_rollback_learning_route_and_open_gaps'));
  assert.equal(completion.claim_policy.complete_requires_agent_handoff_and_canonical_discoverability, true);
});

test('every chat-learning preflight loads agent continuity', () => {
  assert.match(preflight, /brain\/policies\/powerhouse-agent-continuity-v1\.json/);
});
