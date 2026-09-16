import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAutonomousImprovementPacket, FINGERPRINT } from './autonomous-runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

async function loadContract() {
  return JSON.parse(await readFile(path.join(repoRoot, 'config', 'powerhouse-autonomous-improvement-runtime.json'), 'utf8'));
}

export async function validateAutonomousImprovementRuntime() {
  const contract = await loadContract();
  const errors = [];
  if (contract.fingerprint !== FINGERPRINT) errors.push('runtime fingerprint drift');
  if (contract.extends !== 'powerhouse-continuous-improvement-engine-v1') errors.push('runtime parent authority drift');
  const required = ['periodic_orchestration','architecture_fitness','capability_graph_projection','champion_challenger','causal_learning','digital_twin_replay','failure_injection','automatic_simplification','business_value_feedback'];
  for (const key of required) if (contract.capabilities?.[key] !== true) errors.push(`missing runtime capability: ${key}`);
  for (const key of ['security_non_degradation','correctness_non_degradation','tenant_isolation_non_degradation','unknown_critical_fails_closed','causality_not_assumed','no_single_magic_score','rollback_required_before_promotion','business_value_requires_observed_outcome']) {
    if (contract.gates?.[key] !== true) errors.push(`runtime gate drift: ${key}`);
  }
  if (contract.gates?.destructive_simplification_auto_delete !== false) errors.push('destructive simplification must remain disabled');
  if (contract.scheduler?.workflow !== '.github/workflows/business-os-intelligence.yml') errors.push('scheduler integration drift');
  if (contract.scheduler?.cadence !== 'daily') errors.push('scheduler cadence drift');
  if (contract.scheduler?.read_only_without_writer_credentials !== true) errors.push('scheduler must remain read-only without writer credentials');
  if (contract.writeback?.new_store !== false) errors.push('runtime may not create a new writeback store');
  return { ok: errors.length === 0, fingerprint: contract.fingerprint, errors };
}

function buildReadOnlyProbe({ sourceSha }) {
  return buildAutonomousImprovementPacket({
    sourceSha,
    observedAt: new Date().toISOString(),
    evidence: ['runtime-contract-probe'],
    fitness: {
      baseline: { reliability: 99.9, latency_ms: 100, cost_per_outcome: 10 },
      current: { reliability: 99.9, latency_ms: 100, cost_per_outcome: 10 },
      lowerIsBetter: ['latency_ms','cost_per_outcome']
    },
    capabilityGraph: {
      capabilities: [{ id: 'continuous-improvement', provides: ['improve'], tests: ['brain-autonomous-improvement-runtime.test.mjs'], status: 'active' }],
      requirements: ['improve']
    },
    experimentPortfolio: {
      champion: { id: 'current', observations: 30, metrics: { quality: 1 } },
      challengers: [],
      primaryMetric: 'quality',
      minimumObservations: 30
    },
    causalEvidence: {},
    simplification: {},
    valueFeedback: { candidates: [] }
  });
}

async function main() {
  const validation = await validateAutonomousImprovementRuntime();
  if (!validation.ok) {
    process.stdout.write(`${JSON.stringify({ status: 'AUTONOMOUS_IMPROVEMENT_BLOCKED', ...validation }, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }
  const sourceSha = process.env.GITHUB_SHA || process.env.SOURCE_SHA || 'local';
  const packet = buildReadOnlyProbe({ sourceSha });
  process.stdout.write(`${JSON.stringify({ status: 'AUTONOMOUS_IMPROVEMENT_READY', validation, packet, writeback: 'not attempted by read-only scheduler probe' }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
