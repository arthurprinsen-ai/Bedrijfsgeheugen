import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('chat learning completeness addendum retains Make credit-storm recovery contracts', async () => {
  const raw = await readFile('brain/learning/chat-completeness-addendum-2026-08-30.json', 'utf8');
  const addendum = JSON.parse(raw);

  assert.equal(addendum.version, 'CHAT-LEARNING-COMPLETENESS-ADDENDUM-v1.3');
  assert.equal(addendum.completionGate.id, 'chat-learning-completeness-gate-v1');

  const fingerprints = new Map(addendum.failurePatterns.map(x => [x.id, x.fingerprint]));
  assert.equal(fingerprints.get('CONTROL_PLANE_CREDIT_STORM'), 'make|multi-agent-context-learning-credit-storm|2026-08-30-v1');
  assert.equal(fingerprints.get('INACTIVE_ON_DEMAND_STILL_CALLABLE'), 'make|subscenario|inactive-still-callable-v1');
  assert.equal(fingerprints.get('CONNECTOR_MUTATION_WRONG_RESOURCE'), 'connector|mutation|wrong-tool-or-resource-selected-v1');
  assert.equal(fingerprints.get('OPTIONAL_LEARNING_MUST_NOT_OWN_PRIMARY_RETURN'), 'agent|learning-path|optional-learning-blocks-primary-return-v1');
  assert.equal(fingerprints.get('CANONICAL_ARTIFACT_REFERENCE_DRIFT'), 'learning|canonical-artifact|reference-path-drift-v1');
  assert.equal(fingerprints.get('LIVE_STRUCTURAL_MIGRATION_PARTIAL_STATE'), 'make|structural-migration|partial-branch-state-under-429-v1');
  assert.equal(fingerprints.get('CREATE_429_AMBIGUOUS_MUTATION'), 'make|scenario-create|429-ambiguous-mutation-v1');

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

  assert.equal(addendum.runtimeState.BG167.canonicalRefreshCaller, 'BG166');
  assert.match(addendum.runtimeState.BG167.status, /ENTRY_GUARD_VERIFIED/);
  assert.match(addendum.runtimeState.BG168.status, /PENDING_CALLER_SIDE_MATERIALITY_BRANCH/);
  assert.match(addendum.runtimeState.BG168.protectedInvariant, /Primary agent result delivery is independent/);
  assert.match(addendum.runtimeState.PH_AGENT_14_CANARY.status, /ROLLED_BACK_TO_PRE_MIGRATION_GREEN_TOPOLOGY/);
  assert.match(addendum.runtimeState.PH_AGENT_14_STAGING_CANARY.status, /NOT_CREATED_AFTER_429_READBACK/);

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
    'ambiguous state-changing connector responses require exact readback before any retry'
  ]) assert.ok(addendum.completionGate.requirements.includes(required), `completion gate missing: ${required}`);
});
