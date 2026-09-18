import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const agents=fs.readFileSync('AGENTS.md','utf8');
const chat=JSON.parse(fs.readFileSync('config/brain-chat-learning-contract.json','utf8'));
const policy=JSON.parse(fs.readFileSync('brain/policies/powerhouse-universal-agent-learning-writeback-v1.json','utf8'));
const learning=JSON.parse(fs.readFileSync('brain/learning/2026-09-18-powerhouse-unified-data-intelligence-spine-v1.json','utf8'));

test('agents and skills inherit the unified One Brain data spine',()=>{
  assert.match(agents,/Unified Data Intelligence Spine — mandatory skill\/agent inheritance/);
  assert.match(agents,/powerhouse-unified-data-intelligence-spine-v1/);
  assert.match(agents,/powerhouse_data_spine_health_v1/);
  assert.match(agents,/LinkedIn\/Instagram native\/platform truth/);
});

test('chat learning preflight always loads the data-spine learning',()=>{
  assert.ok(chat.canonicalSources.includes('brain/learning/2026-09-18-powerhouse-unified-data-intelligence-spine-v1.json'));
  assert.equal(chat.policy.requireUnifiedDataSpineForMaterialDataSources,true);
  assert.equal(chat.policy.connectedSourceIsNotPersistedEvidence,true);
  assert.equal(chat.policy.failClosedOnMissingOrStaleSourceEvidence,true);
});

test('universal agent writeback contract enforces source evidence and freshness',()=>{
  for(const invariant of [
    'ALL_MATERIAL_DATA_SOURCES_USE_UNIFIED_ONE_BRAIN_EVIDENCE_SPINE',
    'CONNECTED_SOURCE_IS_NOT_PERSISTED_EVIDENCE',
    'SOURCE_GREEN_REQUIRES_FRESH_OBSERVED_READBACK',
    'TRANSPORT_METADATA_NEVER_REPLACES_PLATFORM_TRUTH'
  ]) assert.ok(policy.invariants.includes(invariant));
  assert.equal(policy.data_and_evidence_contract.unified_data_spine.fingerprint,'powerhouse-unified-data-intelligence-spine-v1');
  assert.equal(policy.data_and_evidence_contract.unified_data_spine.health_readback,'public.powerhouse_data_spine_health_v1');
});

test('learning record is active prevention and names canonical authorities',()=>{
  assert.equal(learning.status,'ACTIVE_PREVENTION');
  assert.equal(learning.fingerprint,'powerhouse-unified-data-intelligence-spine-v1');
  assert.equal(learning.canonical_authorities.evidence,'public.powerhouse_evidence_source_observations');
  assert.equal(learning.canonical_authorities.runtime,'public.powerhouse_runtime_events');
  assert.ok(learning.covered_sources.includes('dataforseo-intelligence'));
  assert.ok(learning.covered_sources.includes('portal-state'));
});
