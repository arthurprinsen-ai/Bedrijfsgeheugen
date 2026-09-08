import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const AGENTS_PATH = new URL('../AGENTS.md', import.meta.url);
const COMPLETION_CONTRACT_PATH = new URL('../config/nonterminal-ci-completion-contract.json', import.meta.url);

test('AGENTS delivery synchronization rule includes semantic contract overlap', async () => {
  const agents = await readFile(AGENTS_PATH, 'utf8');
  assert.match(agents, /mergeconflict, changed-path overlap, declared contract overlap of declared dependency conflict vereist synchronisatie/);
});

test('nonterminal CI completion contract forbids stopping before verified production outcome', async () => {
  const agents = await readFile(AGENTS_PATH, 'utf8');
  const contract = JSON.parse(await readFile(COMPLETION_CONTRACT_PATH, 'utf8'));
  assert.match(agents, /RED MEANS AGENTS KEEP WORKING/);
  assert.equal(contract.version, 'NONTERMINAL-CI-COMPLETION-v1');
  for (const key of ['ciPendingIsTerminal','ciFailureIsTerminal','openPrIsTerminal','mergeWaitIsTerminal','deployInProgressIsTerminal','missingProductionReadbackIsTerminal']) assert.equal(contract.policy[key], false);
  for (const state of ['queued','pending','in_progress','failed_check','open_pr','merge_wait','deploy_in_progress','production_drift','missing_production_readback']) assert.ok(contract.nonTerminalStates.includes(state));
  assert.deepEqual(contract.requiredSequence, ['build_or_fix','persist_prevention','preview_content_readback','all_required_gates_green','pr_merged_or_candidate_promoted','exact_production_sha_deployed','live_production_readback','outcome_verified']);
  assert.deepEqual(contract.terminalSuccessStates, ['PRODUCTION_GREEN', 'LIVE_VERIFIED']);
  assert.equal(contract.terminalBlockedState, 'BLOCKED_HARD_BOUNDARY');
  for (const message of ['CI loopt nog','wachten op deploy','PR is nog open','nog één check rood','ik doe nu de readback']) assert.ok(contract.prohibitedTerminalMessages.includes(message));
  assert.equal(contract.handoffOnRuntimeOrContextLimit.required, true);
  for (const field of ['pr','head_sha','run_ids','failing_step_or_assertion','remaining_gate','production_readback_step','do_not_ask_again']) assert.ok(contract.handoffOnRuntimeOrContextLimit.fields.includes(field));
});
