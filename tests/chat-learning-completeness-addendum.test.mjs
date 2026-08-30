import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyMaterialOutcome } from '../brain/guards/material-outcome-classifier.mjs';

test('chat learning completeness addendum retains Make credit-storm recovery contracts', async () => {
  const addendum = JSON.parse(await readFile('brain/learning/chat-completeness-addendum-2026-08-30.json', 'utf8'));
  assert.equal(addendum.version, 'CHAT-LEARNING-COMPLETENESS-ADDENDUM-v1.6');
  assert.equal(addendum.completionGate.id, 'chat-learning-completeness-gate-v1');

  const fingerprints = new Map(addendum.failurePatterns.map(x => [x.id, x.fingerprint]));
  for (const [id, fingerprint] of [
    ['CONTROL_PLANE_CREDIT_STORM','make|multi-agent-context-learning-credit-storm|2026-08-30-v1'],
    ['INACTIVE_ON_DEMAND_STILL_CALLABLE','make|subscenario|inactive-still-callable-v1'],
    ['CONNECTOR_MUTATION_WRONG_RESOURCE','connector|mutation|wrong-tool-or-resource-selected-v1'],
    ['OPTIONAL_LEARNING_MUST_NOT_OWN_PRIMARY_RETURN','agent|learning-path|optional-learning-blocks-primary-return-v1'],
    ['CANONICAL_ARTIFACT_REFERENCE_DRIFT','learning|canonical-artifact|reference-path-drift-v1'],
    ['LIVE_STRUCTURAL_MIGRATION_PARTIAL_STATE','make|structural-migration|partial-branch-state-under-429-v1'],
    ['CREATE_429_AMBIGUOUS_MUTATION','make|scenario-create|429-ambiguous-mutation-v1'],
    ['MAKE_VALIDATOR_WARNING_PATH_INCONSISTENCY','make|validator|required-field-path-warning-inconsistent-with-module-spec-v1'],
    ['BLUEPRINT_OR_CI_GREEN_WITHOUT_RUNTIME_EVIDENCE','make|promotion|blueprint-or-ci-green-without-runtime-evidence-v1'],
    ['MAKE_CAPACITY_EXHAUSTION_HARD_BOUNDARY','make|capacity|team-paused-operations-or-data-transfer-limit-v1']
  ]) assert.equal(fingerprints.get(id), fingerprint);

  const promotion = addendum.failurePatterns.find(x => x.id === 'BLUEPRINT_OR_CI_GREEN_WITHOUT_RUNTIME_EVIDENCE');
  assert.match(promotion.requiredAction, /config\/make-agent-learning-promotion\.json/);
  assert.match(promotion.regression, /blueprint or CI green alone/);

  const capacity = addendum.failurePatterns.find(x => x.id === 'MAKE_CAPACITY_EXHAUSTION_HARD_BOUNDARY');
  assert.match(capacity.requiredAction, /must not buy or increase paid capacity autonomously/i);
  assert.match(capacity.requiredAction, /zero executions/i);
  assert.match(capacity.regression, /staging remains inactive/i);

  for (const value of ['OK','OK.','healthy','NO_ACTION','no change','Geen actie','Geen wijzigingen.']) {
    assert.equal(classifyMaterialOutcome(value).isMaterial, false, `${value} must be non-material`);
  }
  for (const value of ['Reduced duplicate reads by 42%','429 detected; applied safe rollback','Potential anomaly requires review','','Unknown']) {
    assert.equal(classifyMaterialOutcome(value).isMaterial, true, `${value || '<empty>'} must conservatively remain material`);
  }

  assert.equal(addendum.runtimeState.BG167.canonicalRefreshCaller, 'BG166');
  assert.match(addendum.runtimeState.BG168.status, /PENDING_RUNTIME_PROOF/);
  const staging = addendum.runtimeState.PH_AGENT_14_STAGING_CANARY;
  assert.equal(staging.scenarioId, 7165093);
  assert.match(staging.status, /INACTIVE_BLUEPRINT_VALIDATED_RUNTIME_BLOCKED_BY_CAPACITY/);
  assert.equal(staging.promotionContract, 'config/make-agent-learning-promotion.json');
  assert.equal(staging.latestRuntimeAttempt.executionStarted, false);
  assert.equal(staging.latestRuntimeAttempt.stagingExecutionsObserved, 0);
  assert.equal(staging.latestRuntimeAttempt.BG168ExecutionsObserved, 0);

  assert.ok(addendum.canonicalArtifacts.includes('config/make-agent-learning-promotion.json'));
  for (const path of addendum.canonicalArtifacts) assert.ok((await readFile(path, 'utf8')).length > 0, `canonical artifact missing or empty: ${path}`);

  for (const required of [
    'runtime behavior evidence is distinct from blueprint and CI evidence',
    'capacity exhaustion is a hard boundary and never authorizes autonomous paid capacity expansion',
    'optional observability and learning paths cannot own primary business result delivery'
  ]) assert.ok(addendum.completionGate.requirements.includes(required), `completion gate missing: ${required}`);
});
