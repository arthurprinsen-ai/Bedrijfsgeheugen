import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAutonomousImprovementPacket, FINGERPRINT } from './autonomous-runtime.mjs';
import { consumeBacklog } from './backlog-intake.mjs';
import { resolveRuntimeBacklog } from './github-backlog-source.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

async function loadContract() {
  return loadJson(path.join('config', 'powerhouse-autonomous-improvement-runtime.json'));
}

async function loadBacklog() {
  return loadJson(path.join('config', 'powerhouse-autonomous-backlog.json'));
}

export async function validateAutonomousImprovementRuntime() {
  const contract = await loadContract();
  const errors = [];
  if (contract.fingerprint !== FINGERPRINT) errors.push('runtime fingerprint drift');
  if (contract.extends !== 'powerhouse-continuous-improvement-engine-v1') errors.push('runtime parent authority drift');
  const required = ['periodic_orchestration','architecture_fitness','capability_graph_projection','backlog_intake','stale_obligation_reconciliation','dependency_currency_intake','historical_delta_classification','champion_challenger','causal_learning','digital_twin_replay','failure_injection','automatic_simplification','business_value_feedback'];
  for (const key of required) if (contract.capabilities?.[key] !== true) errors.push(`missing runtime capability: ${key}`);
  for (const key of ['security_non_degradation','correctness_non_degradation','tenant_isolation_non_degradation','unknown_critical_fails_closed','causality_not_assumed','no_single_magic_score','rollback_required_before_promotion','business_value_requires_observed_outcome']) {
    if (contract.gates?.[key] !== true) errors.push(`runtime gate drift: ${key}`);
  }
  if (contract.gates?.destructive_simplification_auto_delete !== false) errors.push('destructive simplification must remain disabled');
  if (contract.backlog_intake?.classification_authority !== 'powerhouse-continuous-improvement-engine-v1') errors.push('backlog classifier authority drift');
  if (contract.backlog_intake?.destructive_execution_allowed !== false) errors.push('backlog destructive execution must remain disabled');
  if (contract.backlog_intake?.unknown_identity_fails_closed !== true) errors.push('unknown backlog identity must fail closed');

  if (contract.scheduler?.production_authority !== 'Supabase pg_cron') errors.push('production scheduler authority drift');
  if (contract.scheduler?.production_job !== 'powerhouse-autonomous-improvement-cycle-v1') errors.push('production scheduler job drift');
  if (contract.scheduler?.production_function !== 'public.powerhouse_autonomous_improvement_cycle_v1(now())') errors.push('production scheduler function drift');
  if (contract.scheduler?.cadence !== 'hourly at minute 42') errors.push('production scheduler cadence drift');
  if (contract.scheduler?.probe_workflow !== '.github/workflows/business-os-intelligence.yml') errors.push('probe workflow integration drift');
  if (contract.scheduler?.probe_read_only !== true) errors.push('GitHub probe must remain read-only');
  if (contract.scheduler?.idempotent_run_identity !== true) errors.push('production scheduler must retain idempotent identity');

  if (contract.writeback?.new_store !== false) errors.push('runtime may not create a new writeback store');
  if (contract.writeback?.route !== 'public.brain_append_record -> existing public.brain_records') errors.push('canonical writeback route drift');
  if (contract.writeback?.tenant !== 'canonical') errors.push('canonical writeback tenant drift');
  return { ok: errors.length === 0, fingerprint: contract.fingerprint, errors };
}

function buildReadOnlyProbe({ sourceSha, backlog }) {
  const backlogResult = consumeBacklog({
    items: backlog.items ?? [],
    activeCandidates: backlog.active_candidates ?? [],
    now: new Date().toISOString()
  });
  const packet = buildAutonomousImprovementPacket({
    sourceSha,
    observedAt: new Date().toISOString(),
    evidence: ['runtime-contract-probe', backlog.fingerprint ?? 'backlog-unknown', backlog.source_state?.mode ?? 'unknown-source-mode'],
    fitness: {
      baseline: { reliability: 99.9, latency_ms: 100, cost_per_outcome: 10 },
      current: { reliability: 99.9, latency_ms: 100, cost_per_outcome: 10 },
      lowerIsBetter: ['latency_ms','cost_per_outcome']
    },
    capabilityGraph: {
      capabilities: [{ id: 'continuous-improvement', provides: ['improve'], tests: ['brain-autonomous-improvement-runtime.test.mjs','brain-autonomous-backlog-intake.test.mjs','brain-github-backlog-source.test.mjs'], status: 'active' }],
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
  return { ...packet, backlog: backlogResult, backlog_source: backlog.source_state ?? null };
}

async function main() {
  const validation = await validateAutonomousImprovementRuntime();
  if (!validation.ok) {
    process.stdout.write(`${JSON.stringify({ status: 'AUTONOMOUS_IMPROVEMENT_BLOCKED', ...validation }, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }
  const sourceSha = process.env.GITHUB_SHA || process.env.SOURCE_SHA || 'local';
  const registry = await loadBacklog();
  const backlog = await resolveRuntimeBacklog(registry);
  const packet = buildReadOnlyProbe({ sourceSha, backlog });
  process.stdout.write(`${JSON.stringify({
    status: 'AUTONOMOUS_IMPROVEMENT_READY',
    validation,
    packet,
    backlog_summary: {
      source: packet.backlog_source,
      total: packet.backlog.results.length,
      counts: packet.backlog.counts,
      executable: packet.backlog.executable.map(item => item.id),
      held: packet.backlog.held.map(item => item.id)
    },
    production: {
      scheduler_authority: 'Supabase pg_cron',
      job: 'powerhouse-autonomous-improvement-cycle-v1',
      writeback: 'public.brain_append_record -> existing public.brain_records'
    },
    writeback: 'not attempted by GitHub read-only probe'
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
