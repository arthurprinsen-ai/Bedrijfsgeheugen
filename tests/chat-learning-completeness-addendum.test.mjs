import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyMaterialOutcome } from '../brain/guards/material-outcome-classifier.mjs';

test('chat learning completeness addendum retains Make credit-storm recovery contracts', async () => {
  const raw = await readFile('brain/learning/chat-completeness-addendum-2026-08-30.json', 'utf8');
  const addendum = JSON.parse(raw);

  assert.equal(addendum.version, 'CHAT-LEARNING-COMPLETENESS-ADDENDUM-v1.6');
  assert.equal(addendum.completionGate.id, 'chat-learning-completeness-gate-v1');

  const fingerprints = new Map(addendum.failurePatterns.map(x => [x.id, x.fingerprint]));
  assert.equal(fingerprints.get('CONTROL_PLANE_CREDIT_STORM'), 'make|multi-agent-context-learning-credit-storm|2026-08-30-v1');
  assert.equal(fingerprints.get('INACTIVE_ON_DEMAND_STILL_CALLABLE'), 'make|subscenario|inactive-still-callable-v1');
  assert.equal(fingerprints.get('CONNECTOR_MUTATION_WRONG_RESOURCE'), 'connector|mutation|wrong-tool-or-resource-selected-v1');
  assert.equal(fingerprints.get('OPTIONAL_LEARNING_MUST_NOT_OWN_PRIMARY_RETURN'), 'agent|learning-path|optional-learning-blocks-primary-return-v1');
  assert.equal(fingerprints.get('CANONICAL_ARTIFACT_REFERENCE_DRIFT'), 'learning|canonical-artifact|reference-path-drift-v1');
  assert.equal(fingerprints.get('LIVE_STRUCTURAL_MIGRATION_PARTIAL_STATE'), 'make|structural-migration|partial-branch-state-under-429-v1');
  assert.equal(fingerprints.get('CREATE_429_AMBIGUOUS_MUTATION'), 'make|scenario-create|429-ambiguous-mutation-v1');
  assert.equal(fingerprints.get('MAKE_VALIDATOR_WARNING_PATH_INCONSISTENCY'), 'make|validator|required-field-path-warning-inconsistent-with-module-spec-v1');
  assert.equal(fingerprints.get('BLUEPRINT_OR_CI_GREEN_WITHOUT_RUNTIME_EVIDENCE'), 'make|promotion|blueprint-or-ci-green-without-runtime-evidence-v1');
  assert.equal(fingerprints.get('MAKE_CAPACITY_EXHAUSTION_HARD_BOUNDARY'), 'make|capacity|team-paused-operations-or-data-transfer-limit-v1');

  const credit = addendum.failurePatterns.find(x => x.id === 'CONTROL_PLANE_CREDIT_STORM');
  for (const guard of [
    'canonical_owner',
    'material_state_change_before_dispatch',
    'global_single_flight',
    'cache_first_worker_read',
    'state_hash_before_write',
    'bounded_credit_slope',
    'readback_before_retry_after_429_or_502',
    'learning_write_fail_open_from_projection_refresh'
  ]) assert.ok(credit.requiredGuards.includes(guard), `missing credit guard ${guard}`);

  const resultPath = addendum.failurePatterns.find(x => x.id === 'OPTIONAL_LEARNING_MUST_NOT_OWN_PRIMARY_RETURN');
  assert.match(resultPath.requiredAction, /independent direct ReturnData path/);
  assert.match(resultPath.regression, /BG168 must receive zero calls/);
  assert.match(resultPath.regression, /exact primary agent result/);

  const migration = addendum.failurePatterns.find(x => x.id === 'LIVE_STRUCTURAL_MIGRATION_PARTIAL_STATE');
  assert.match(migration.requiredAction, /one atomic scenario_patch/);
  assert.match(migration.requiredAction, /staging clone/);
  assert.match(migration.requiredAction, /read back before retry/);

  const ambiguousCreate = addendum.failurePatterns.find(x => x.id === 'CREATE_429_AMBIGUOUS_MUTATION');
  assert.match(ambiguousCreate.requiredAction, /ambiguous mutation state/);
  assert.match(ambiguousCreate.requiredAction, /one exact readback/);
  assert.match(ambiguousCreate.regression, /No duplicate staging or production scenario/);

  const warning = addendum.failurePatterns.find(x => x.id === 'MAKE_VALIDATOR_WARNING_PATH_INCONSISTENCY');
  assert.match(warning.requiredAction, /module_spec/);
  assert.match(warning.requiredAction, /exact saved module readback/);
  assert.match(warning.regression, /must not mutate a module into a schema-invalid shape/);

  const promotion = addendum.failurePatterns.find(x => x.id === 'BLUEPRINT_OR_CI_GREEN_WITHOUT_RUNTIME_EVIDENCE');
  assert.match(promotion.requiredAction, /config\/make-agent-learning-promotion\.json/);
  assert.match(promotion.requiredAction, /runtime evidence/);
  assert.match(promotion.regression, /blueprint or CI green alone/);

  const capacity = addendum.failurePatterns.find(x => x.id === 'MAKE_CAPACITY_EXHAUSTION_HARD_BOUNDARY');
  assert.match(capacity.requiredAction, /must not buy or increase paid capacity autonomously/i);
  assert.match(capacity.requiredAction, /zero executions/i);
  assert.match(capacity.regression, /staging remains inactive/i);

  for (const value of ['OK', 'OK.', 'healthy', 'NO_ACTION', 'no change', 'Geen actie', 'Geen wijzigingen.']) {
    const result = classifyMaterialOutcome(value);
    assert.equal(result.isMaterial, false, `${value} must be non-material`);
    assert.equal(result.answer, String(value).trim());
  }

  for (const value of [
    'Reduced duplicate reads by 42%',
    '429 detected; applied safe rollback',
    'Potential anomaly requires review',
    '',
    'Unknown'
  ]) {
    const result = classifyMaterialOutcome(value);
    assert.equal(result.isMaterial, true, `${value || '<empty>'} must conservatively remain material`);
  }

  assert.equal(addendum.runtimeState.BG167.canonicalRefreshCaller, 'BG166');
  assert.match(addendum.runtimeState.BG167.status, /ENTRY_GUARD_VERIFIED/);
  assert.match(addendum.runtimeState.BG168.status, /PENDING_RUNTIME_PROOF/);
  assert.match(addendum.runtimeState.BG168.protectedInvariant, /Primary agent result delivery is independent/);
  assert.match(addendum.runtimeState.PH_AGENT_14_CANARY.status, /ROLLED_BACK_TO_PRE_MIGRATION_GREEN_TOPOLOGY/);
  assert.equal(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.scenarioId, 7165093);
  assert.match(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.status, /INACTIVE_BLUEPRINT_VALIDATED_RUNTIME_BLOCKED_BY_CAPACITY/);
  assert.match(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.topology, /NON_MATERIAL -> direct Return without BG168/);
  assert.equal(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.promotionContract, 'config/make-agent-learning-promotion.json');
  assert.equal(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.latestRuntimeAttempt.executionStarted, false);
  assert.equal(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.latestRuntimeAttempt.stagingExecutionsObserved, 0);
  assert.equal(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.latestRuntimeAttempt.BG168ExecutionsObserved, 0);

  assert.ok(addendum.canonicalArtifacts.includes('config/make-agent-learning-promotion.json'));
  for (const path of addendum.canonicalArtifacts) {
    const content = await readFile(path, 'utf8');
    assert.ok(content.length > 0, `canonical artifact missing or empty: ${path}`);
  }

  for (const required of [
    'new durable fingerprint stored',
    'root cause recorded',
    'prevention and regression contract recorded',
    'open recovery obligations explicitly preserved',
    'machine-readable CI/preflight coverage exists',
    'canonical artifact paths verified by exact readback',
    'optional observability and learning paths cannot own primary business result delivery',
    'multi-step structural migrations are atomic or every intermediate state is independently safe',
    'ambiguous state-changing connector responses require exact readback before any retry',
    'contradictory validator warnings are reconciled against authoritative module schema and exact readback before mutation',
    'shared materiality classification is deterministic, conservative and centrally tested',
    'runtime behavior evidence is distinct from blueprint and CI evidence',
    'capacity exhaustion is a hard boundary and never authorizes autonomous paid capacity expansion'
  ]) assert.ok(addendum.completionGate.requirements.includes(required), `completion gate missing: ${required}`);
});
