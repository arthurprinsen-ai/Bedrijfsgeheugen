import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const policyPath = path.join(rootDir, 'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json');
const preflightPath = path.join(rootDir, 'scripts/brain/chat-learning-preflight.mjs');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const preflightSource = fs.readFileSync(preflightPath, 'utf8');

const REQUIRED_INVARIANTS = [
  'NO_AGENT_STARTS_BLIND',
  'NO_MATERIAL_ACTION_WITHOUT_PREFLIGHT_RECEIPT',
  'NO_MATERIAL_ACTION_WITHOUT_ACTIVITY_LEDGER',
  'NO_ERROR_WITHOUT_ROOT_CAUSE_OR_OPEN_ROOT_CAUSE_OBLIGATION',
  'NO_COMPLETION_WITHOUT_CANONICAL_WRITEBACK',
  'NO_COMPLETION_WITHOUT_SHARED_CONTEXT_REFRESH',
  'NO_COMPLETION_UNTIL_NEXT_AGENT_DISCOVERABILITY_IS_PROVEN',
  'CANONICAL_AUTHORITY_ID_FIRST',
  'SEARCH_MISS_IS_NOT_NONEXISTENCE',
  'EVERY_MATERIAL_SOURCE_HAS_PROVENANCE_FRESHNESS_CONFIDENCE_AND_SECURITY_CLASS',
  'SECRETS_AND_SENSITIVE_DATA_NEVER_ENTER_GENERAL_LEARNING_PAYLOADS',
  'ONE_COMPACT_CURRENT_STATE_PER_MATERIAL_SCOPE'
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

test('chat-learning preflight cannot silently omit universal learning/writeback policy', () => {
  const relativePolicyPath = 'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json';
  assert.match(preflightSource, new RegExp(relativePolicyPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const packet = compileChatLearningPreflight({ rootDir });
  const source = packet.sources.find(item => item.path === relativePolicyPath);
  assert.ok(source, 'universal learning/writeback policy missing from compiled preflight packet');
  assert.equal(source.fingerprint, policy.fingerprint);
  assert.ok(packet.fingerprints.includes(policy.fingerprint), 'policy fingerprint missing from preflight signals');
});
