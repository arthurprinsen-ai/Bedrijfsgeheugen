import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const flow = ['INTENT','EXECUTION_PACKET_V2','NO_OP_DEDUP','IMPACT_GRAPH','EXECUTION_DAG','TARGETED_TESTS','CANDIDATE','FULL_RELEASE_GATES','EXACT_SHA_PROD_READBACK','DELTA_WRITEBACK'];

test('Fast Development Protocol v2 preserves canonical authorities and flow', async () => {
  const policy = JSON.parse(await readFile(new URL('../config/powerhouse-fast-development-protocol-v2.json', import.meta.url), 'utf8'));
  assert.equal(policy.fingerprint, 'powerhouse-fast-development-protocol-v2');
  assert.deepEqual(policy.canonical_flow, flow);
  assert.deepEqual(policy.execution_classes, ['FAST','STANDARD','CRITICAL','WAITING_EXTERNAL']);
  assert.equal(policy.preflight.no_op_before_reasoning, true);
  assert.equal(policy.testing.impact_based_during_development, true);
  assert.equal(policy.testing.full_release_gates_at_promotion_boundary, true);
  assert.equal(policy.testing.fast_path_never_replaces_release_gates, true);
  assert.equal(policy.execution.parallel_by_default, true);
  assert.equal(policy.evidence_cache.persistent_semantics, true);
  assert.equal(policy.evidence_cache.persistence_authority, 'brain_outcome_obligation_evidence');
  assert.equal(policy.evidence_cache.persistence_adapter, 'PersistentEvidenceCache');
  assert.equal(policy.evidence_cache.append_only_invalidation, true);
  assert.equal(policy.evidence_cache.non_cacheable.includes('EXACT_SHA_PROD_READBACK'), true);
  assert.equal(policy.writeback.mode, 'DELTA_ONLY');
  assert.equal(policy.authority.production_promotion, 'BG169');
  assert.equal(policy.authority.delivery, 'config/brain-delivery-system.json');
  assert.equal(policy.authority.success, 'LIVE & BEWEZEN');
  assert.equal(policy.creates_parallel_authority, false);
});

test('Engineering OS packet discovers the fast protocol without replacing Engineering OS authority', () => {
  const packet = JSON.parse(execFileSync(process.execPath, ['scripts/brain/powerhouse-engineering-os.mjs', '--packet'], { encoding: 'utf8' }));
  assert.equal(packet.status, 'ENGINEERING_OS_READY');
  assert.equal(packet.contract.fingerprint, 'powerhouse-engineering-os-v1');
  assert.equal(packet.fast_development_protocol.fingerprint, 'powerhouse-fast-development-protocol-v2');
  assert.deepEqual(packet.fast_development_protocol.canonical_flow, flow);
});

test('executable protocol validator proves integration without creating new authority', () => {
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/brain/powerhouse-fast-development-protocol-v2.mjs', '--check'], { encoding: 'utf8' }));
  assert.equal(result.status, 'FAST_DEVELOPMENT_PROTOCOL_READY');
  assert.equal(result.fingerprint, 'powerhouse-fast-development-protocol-v2');
  assert.equal(result.engineering_os, 'powerhouse-engineering-os-v1');
  assert.equal(result.delivery, 'BRAIN-DELIVERY-v2');
  assert.equal(result.production_promotion, 'BG169');
  assert.equal(result.proof_cache_authority, 'brain_outcome_obligation_evidence');
  assert.equal(result.production_readback_cacheable, false);
});

test('Required test executes the v2 acceptance contract', async () => {
  const workflow = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(workflow, /tests\/brain-fast-development-protocol-v2\.test\.mjs/);
  assert.match(workflow, /powerhouse-fast-development-protocol-v2\.mjs --check/);
});

test('approved human design documents the incremental fast path and heavy promotion boundary', async () => {
  const doc = await readFile(new URL('../docs/superpowers/specs/2026-09-17-powerhouse-fast-development-protocol-v2-design.md', import.meta.url), 'utf8');
  assert.match(doc, /Execution Packet v2/);
  assert.match(doc, /EXECUTION_PACKET_V2/);
  assert.match(doc, /FULL_RELEASE_GATES/);
  assert.match(doc, /EXACT_SHA_PROD_READBACK/);
  assert.match(doc, /Delta writeback/i);
  assert.match(doc, /BRAIN-DELIVERY-v2/);
  assert.match(doc, /BG169/);
});
