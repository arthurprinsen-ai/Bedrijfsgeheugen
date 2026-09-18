import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const policyPath = path.join(rootDir, 'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json');
const continuityPolicyPath = path.join(rootDir, 'brain/policies/powerhouse-agent-continuity-v1.json');
const preflightPath = path.join(rootDir, 'scripts/brain/chat-learning-preflight.mjs');
const skillPath = path.join(rootDir, '.agents/skills/powerhouse-continuity/SKILL.md');
const agentsPath = path.join(rootDir, 'AGENTS.md');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const continuityPolicy = JSON.parse(fs.readFileSync(continuityPolicyPath, 'utf8'));
const preflightSource = fs.readFileSync(preflightPath, 'utf8');
const continuitySkillSource = fs.readFileSync(skillPath, 'utf8');
const agentsSource = fs.readFileSync(agentsPath, 'utf8');

const REQUIRED_INVARIANTS = [
  'NO_AGENT_STARTS_BLIND',
  'NO_MATERIAL_ACTION_WITHOUT_PREFLIGHT_RECEIPT',
  'NO_MATERIAL_ACTION_WITHOUT_ACTIVITY_LEDGER',
  'NO_ERROR_WITHOUT_ROOT_CAUSE_OR_OPEN_ROOT_CAUSE_OBLIGATION',
  'NO_FIX_WITHOUT_REGRESSION_OR_EXPLICIT_NOT_FEASIBLE_EVIDENCE',
  'NO_COMPLETION_WITHOUT_CANONICAL_WRITEBACK',
  'NO_COMPLETION_WITHOUT_SHARED_CONTEXT_REFRESH',
  'NO_COMPLETION_UNTIL_NEXT_AGENT_DISCOVERABILITY_IS_PROVEN',
  'NO_PARALLEL_MEMORY_TRUTH',
  'CURRENT_RUNTIME_TRUTH_OUTRANKS_STALE_CHAT_TEXT',
  'CANONICAL_AUTHORITY_ID_FIRST',
  'SEARCH_MISS_IS_NOT_NONEXISTENCE',
  'EVERY_MATERIAL_SOURCE_HAS_PROVENANCE_FRESHNESS_CONFIDENCE_AND_SECURITY_CLASS',
  'SECRETS_AND_SENSITIVE_DATA_NEVER_ENTER_GENERAL_LEARNING_PAYLOADS',
  'ONE_COMPACT_CURRENT_STATE_PER_MATERIAL_SCOPE',
  'NO_RECONFIRMATION_FOR_ALREADY_AUTHORIZED_POWERHOUSE_EXECUTION'
];

const EXPECTED_NOTION_AUTHORITIES = {
  workspace_id: '950da36a-ac8a-816b-ac6e-0003f91dfb3d',
  master_register_page_id: '3c3da36a-ac8a-81dd-a3fe-c4fc12bba5df',
  human_manual_page_id: '3dcda36a-ac8a-81ac-aad1-c88751e9e814',
  system_map_page_id: '3dcda36a-ac8a-8152-be3d-edbb32b06239'
};

test('universal learning/writeback contract remains active and fail-closed', () => {
  assert.equal(policy.status, 'ACTIVE');
  for (const invariant of REQUIRED_INVARIANTS) assert.ok(policy.invariants.includes(invariant), `missing invariant: ${invariant}`);
  assert.equal(policy.mandatory_preflight_receipt.required, true);
  assert.equal(policy.mandatory_activity_ledger.required, true);
  assert.equal(policy.mandatory_postflight_writeback.required, true);
  assert.equal(policy.next_agent_discoverability_gate.required, true);
  assert.equal(policy.terminal_status_gate.production_green_without_writeback, 'NOT_TERMINAL');
  assert.equal(policy.terminal_status_gate.deployment_without_learning, 'NOT_LIVE_BEWEZEN');
});

test('chats and agents are intrinsic execution nodes in one canonical Powerhouse loop', () => {
  const contract = continuityPolicy.loop_node_contract;
  assert.equal(continuityPolicy.status, 'ACTIVE');
  assert.equal(continuityPolicy.version, 'POWERHOUSE-AGENT-CONTINUITY-v1.3');
  assert.match(continuityPolicy.fingerprint, /intrinsic-loop-nodes/);
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
    'next_run_from_updated_canonical_state'
  ]);
  assert.ok(contract.forbidden_terminal_states.includes('CHAT_ENDED_WITHOUT_CANONICAL_WRITEBACK'));
  assert.ok(contract.forbidden_terminal_states.includes('AGENT_ENDED_WITHOUT_CANONICAL_WRITEBACK'));
  assert.ok(contract.forbidden_patterns.includes('isolated_chat_memory_as_authority'));
  assert.ok(contract.forbidden_patterns.includes('parallel_agent_brain_as_authority'));
});

test('already-authorized Powerhouse work proceeds without redundant confirmation loops', () => {
  const autonomy = policy.autonomous_execution_contract;
  assert.equal(autonomy.required, true);
  assert.equal(autonomy.default_for_existing_powerhouse_authority, 'EXECUTE_WITHOUT_RECONFIRMATION');
  assert.equal(autonomy.ask_again_for_continue_or_borging, 'FORBIDDEN');
  assert.equal(autonomy.stop_at_plan_for_confirmation, 'FORBIDDEN_WHEN_WITHIN_EXISTING_AUTHORITY');
  assert.equal(autonomy.execute_through_live_and_proven_where_technically_possible, true);
  assert.deepEqual(autonomy.allowed_confirmation_boundaries, [
    'EXTERNAL_PLATFORM_REQUIRES_EXPLICIT_USER_AUTHORIZATION',
    'IRREVERSIBLE_OR_HIGH_IMPACT_ACTION_OUTSIDE_EXISTING_AUTHORITY',
    'MATERIAL_NEW_BUSINESS_CHOICE_WITH_NO_CANONICAL_RULE_OR_SAFE_DEFAULT'
  ]);
});

test('canonical Notion authorities are fixed and retrieved id-first', () => {
  assert.deepEqual(policy.canonical_authorities.notion, EXPECTED_NOTION_AUTHORITIES);
  assert.equal(policy.canonical_authorities.discovery_order[0], 'DIRECT_ID_FETCH');
  assert.ok(policy.canonical_authorities.discovery_order.includes('BOUNDED_SEARCH_RECOVERY'));
  assert.equal(policy.canonical_authorities.search_miss_semantics, 'UNKNOWN_NOT_MISSING');
  assert.equal(policy.canonical_authorities.duplicate_creation_on_search_miss, 'FORBIDDEN');
});

test('all material data and evidence are normalized for fast secure learning', () => {
  const data = policy.data_and_evidence_contract;
  assert.equal(data.required, true);
  for (const field of ['source_id', 'source_type', 'authority', 'provenance', 'freshness', 'confidence', 'security_classification', 'retention_or_ttl', 'evidence_ref']) {
    assert.ok(data.required_metadata.includes(field), `missing evidence metadata: ${field}`);
  }
  assert.equal(data.internal_and_external_sources_must_be_registered, true);
  assert.equal(data.raw_secret_storage_in_learning, 'FORBIDDEN');
  assert.equal(data.sensitive_payload_default, 'REFERENCE_NOT_COPY');
});

test('current-state and incident records remain compact, complete and discoverable', () => {
  const state = policy.current_state_contract;
  assert.equal(state.required, true);
  assert.equal(state.one_record_per_material_scope, true);
  for (const field of ['what_is_live', 'what_is_being_changed', 'why', 'owner', 'last_verified_identity', 'open_obligations', 'known_errors', 'next_safe_action', 'updated_at']) {
    assert.ok(state.required_fields.includes(field), `missing current-state field: ${field}`);
  }
  const incidents = policy.incident_learning_contract;
  assert.equal(incidents.required, true);
  for (const field of ['fingerprint', 'symptom', 'impact', 'root_cause', 'failed_approaches', 'fix', 'tests', 'production_readback', 'prevention', 'regression', 'status']) {
    assert.ok(incidents.required_fields.includes(field), `missing incident field: ${field}`);
  }
});

test('chat-learning preflight cannot silently omit universal learning/writeback or continuity authority', () => {
  const relativePolicyPath = 'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json';
  const relativeContinuityPath = 'brain/policies/powerhouse-agent-continuity-v1.json';
  assert.match(preflightSource, new RegExp(relativePolicyPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(preflightSource, new RegExp(relativeContinuityPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const packet = compileChatLearningPreflight({ rootDir });
  const source = packet.sources.find(item => item.path === relativePolicyPath);
  const continuitySource = packet.sources.find(item => item.path === relativeContinuityPath);
  assert.ok(source, 'universal learning/writeback policy missing from compiled preflight packet');
  assert.ok(continuitySource, 'agent continuity policy missing from compiled preflight packet');
  assert.equal(source.fingerprint, policy.fingerprint);
  assert.equal(continuitySource.fingerprint, continuityPolicy.fingerprint);
  assert.ok(packet.fingerprints.includes(policy.fingerprint), 'policy fingerprint missing from preflight signals');
  assert.ok(packet.fingerprints.includes(continuityPolicy.fingerprint), 'continuity fingerprint missing from preflight signals');
});

test('unified data intelligence spine is inherited by every material agent and skill', () => {
  const spine = policy.data_and_evidence_contract.unified_data_spine;
  assert.equal(spine.fingerprint, 'powerhouse-unified-data-intelligence-spine-v1');
  assert.equal(spine.canonical_source_registry, 'public.powerhouse_evidence_sources');
  assert.equal(spine.canonical_observations, 'public.powerhouse_evidence_source_observations');
  assert.equal(spine.canonical_runtime_events, 'public.powerhouse_runtime_events');
  assert.equal(spine.health_readback, 'public.powerhouse_data_spine_health_v1');
  assert.equal(spine.reconciliation, 'public.powerhouse_data_spine_reconcile_v1');
  assert.equal(spine.watchdog, 'public.powerhouse_data_spine_watchdog_v1');
  for (const invariant of [
    'ALL_MATERIAL_DATA_SOURCES_USE_UNIFIED_ONE_BRAIN_EVIDENCE_SPINE',
    'CONNECTED_SOURCE_IS_NOT_PERSISTED_EVIDENCE',
    'SOURCE_GREEN_REQUIRES_FRESH_OBSERVED_READBACK',
    'TRANSPORT_METADATA_NEVER_REPLACES_PLATFORM_TRUTH'
  ]) assert.ok(policy.invariants.includes(invariant), `missing data-spine invariant: ${invariant}`);
});


test('terminal claims require a fresh complete proof bundle', () => {
  const proof = policy.terminal_claim_proof_contract;
  assert.equal(proof.required, true);
  assert.deepEqual(proof.applies_to_actor_kinds.slice(0,2), ['chat','agent']);
  for (const claim of ['LIVE_PROVEN','LIVE & BEWEZEN','PRODUCTION_GREEN','FULFILLED']) {
    assert.ok(proof.terminal_claims.includes(claim), `missing terminal claim: ${claim}`);
  }
  for (const field of [
    'proof_bundle_id','obligation_id','run_id','candidate_identity','exact_head_or_artifact_digest',
    'required_gates','protected_promotion','production_mutation_refs','production_readback_refs',
    'outcome_or_value_refs','learning_writeback_refs','prevention_writeback_refs','authorities_queried','verified_at'
  ]) assert.ok(proof.proof_bundle_required_fields.includes(field), `missing proof field: ${field}`);
  assert.equal(proof.stale_claim_rule, 'CURRENT_AUTHORITY_READBACK_OVERRIDES_ALL_EARLIER_CHAT_OR_AGENT_STATUS_TEXT');
  assert.ok(policy.invariants.includes('NO_LIVE_PROVEN_CLAIM_WITHOUT_VERIFIABLE_PROOF_BUNDLE'));
  assert.ok(policy.invariants.includes('PROOF_STATUS_MUST_BE_REFRESHED_FROM_CURRENT_AUTHORITIES'));
  assert.ok(policy.mandatory_activity_ledger.minimum_events.includes('TERMINAL_CLAIM_PROOF'));
  assert.ok(policy.terminal_status_gate.live_and_proven_requires.includes('terminal_claim_proof_bundle_current_and_complete'));
});

test('absence of a production write cannot be inferred from CI or PR state', () => {
  const proof = policy.terminal_claim_proof_contract;
  assert.ok(policy.invariants.includes('NO_PRODUCTION_WRITE_ABSENCE_CLAIM_FROM_CI_ONLY'));
  assert.ok(proof.rules.some(rule => rule.includes('no production write occurred') && rule.includes('direct production/provider')));
  assert.equal(policy.terminal_status_gate.ci_or_open_pr_without_production_authority_readback, 'NOT_PROOF_OF_NO_PRODUCTION_WRITE');
  assert.equal(policy.terminal_status_gate.stale_exact_head_evidence, 'SUPERSEDED_FOR_ACTIVE_CANDIDATE');
  assert.ok(proof.non_terminal_statuses.includes('PRODUCTION_WRITE_NOT_VERIFIED'));
});


test('Powerhouse continuity skill is discoverable and mirrors canonical loop-node authority', () => {
  assert.match(continuitySkillSource, /^---[\s\S]*name:\s*powerhouse-continuity[\s\S]*description:\s*Use when/m);
  assert.match(continuitySkillSource, /CURRENT_STATE_BEFORE_WORK/);
  assert.match(continuitySkillSource, /REUSE_BEFORE_BUILD/);
  assert.match(continuitySkillSource, /NO_AGENT_STARTS_FROM_SCRATCH/);
  assert.match(continuitySkillSource, /canonical writeback/i);
  assert.match(continuitySkillSource, /LIVE & BEWEZEN/);
  assert.match(continuitySkillSource, /brain\/policies\/powerhouse-agent-continuity-v1\.json/);
  assert.match(continuitySkillSource, /brain\/learning\/chat-agent-intrinsic-loop-node-2026-09-18\.json/);
  assert.match(agentsSource, /\.agents\/skills\/powerhouse-continuity\/SKILL\.md/);
});

test('material skills are canonical execution capabilities with mandatory writeback', () => {
  const skill = policy.skill_execution_contract;
  assert.equal(skill.required, true);
  assert.equal(skill.actor_kind, 'skill');
  assert.equal(skill.role, 'CANONICAL_EXECUTION_CAPABILITY');
  assert.equal(skill.existing_state_preflight_required, true);
  assert.equal(skill.activity_ledger_required, true);
  assert.equal(skill.documentation_writeback_required, true);
  assert.equal(skill.learning_writeback_required, true);
  assert.equal(skill.next_agent_discoverability_required, true);
  assert.ok(policy.invariants.includes('NO_MATERIAL_SKILL_EXECUTION_OUTSIDE_CANONICAL_LOOP'));
  assert.match(policy.scope,/skills/);
});


test('continuity skill locks fast delivery incident prevention', () => {
  for (const marker of [
    'Parallelize independent specialist work',
    'Writer-Lease-Head',
    'only the newest attempt is authoritative',
    'classifier co-change',
    'full current-main union from the merge-base',
    'Supabase migrations',
    'PR number is transport metadata',
    'protected merge is not enough'
  ]) assert.ok(continuitySkillSource.toLowerCase().includes(marker.toLowerCase()), `missing continuity marker: ${marker}`);
});


test('continuity skill retains predictive LinkedIn sales cockpit learning', () => {
  for (const marker of [
    'linkedin-sales-cockpit-predictive-sales-os-v1',
    'sales decision surface, not passive reporting dashboard',
    'generic LinkedIn feed',
    'no-auto-send',
    'exact production deploy/readback identity'
  ]) assert.ok(continuitySkillSource.toLowerCase().includes(marker.toLowerCase()), `missing LinkedIn sales cockpit skill marker: ${marker}`);
  const salesSkill = fs.readFileSync(new URL('../docs/superpowers/skills/linkedin-sales-cockpit-predictive-v2.md', import.meta.url), 'utf8');
  assert.match(salesSkill, /LIVE_PROVEN/);
  assert.match(salesSkill, /54ab849124e4d9d9bde498e998c50d8865c9712c/);
  assert.match(salesSkill, /6aad09ac00d5f50008121b25/);
});
