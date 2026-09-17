import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const contractPath = path.join(repoRoot, 'config', 'powerhouse-engineering-os.json');
const fastProtocolPath = path.join(repoRoot, 'config', 'powerhouse-fast-development-protocol-v2.json');
export async function loadEngineeringContract() { return JSON.parse(await readFile(contractPath, 'utf8')); }
export async function loadFastDevelopmentProtocol() { return JSON.parse(await readFile(fastProtocolPath, 'utf8')); }
async function exists(relativePath) { try { await access(path.join(repoRoot, relativePath)); return true; } catch { return false; } }
function requireBoolean(value, label, errors) { if (value !== true) errors.push(`${label} must be true`); }
function requireNonEmptyArray(value, label, errors) { if (!Array.isArray(value) || value.length === 0) errors.push(`${label} must be a non-empty array`); }
function validateOperatingControls(contract, errors) {
  const operating = contract.operating_controls;
  if (!operating || operating.fingerprint !== 'powerhouse-autonomy-controls-v1') { errors.push('autonomy controls fingerprint drift'); return null; }
  const controls = operating.controls ?? {};
  for (const name of ['autonomy_budget','ai_eval_regression','agent_security_control_plane','knowledge_decay','service_level_objectives','disaster_recovery_drills','powerhouse_autonomy_scorecard']) if (!controls[name]) errors.push(`missing autonomy control: ${name}`);
  if (controls.autonomy_budget) { requireBoolean(controls.autonomy_budget.fail_closed, 'autonomy_budget.fail_closed', errors); requireNonEmptyArray(controls.autonomy_budget.required_dimensions, 'autonomy_budget.required_dimensions', errors); }
  if (controls.ai_eval_regression) { requireBoolean(controls.ai_eval_regression.require_baseline_comparison, 'ai_eval_regression.require_baseline_comparison', errors); requireNonEmptyArray(controls.ai_eval_regression.required_evidence, 'ai_eval_regression.required_evidence', errors); }
  if (controls.agent_security_control_plane) { requireBoolean(controls.agent_security_control_plane.least_privilege, 'agent_security_control_plane.least_privilege', errors); requireBoolean(controls.agent_security_control_plane.all_material_side_effects_traceable, 'agent_security_control_plane.all_material_side_effects_traceable', errors); }
  if (controls.knowledge_decay) requireBoolean(controls.knowledge_decay.require_revalidate_after, 'knowledge_decay.require_revalidate_after', errors);
  if (controls.service_level_objectives?.error_budget_policy !== 'fail-closed-on-exhaustion') errors.push('service_level_objectives.error_budget_policy drift');
  if (controls.disaster_recovery_drills) requireBoolean(controls.disaster_recovery_drills.require_restore_proof, 'disaster_recovery_drills.require_restore_proof', errors);
  if (controls.powerhouse_autonomy_scorecard) { requireBoolean(controls.powerhouse_autonomy_scorecard.no_single_magic_score, 'powerhouse_autonomy_scorecard.no_single_magic_score', errors); requireBoolean(controls.powerhouse_autonomy_scorecard.unknown_is_not_zero, 'powerhouse_autonomy_scorecard.unknown_is_not_zero', errors); }
  return operating.fingerprint;
}
function validateContinuousImprovement(contract, errors) {
  const improvement = contract.continuous_improvement;
  if (!improvement || improvement.fingerprint !== 'powerhouse-continuous-improvement-engine-v1') { errors.push('continuous improvement fingerprint drift'); return null; }
  const expectedLifecycle = ['OBSERVE','CLUSTER','CANDIDATE','BASELINE','EVALUATE','DECIDE','SHADOW_OR_CANARY','PROMOTE_OR_REJECT','PROD_OBSERVE','ROLLBACK_OR_CONFIRM','ATTRIBUTE','WRITEBACK','REVALIDATE'];
  if (JSON.stringify(improvement.lifecycle) !== JSON.stringify(expectedLifecycle)) errors.push('continuous improvement lifecycle drift');
  for (const key of ['dedupe_before_persist','conflict_arbitration','stable_identity']) requireBoolean(improvement.candidate?.[key], `continuous_improvement.candidate.${key}`, errors);
  for (const key of ['security_non_degradation','correctness_non_degradation','unknown_critical_fails_closed','no_single_magic_score','rollback_identity_required','compensated_tradeoff_requires_evidence','business_claim_requires_business_evidence']) requireBoolean(improvement.promotion?.[key], `continuous_improvement.promotion.${key}`, errors);
  requireBoolean(improvement.revalidation?.require_revalidate_after, 'continuous_improvement.revalidation.require_revalidate_after', errors);
  if (JSON.stringify(improvement.revalidation?.states) !== JSON.stringify(['CONFIRMED','CANDIDATE_REQUIRED','SUPERSEDED','BLOCKED_HARD_BOUNDARY'])) errors.push('continuous improvement revalidation states drift');
  requireBoolean(improvement.attribution?.causality_not_assumed, 'continuous_improvement.attribution.causality_not_assumed', errors);
  requireBoolean(improvement.attribution?.baseline_comparison_required, 'continuous_improvement.attribution.baseline_comparison_required', errors);
  return improvement.fingerprint;
}
function validateStatusPolicy(contract, errors) {
  const policy = contract.status_policy;
  if (!policy || policy.fingerprint !== 'powerhouse-live-until-proven-v1') { errors.push('status policy fingerprint drift'); return null; }
  if (JSON.stringify(policy.success_terminal_statuses) !== JSON.stringify(['LIVE & BEWEZEN'])) errors.push('LIVE & BEWEZEN must be the only successful terminal status');
  if (!policy.intermediate_statuses?.includes('DEELS LIVE')) errors.push('DEELS LIVE must remain explicitly intermediate');
  requireBoolean(policy.keep_working_on_intermediate, 'status_policy.keep_working_on_intermediate', errors);
  if (policy.blocked_status !== 'GEBLOKKEERD') errors.push('status_policy.blocked_status drift');
  requireBoolean(policy.blocked_requires_hard_boundary, 'status_policy.blocked_requires_hard_boundary', errors);
  requireBoolean(policy.blocked_requires_recovery_packet, 'status_policy.blocked_requires_recovery_packet', errors);
  requireBoolean(policy.blocked_requires_fix_agent_handoff, 'status_policy.blocked_requires_fix_agent_handoff', errors);
  const requiredFields = ['blocker','root_cause_or_best_evidence','evidence','attempted_repairs','safe_actions_remaining','minimum_human_action','fix_agent_handoff'];
  if (JSON.stringify(policy.recovery_packet_required_fields) !== JSON.stringify(requiredFields)) errors.push('status_policy recovery packet fields drift');
  requireBoolean(policy.fix_agent_handoff?.required, 'status_policy.fix_agent_handoff.required', errors);
  if (policy.fix_agent_handoff?.target_status !== 'LIVE & BEWEZEN') errors.push('status_policy fix-agent target drift');
  requireBoolean(policy.fix_agent_handoff?.carry_forward_context, 'status_policy.fix_agent_handoff.carry_forward_context', errors);
  requireNonEmptyArray(policy.fix_agent_handoff?.required_context, 'status_policy.fix_agent_handoff.required_context', errors);
  requireBoolean(policy.auto_resume_when_boundary_clears, 'status_policy.auto_resume_when_boundary_clears', errors);
  return policy.fingerprint;
}
async function validateCompletionSupervisor(contract, errors) {
  const supervisor = contract.completion_supervisor;
  if (!supervisor || supervisor.fingerprint !== 'powerhouse-completion-supervisor-v1') { errors.push('completion supervisor fingerprint drift'); return null; }
  if (supervisor.status !== 'active') errors.push('completion supervisor must be active');
  if (JSON.stringify(supervisor.success_terminal_states) !== JSON.stringify(['LIVE_VERIFIED'])) errors.push('completion supervisor success state drift');
  if (supervisor.waiting_state !== 'WAIT_EXTERNAL') errors.push('completion supervisor waiting state drift');
  if (supervisor.hard_boundary_can_complete !== false) errors.push('hard boundary may not complete work');
  if (supervisor.local_green_is_completion !== false) errors.push('local green may not complete work');
  requireBoolean(supervisor.auto_resume_same_work_item, 'completion_supervisor.auto_resume_same_work_item', errors);
  requireBoolean(supervisor.idempotent_backfill, 'completion_supervisor.idempotent_backfill', errors);
  if (!(await exists(supervisor.learning_source))) errors.push(`missing completion supervisor learning source: ${supervisor.learning_source}`);
  const requiredEvidence = ['CANDIDATE_TESTS','PROTECTED_DELIVERY','PRODUCTION_IDENTITY','FUNCTIONAL_READBACK','OBLIGATIONS_COMPLETE','CAPABILITY_HANDOFF','LEARNING_WRITEBACK'];
  if (JSON.stringify(supervisor.required_evidence) !== JSON.stringify(requiredEvidence)) errors.push('completion supervisor evidence contract drift');
  for (const relativePath of supervisor.required_paths ?? []) if (!(await exists(relativePath))) errors.push(`missing completion supervisor path: ${relativePath}`);
  return supervisor.fingerprint;
}
export async function validateEngineeringOS() {
  const [contract, fastProtocol] = await Promise.all([loadEngineeringContract(), loadFastDevelopmentProtocol()]);
  const errors = [];
  if (contract.fingerprint !== 'powerhouse-engineering-os-v1') errors.push('fingerprint drift');
  if (contract.delivery_contract !== 'BRAIN-DELIVERY-v2') errors.push('delivery contract drift');
  if (fastProtocol.fingerprint !== 'powerhouse-fast-development-protocol-v2') errors.push('fast development protocol fingerprint drift');
  if (fastProtocol.authority?.engineering_os !== 'config/powerhouse-engineering-os.json') errors.push('fast development protocol Engineering OS authority drift');
  if (fastProtocol.authority?.delivery !== 'config/brain-delivery-system.json') errors.push('fast development protocol delivery authority drift');
  if (fastProtocol.authority?.production_promotion !== 'BG169') errors.push('fast development protocol production authority drift');
  if (fastProtocol.creates_parallel_authority !== false) errors.push('fast development protocol may not create parallel authority');
  for (const principle of ['SHARED-LEARNING','TEAM-OF-AGENTS','BOUNDED-AUTONOMY','MEASURED-SELF-IMPROVEMENT']) if (!contract.principles?.includes(principle)) errors.push(`missing principle ${principle}`);
  const expectedGoldenPath = ['CONTEXT','SCOPE','PLAN','CHANGE','TEST','PREVIEW','VERIFY','PROMOTE','PROD_READBACK','WRITEBACK','LEARN','IMPROVE'];
  if (JSON.stringify(contract.golden_path) !== JSON.stringify(expectedGoldenPath)) errors.push('golden path drift');
  for (const [name, relativePath] of Object.entries(contract.canonical_authorities ?? {})) if (!(await exists(relativePath))) errors.push(`missing authority ${name}: ${relativePath}`);
  if (contract.shared_learning?.fingerprint !== 'powerhouse-shared-learning-architecture-evolution-v1') errors.push('shared learning fingerprint drift');
  if (contract.shared_learning?.preflight?.read_current_shared_context !== true) errors.push('shared context preflight drift');
  if (contract.shared_learning?.preflight?.read_explicit_required_evidence !== true) errors.push('explicit evidence preflight drift');
  if (contract.shared_learning?.dedupe_before_write !== true) errors.push('learning dedupe-before-write drift');
  if (contract.shared_learning?.separate_audit_from_current_projection !== true) errors.push('learning projection separation drift');
  if (contract.shared_learning?.refresh_after_new_verified_learning !== true) errors.push('shared context refresh drift');
  if (contract.shared_learning?.explicit_evidence_not_replaceable_by_shared_context !== true) errors.push('explicit evidence separation drift');
  if (contract.shared_learning?.reuse_known_fix_before_experiment !== true) errors.push('known fix reuse drift');
  for (const key of ['baseline','representative_eval','success_metric','compatibility','rollback_or_fallback','post_promotion_outcome']) if (contract.skill_evolution?.requires?.[key] !== true) errors.push(`skill ${key} gate drift`);
  for (const key of ['compare_to_current','measurable_improvement','migration_compatibility','security_privacy_cost_review','representative_tests_or_benchmarks','rollback_or_recovery','production_readback','system_map_and_decision_lineage_update']) if (contract.architecture_evolution?.requires?.[key] !== true) errors.push(`architecture ${key} drift`);
  const controlFingerprint = validateOperatingControls(contract, errors);
  const continuousImprovementFingerprint = validateContinuousImprovement(contract, errors);
  const statusPolicyFingerprint = validateStatusPolicy(contract, errors);
  const completionSupervisorFingerprint = await validateCompletionSupervisor(contract, errors);
  const developmentOS = await readFile(path.join(repoRoot, contract.canonical_authorities.development_os), 'utf8');
  if (!developmentOS.includes('BRAIN-DELIVERY-v2')) errors.push('development OS does not declare BRAIN-DELIVERY-v2');
  if (developmentOS.includes('BRAIN-DELIVERY-v1')) errors.push('stale BRAIN-DELIVERY-v1 remains in development OS');
  if (!developmentOS.includes('powerhouse-engineering-os-v1')) errors.push('development OS does not reference Engineering OS fingerprint');
  if (!developmentOS.includes('powerhouse-shared-learning-architecture-evolution-v1')) errors.push('development OS does not reference shared learning/evolution fingerprint');
  const continuousDoc = await readFile(path.join(repoRoot, contract.canonical_authorities.continuous_improvement_doc), 'utf8');
  if (!continuousDoc.includes('powerhouse-continuous-improvement-engine-v1')) errors.push('continuous improvement documentation fingerprint drift');
  if (!continuousDoc.includes('OBSERVE -> CLUSTER -> CANDIDATE')) errors.push('continuous improvement documentation lifecycle drift');
  const statusDoc = await readFile(path.join(repoRoot, contract.canonical_authorities.status_recovery_doc), 'utf8');
  if (!statusDoc.includes('powerhouse-live-until-proven-v1')) errors.push('status recovery documentation fingerprint drift');
  if (!statusDoc.includes('LIVE & BEWEZEN')) errors.push('status recovery documentation missing target status');
  if (!statusDoc.includes('fix-agent/chat')) errors.push('status recovery documentation missing fix-agent/chat handoff');
  const requiredCI = await readFile(path.join(repoRoot, contract.canonical_authorities.required_ci), 'utf8');
  if (!requiredCI.includes(contract.bootstrap.required_test)) errors.push('Engineering OS regression test is not wired into Required test');
  for (const testPath of ['tests/completion-supervisor.test.mjs','tests/completion-supervisor-backfill.test.mjs']) if (!requiredCI.includes(testPath)) errors.push(`Completion Supervisor regression is not wired into Required test: ${testPath}`);
  if (!requiredCI.includes('tests/brain-fast-development-protocol-v2.test.mjs')) errors.push('Fast Development Protocol v2 acceptance test is not wired into Required test');
  return { ok: errors.length === 0, fingerprint: contract.fingerprint, delivery_contract: contract.delivery_contract, fast_development_protocol_fingerprint: fastProtocol.fingerprint, shared_learning_fingerprint: contract.shared_learning?.fingerprint ?? null, control_fingerprint: controlFingerprint, continuous_improvement_fingerprint: continuousImprovementFingerprint, status_policy_fingerprint: statusPolicyFingerprint, completion_supervisor_fingerprint: completionSupervisorFingerprint, golden_path: contract.golden_path, errors };
}
async function main() {
  const mode = process.argv[2] ?? '--check';
  if (mode === '--packet') {
    const [contract, fastDevelopmentProtocol] = await Promise.all([loadEngineeringContract(), loadFastDevelopmentProtocol()]);
    const validation = await validateEngineeringOS();
    if (!validation.ok) { console.error(JSON.stringify({ status: 'ENGINEERING_OS_BLOCKED', ...validation }, null, 2)); process.exitCode = 1; return; }
    console.log(JSON.stringify({ status: 'ENGINEERING_OS_READY', contract, fast_development_protocol: fastDevelopmentProtocol }, null, 2));
    return;
  }
  if (mode !== '--check') { console.error('Usage: node scripts/brain/powerhouse-engineering-os.mjs [--check|--packet]'); process.exitCode = 2; return; }
  const validation = await validateEngineeringOS(); console.log(JSON.stringify({ status: validation.ok ? 'ENGINEERING_OS_READY' : 'ENGINEERING_OS_BLOCKED', ...validation }, null, 2)); if (!validation.ok) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
