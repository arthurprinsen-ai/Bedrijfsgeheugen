import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

export async function validateFastDevelopmentProtocolV2() {
  const [policy, engineeringOS, delivery, fabric] = await Promise.all([
    readJson('config/powerhouse-fast-development-protocol-v2.json'),
    readJson('config/powerhouse-engineering-os.json'),
    readJson('config/brain-delivery-system.json'),
    readJson('config/powerhouse-parallel-engineering-fabric.json')
  ]);

  const errors = [];
  const expectedFlow = ['INTENT','EXECUTION_PACKET_V2','NO_OP_DEDUP','IMPACT_GRAPH','EXECUTION_DAG','TARGETED_TESTS','CANDIDATE','FULL_RELEASE_GATES','EXACT_SHA_PROD_READBACK','DELTA_WRITEBACK'];
  const expectedClasses = ['FAST','STANDARD','CRITICAL','WAITING_EXTERNAL'];

  if (policy.fingerprint !== 'powerhouse-fast-development-protocol-v2') errors.push('protocol fingerprint drift');
  if (JSON.stringify(policy.canonical_flow) !== JSON.stringify(expectedFlow)) errors.push('canonical flow drift');
  if (JSON.stringify(policy.execution_classes) !== JSON.stringify(expectedClasses)) errors.push('execution class drift');
  if (policy.creates_parallel_authority !== false) errors.push('parallel authority must remain false');
  if (policy.preflight?.no_op_before_reasoning !== true) errors.push('no-op gate must precede reasoning');
  if (policy.preflight?.delta_context !== true) errors.push('delta context must be enabled');
  if (policy.testing?.impact_based_during_development !== true) errors.push('impact based development testing must be enabled');
  if (policy.testing?.full_release_gates_at_promotion_boundary !== true) errors.push('full release boundary must remain enabled');
  if (policy.testing?.fast_path_never_replaces_release_gates !== true) errors.push('fast path may not replace release gates');
  if (policy.execution?.parallel_by_default !== true) errors.push('parallel-by-default drift');
  if (!policy.evidence_cache?.non_cacheable?.includes('EXACT_SHA_PROD_READBACK')) errors.push('production readback must be non-cacheable');
  if (policy.writeback?.mode !== 'DELTA_ONLY') errors.push('writeback must be delta only');
  if (policy.telemetry?.is_release_authority !== false) errors.push('telemetry may not become release authority');

  if (engineeringOS.fingerprint !== 'powerhouse-engineering-os-v1') errors.push('engineering OS authority drift');
  if (engineeringOS.delivery_contract !== 'BRAIN-DELIVERY-v2') errors.push('engineering OS delivery contract drift');
  if (policy.authority?.engineering_os !== 'config/powerhouse-engineering-os.json') errors.push('engineering OS reference drift');
  if (policy.authority?.delivery !== 'config/brain-delivery-system.json') errors.push('delivery authority reference drift');
  if (policy.authority?.production_promotion !== 'BG169') errors.push('production promotion authority drift');
  if (policy.authority?.shared_context !== 'BG167') errors.push('shared context authority drift');
  if (policy.authority?.writeback !== 'BG168/BG166') errors.push('writeback authority drift');
  if (policy.authority?.success !== 'LIVE & BEWEZEN') errors.push('success status drift');
  if (delivery.fingerprint !== 'BRAIN-DELIVERY-v2') errors.push('BRAIN-DELIVERY-v2 authority drift');
  if (fabric.protocol_extension !== 'powerhouse-fast-development-protocol-v2') errors.push('parallel fabric extension drift');
  if (fabric.authority?.production_promotion !== 'BG169') errors.push('fabric promotion authority drift');
  if (fabric.cache?.never_skips_production_readback !== true) errors.push('fabric cache could skip production readback');

  return {
    ok: errors.length === 0,
    fingerprint: policy.fingerprint,
    engineering_os: engineeringOS.fingerprint,
    delivery: engineeringOS.delivery_contract,
    production_promotion: policy.authority?.production_promotion ?? null,
    production_readback_cacheable: !policy.evidence_cache?.non_cacheable?.includes('EXACT_SHA_PROD_READBACK'),
    errors
  };
}

async function main() {
  const mode = process.argv[2] ?? '--check';
  if (mode !== '--check') {
    console.error('Usage: node scripts/brain/powerhouse-fast-development-protocol-v2.mjs --check');
    process.exitCode = 2;
    return;
  }
  const result = await validateFastDevelopmentProtocolV2();
  console.log(JSON.stringify({ status: result.ok ? 'FAST_DEVELOPMENT_PROTOCOL_READY' : 'FAST_DEVELOPMENT_PROTOCOL_BLOCKED', ...result }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
