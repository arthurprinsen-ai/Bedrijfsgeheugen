import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED = new Set(['provider_outage', 'timeout', 'stale_data', 'duplicate_event', 'expired_token', 'partial_write']);

export function planSafeFaultScenario({ fault, environment = 'staging', destructive = false } = {}) {
  if (!ALLOWED.has(fault)) return { status: 'REJECTED', reason: 'unsupported_fault' };
  if (environment === 'production' && destructive) return { status: 'REJECTED', reason: 'destructive_production_fault_injection_forbidden' };
  return {
    status: 'READY',
    fault,
    environment,
    mode: environment === 'production' ? 'synthetic_non_destructive_shadow' : 'isolated_fault_injection',
    requires_cleanup: environment !== 'production',
    production_destructive: false,
  };
}

export function simulateFaultScenario({ fault, environment = 'staging' } = {}) {
  const plan = planSafeFaultScenario({ fault, environment, destructive: false });
  if (plan.status !== 'READY') return { ...plan, detected: false, recovered: false };
  const expected = {
    provider_outage: { signal: 'provider_unavailable', recovery: 'retry_or_fallback' },
    timeout: { signal: 'deadline_exceeded', recovery: 'bounded_retry' },
    stale_data: { signal: 'freshness_violation', recovery: 'refresh_or_hold' },
    duplicate_event: { signal: 'idempotency_violation', recovery: 'dedupe' },
    expired_token: { signal: 'authentication_expired', recovery: 'reauth_or_hold' },
    partial_write: { signal: 'atomicity_violation', recovery: 'rollback_or_reconcile' },
  }[fault];
  return {
    ...plan,
    detected: Boolean(expected?.signal),
    detection_signal: expected?.signal || null,
    recovered: Boolean(expected?.recovery),
    recovery_contract: expected?.recovery || null,
    real_external_fault_injected: false,
    external_runtime_obligation: 'staging/provider adapter required before real external injection may be called proven',
  };
}

function main() {
  const environment = process.env.QUALITY_GAME_DAY_ENV || 'staging';
  const outputPath = process.env.QUALITY_GAME_DAY_OUTPUT || 'artifacts/quality/game-days/report.json';
  const scenarios = [...ALLOWED].map(fault => simulateFaultScenario({ fault, environment }));
  const status = scenarios.every(item => item.status === 'READY' && item.detected && item.recovered) ? 'GREEN_SIMULATION' : 'RED';
  const report = { fingerprint: 'powerhouse-quality-game-day-evidence-v1', candidate_sha: process.env.GITHUB_SHA || null, environment, status, scenarios };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (status === 'RED') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
