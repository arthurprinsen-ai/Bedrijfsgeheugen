import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const policyPath = new URL('../brain/policies/powerhouse-agent-continuity-v1.json', import.meta.url);

function readPolicy() {
  return JSON.parse(readFileSync(policyPath, 'utf8'));
}

test('continuity contract makes chats and agents intrinsic nodes in one canonical Powerhouse loop', () => {
  const policy = readPolicy();
  const contract = policy.loop_node_contract;

  assert.equal(contract.required, true);
  assert.deepEqual(contract.actor_kinds, ['chat', 'agent']);
  assert.equal(contract.role, 'INTRINSIC_EXECUTION_NODE');
  assert.equal(contract.single_canonical_loop, true);
  assert.equal(contract.canonical_state_required_before_execution, true);
  assert.equal(contract.canonical_writeback_required_before_terminal, true);
  assert.equal(contract.next_run_must_resume_from_written_state, true);
  assert.deepEqual(contract.execution_sequence, [
    'intent_or_obligation',
    'existing_state_preflight',
    'retrieve_relevant_knowledge_and_lineage',
    'bounded_execution',
    'tests_and_gates',
    'merge_deploy_or_promote_when_applicable',
    'production_or_provider_readback_and_evidence',
    'outcome_and_value',
    'root_cause_learning_and_prevention',
    'canonical_writeback',
    'next_run_from_updated_canonical_state',
  ]);
  assert.ok(contract.forbidden_terminal_states.includes('CHAT_ENDED_WITHOUT_CANONICAL_WRITEBACK'));
  assert.ok(contract.forbidden_terminal_states.includes('AGENT_ENDED_WITHOUT_CANONICAL_WRITEBACK'));
  assert.ok(contract.forbidden_patterns.includes('isolated_chat_memory_as_authority'));
  assert.ok(contract.forbidden_patterns.includes('parallel_agent_brain_as_authority'));
});

test('mandatory chat-learning preflight validates and exposes the loop-node contract', () => {
  const packet = compileChatLearningPreflight();
  assert.equal(packet.loopNodeContract.required, true);
  assert.deepEqual(packet.loopNodeContract.actorKinds, ['chat', 'agent']);
  assert.equal(packet.loopNodeContract.role, 'INTRINSIC_EXECUTION_NODE');
  assert.equal(packet.loopNodeContract.singleCanonicalLoop, true);
  assert.equal(packet.loopNodeContract.canonicalStateRequiredBeforeExecution, true);
  assert.equal(packet.loopNodeContract.canonicalWritebackRequiredBeforeTerminal, true);
  assert.equal(packet.loopNodeContract.nextRunMustResumeFromWrittenState, true);
  assert.equal(packet.loopNodeContract.policySource, 'brain/policies/powerhouse-agent-continuity-v1.json');
});
