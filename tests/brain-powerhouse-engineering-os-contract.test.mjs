import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { loadEngineeringContract, validateEngineeringOS } from '../scripts/brain/powerhouse-engineering-os.mjs';
import {
  fingerprintCandidate,
  coalesceCandidates,
  arbitrateConflict,
  evaluateCandidate,
  buildRevalidationDecision,
  buildAttribution
} from '../scripts/brain/continuous-improvement/index.mjs';

const baseCandidate = {
  component: 'brain',
  problemClass: 'latency',
  evidenceCluster: ['evt-b', 'evt-a'],
  changeClass: 'local_fix',
  scope: 'global',
  baselineComparable: true,
  criticalEvidence: { security: true, correctness: true },
  deltas: { security: 0, correctness: 0, cost: 0, latency: -5 },
  rollback: { candidateIdentity: 'candidate-a', lastKnownGoodIdentity: 'main-a' },
  productionPromotion: true
};

test('Engineering OS exposes canonical complete improvement path', async () => {
  const contract = await loadEngineeringContract();
  assert.equal(contract.fingerprint, 'powerhouse-engineering-os-v1');
  assert.equal(contract.delivery_contract, 'BRAIN-DELIVERY-v2');
  assert.deepEqual(contract.golden_path, ['CONTEXT','SCOPE','PLAN','CHANGE','TEST','PREVIEW','VERIFY','PROMOTE','PROD_READBACK','WRITEBACK','LEARN','IMPROVE']);
  for (const principle of ['SHARED-LEARNING','TEAM-OF-AGENTS','BOUNDED-AUTONOMY','MEASURED-SELF-IMPROVEMENT']) assert.ok(contract.principles.includes(principle));
});

test('shared learning, skill evolution and architecture evolution remain protected', async () => {
  const c = await loadEngineeringContract();
  assert.equal(c.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(c.shared_learning.preflight.read_current_shared_context, true);
  assert.equal(c.shared_learning.preflight.read_explicit_required_evidence, true);
  assert.equal(c.shared_learning.dedupe_before_write, true);
  for (const key of ['baseline','representative_eval','success_metric','compatibility','rollback_or_fallback','post_promotion_outcome']) assert.equal(c.skill_evolution.requires[key], true);
  for (const key of ['compare_to_current','measurable_improvement','migration_compatibility','security_privacy_cost_review','representative_tests_or_benchmarks','rollback_or_recovery','production_readback','system_map_and_decision_lineage_update']) assert.equal(c.architecture_evolution.requires[key], true);
});

test('continuous improvement contract is executable and fail-closed', async () => {
  const c = await loadEngineeringContract();
  const ci = c.continuous_improvement;
  assert.equal(ci.fingerprint, 'powerhouse-continuous-improvement-engine-v1');
  assert.deepEqual(ci.lifecycle, ['OBSERVE','CLUSTER','CANDIDATE','BASELINE','EVALUATE','DECIDE','SHADOW_OR_CANARY','PROMOTE_OR_REJECT','PROD_OBSERVE','ROLLBACK_OR_CONFIRM','ATTRIBUTE','WRITEBACK','REVALIDATE']);
  assert.equal(ci.candidate.dedupe_before_persist, true);
  assert.equal(ci.candidate.conflict_arbitration, true);
  assert.equal(ci.candidate.stable_identity, true);
  assert.equal(ci.promotion.security_non_degradation, true);
  assert.equal(ci.promotion.correctness_non_degradation, true);
  assert.equal(ci.promotion.unknown_critical_fails_closed, true);
  assert.equal(ci.promotion.no_single_magic_score, true);
  assert.equal(ci.promotion.rollback_identity_required, true);
  assert.equal(ci.promotion.compensated_tradeoff_requires_evidence, true);
  assert.equal(ci.promotion.business_claim_requires_business_evidence, true);
  assert.equal(ci.revalidation.require_revalidate_after, true);
  assert.deepEqual(ci.revalidation.states, ['CONFIRMED','CANDIDATE_REQUIRED','SUPERSEDED','BLOCKED_HARD_BOUNDARY']);
  assert.equal(ci.attribution.causality_not_assumed, true);
  assert.equal(ci.attribution.baseline_comparison_required, true);
});

test('candidate fingerprints are stable and exact duplicates coalesce', () => {
  const a = fingerprintCandidate(baseCandidate);
  const bCandidate = { ...baseCandidate, evidenceCluster: ['evt-a', 'evt-b', 'evt-a'] };
  assert.equal(a, fingerprintCandidate(bCandidate));
  assert.match(a, /^[a-f0-9]{64}$/);
  const result = coalesceCandidates([baseCandidate, bCandidate]);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.coalesced, 1);
});

test('candidate conflicts compare, supersede or isolate deterministically', () => {
  assert.equal(arbitrateConflict(baseCandidate, { ...baseCandidate, changeClass: 'architecture_change' }), 'COMPARE');
  const firstFingerprint = fingerprintCandidate(baseCandidate);
  assert.equal(arbitrateConflict(baseCandidate, { ...baseCandidate, changeClass: 'architecture_change', supersedesFingerprint: firstFingerprint }), 'SUPERSEDE');
  assert.equal(arbitrateConflict(baseCandidate, { ...baseCandidate, component: 'portal', problemClass: 'conversion' }), 'ISOLATE');
});

test('continuous improvement promotion fails closed on critical and rollback evidence', () => {
  assert.equal(evaluateCandidate({ ...baseCandidate, criticalEvidence: { security: false, correctness: true } }).decision, 'REJECT');
  assert.equal(evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, security: -1 } }).decision, 'REJECT');
  assert.equal(evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, correctness: -1 } }).decision, 'REJECT');
  assert.equal(evaluateCandidate({ ...baseCandidate, rollback: null }).decision, 'REJECT');
  assert.equal(evaluateCandidate({ ...baseCandidate, businessImpactClaim: true, businessEvidence: false }).decision, 'REJECT');
});

test('cost or latency regression requires explicit compensated benefit evidence', () => {
  const rejected = evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, cost: 20, latency: 10 } });
  assert.equal(rejected.decision, 'REJECT');
  const allowed = evaluateCandidate({ ...baseCandidate, deltas: { ...baseCandidate.deltas, cost: 20 }, compensatedBenefitEvidence: true, nonCriticalEvidenceComplete: true });
  assert.equal(allowed.decision, 'ALLOW');
});

test('bounded incomplete non-critical evidence can only enter an experiment', () => {
  const experiment = evaluateCandidate({ ...baseCandidate, nonCriticalEvidenceComplete: false, boundedExperiment: { exposure: 'shadow', observationWindow: '1h', rollbackTrigger: 'slo_breach' } });
  assert.equal(experiment.decision, 'EXPERIMENT');
  const rejected = evaluateCandidate({ ...baseCandidate, nonCriticalEvidenceComplete: false });
  assert.equal(rejected.decision, 'REJECT');
});

test('complete comparable candidate with gates satisfied is allowed', () => {
  assert.equal(evaluateCandidate({ ...baseCandidate, nonCriticalEvidenceComplete: true }).decision, 'ALLOW');
});

test('revalidation distinguishes hard boundary, supersession, stale change and confirmation', () => {
  const now = new Date('2026-09-16T12:00:00Z');
  assert.equal(buildRevalidationDecision({ hardBoundary: true, now }).state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(buildRevalidationDecision({ supersedingVerifiedIdentity: 'v2', now }).state, 'SUPERSEDED');
  assert.equal(buildRevalidationDecision({ revalidateAfter: '2026-09-15T00:00:00Z', evidenceChanged: true, now }).state, 'CANDIDATE_REQUIRED');
  assert.equal(buildRevalidationDecision({ revalidateAfter: '2026-09-17T00:00:00Z', evidenceChanged: false, now }).state, 'CONFIRMED');
});

test('attribution computes deltas without inventing causality', () => {
  const observed = buildAttribution({ baseline: { incidents: 10, latency: 100 }, current: { incidents: 6, latency: 80 } });
  assert.deepEqual(observed.deltas, { incidents: -4, latency: -20 });
  assert.equal(observed.causalClaim, false);
  assert.match(observed.limitation, /causal/i);
  const causal = buildAttribution({ baseline: { conversion: 0.1 }, current: { conversion: 0.12 }, experimentalDesign: { causalIdentification: true } });
  assert.equal(causal.causalClaim, true);
});

test('bounded autonomy exposes all seven controls', async () => {
  const c = await loadEngineeringContract();
  const o = c.operating_controls;
  assert.equal(o.fingerprint, 'powerhouse-autonomy-controls-v1');
  assert.deepEqual(Object.keys(o.controls).sort(), ['agent_security_control_plane','ai_eval_regression','autonomy_budget','disaster_recovery_drills','knowledge_decay','powerhouse_autonomy_scorecard','service_level_objectives']);
  assert.equal(o.controls.autonomy_budget.fail_closed, true);
  assert.equal(o.controls.ai_eval_regression.require_baseline_comparison, true);
  assert.equal(o.controls.agent_security_control_plane.least_privilege, true);
  assert.equal(o.controls.knowledge_decay.require_revalidate_after, true);
  assert.equal(o.controls.service_level_objectives.error_budget_policy, 'fail-closed-on-exhaustion');
  assert.equal(o.controls.disaster_recovery_drills.require_restore_proof, true);
  assert.equal(o.controls.powerhouse_autonomy_scorecard.no_single_magic_score, true);
  assert.equal(o.controls.powerhouse_autonomy_scorecard.unknown_is_not_zero, true);
});

test('all material agents receive autonomy controls through chat-learning preflight', () => {
  const parsed = JSON.parse(execFileSync(process.execPath, ['scripts/brain/chat-learning-preflight.mjs'], { encoding: 'utf8' }));
  assert.equal(parsed.status, 'READY');
  assert.ok(parsed.fingerprints.includes('powerhouse-autonomy-controls-v1'));
  assert.ok(parsed.sources.some(source => source.path === 'config/powerhouse-engineering-os.json'));
});

test('Engineering OS validator fails closed on evolution, autonomy and improvement drift', async () => {
  const r = await validateEngineeringOS();
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.equal(r.shared_learning_fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(r.control_fingerprint, 'powerhouse-autonomy-controls-v1');
  assert.equal(r.continuous_improvement_fingerprint, 'powerhouse-continuous-improvement-engine-v1');
});

test('existing Brain learning authority stays canonical', async () => {
  const learning = JSON.parse(await readFile(new URL('../config/brain-chat-learning-contract.json', import.meta.url), 'utf8'));
  assert.equal(learning.policy.reuseKnownFixBeforeExperimenting, true);
  assert.equal(learning.policy.writeNewMaterialLearningBack, true);
  assert.equal(learning.policy.refreshSharedContextAfterNewLearning, true);
});

test('continuous improvement documentation reuses the classified approved spec authority', async () => {
  const content = await readFile(new URL('../docs/superpowers/specs/2026-09-16-continuous-improvement-engine-v1-design.md', import.meta.url), 'utf8');
  assert.match(content, /powerhouse-continuous-improvement-engine-v1/);
  assert.match(content, /OBSERVE -> CLUSTER -> CANDIDATE/);
  assert.match(content, /No single aggregate score decides promotion/);
});

test('Development OS keeps current shared-learning documentation and delivery authority', async () => {
  const content = await readFile(new URL('../docs/development-operating-system.md', import.meta.url), 'utf8');
  assert.match(content, /BRAIN-DELIVERY-v2/);
  assert.doesNotMatch(content, /BRAIN-DELIVERY-v1/);
  assert.match(content, /powerhouse-shared-learning-architecture-evolution-v1/);
  assert.match(content, /LEARN -> IMPROVE/);
});

test('Required test executes the canonical Engineering OS regression contract', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tests\/brain-powerhouse-engineering-os-contract\.test\.mjs/);
});

test('CLI and packet expose shared-learning, autonomy and continuous improvement controls', () => {
  const checked = JSON.parse(execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--check'], { encoding: 'utf8' }));
  assert.equal(checked.status, 'ENGINEERING_OS_READY');
  assert.equal(checked.control_fingerprint, 'powerhouse-autonomy-controls-v1');
  assert.equal(checked.continuous_improvement_fingerprint, 'powerhouse-continuous-improvement-engine-v1');
  const packet = JSON.parse(execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--packet'], { encoding: 'utf8' }));
  assert.equal(packet.contract.shared_learning.fingerprint, 'powerhouse-shared-learning-architecture-evolution-v1');
  assert.equal(packet.contract.operating_controls.fingerprint, 'powerhouse-autonomy-controls-v1');
  assert.equal(packet.contract.continuous_improvement.fingerprint, 'powerhouse-continuous-improvement-engine-v1');
});
