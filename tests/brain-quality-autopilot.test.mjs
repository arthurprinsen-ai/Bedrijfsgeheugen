import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateQualityAutopilotContract } from '../scripts/brain/powerhouse-quality-intelligence.mjs';

const AUTOPILOT_PATH = 'config/powerhouse-quality-autopilot.json';

async function requiredModule(relativePath) {
  try { return await import(relativePath); }
  catch (error) { assert.fail(`required Quality Autopilot module missing: ${relativePath}: ${error.message}`); }
}

test('Quality Intelligence v2 registers and validates the Quality Autopilot maturity contract', () => {
  assert.equal(fs.existsSync(AUTOPILOT_PATH), true, `${AUTOPILOT_PATH} must exist`);
  const contract = JSON.parse(fs.readFileSync(AUTOPILOT_PATH, 'utf8'));
  assert.equal(contract.fingerprint, 'powerhouse-quality-autopilot-v2');
  assert.equal(contract.extends, 'powerhouse-quality-intelligence-v2');
  assert.equal(contract.release_authority, 'powerhouse-quality-intelligence-v1');
  assert.deepEqual(contract.green_states, ['GREEN']);
  for (const capability of ['deep_sensor_history','dynamic_surface_discovery','vulnerability_delta_gate','test_effectiveness_learning','business_invariant_shadow','escaped_defect_prevention_rate','performance_root_cause_attribution','safe_game_days','innovation_self_benchmarking']) assert.equal(contract.capabilities.includes(capability), true, `missing ${capability}`);
  assert.deepEqual(validateQualityAutopilotContract(contract), { ok: true, gaps: [] });
});

test('dynamic coverage discovery marks new and unproven surfaces fail-closed', async () => {
  const { discoverQualitySurfaces, buildDiscoveryObligations } = await requiredModule('../scripts/brain/quality/surface-discovery.mjs');
  const files = [
    { path: 'site/contact.html', content: '' },
    { path: 'src/client.mjs', content: "await supabase.rpc('score_company', { id })" },
    { path: 'supabase/functions/enrich-company/index.ts', content: 'export default {}' },
    { path: 'supabase/migrations/001.sql', content: 'create table if not exists public.accounts(id uuid); create policy tenant_accounts on public.accounts using (true);' },
    { path: 'openapi.yaml', content: 'paths:\n  /api/score:\n    post:\n      responses: {}' },
  ];
  const discovered = discoverQualitySurfaces({ files });
  for (const type of ['route','rpc','function','table','permission','api']) assert.equal(discovered.some(item => item.type === type), true, `missing discovered ${type}`);
  const obligations = buildDiscoveryObligations({ discovered, registeredSurfaces: [], evidence: [] });
  assert.equal(obligations.every(item => item.state === 'NOT_REGISTERED'), true);
  const registered = discovered.map(item => ({ id: item.id, required: true }));
  const untested = buildDiscoveryObligations({ discovered, registeredSurfaces: registered, evidence: [] });
  assert.equal(untested.every(item => item.state === 'UNTESTED'), true);
});

test('sensor history distinguishes installed, useful, flaky and critical tests without auto-removal', async () => {
  const { summarizeSensorHistory, classifyTestEffectiveness } = await requiredModule('../scripts/brain/quality/evidence-history.mjs');
  const summary = summarizeSensorHistory([], { sensorIds: ['zap'] });
  assert.equal(summary.sensors.zap.state, 'NOT_PROVEN');
  const flaky = classifyTestEffectiveness({ id: 'browser', history: [{ state: 'GREEN' }, { state: 'RED' }, { state: 'GREEN' }, { state: 'RED' }] });
  assert.equal(flaky.classification, 'FLAKY');
  assert.equal(flaky.auto_remove, false);
  const critical = classifyTestEffectiveness({ id: 'tenant-rls', critical: true, history: [] });
  assert.equal(critical.classification, 'PROTECTED_CRITICAL');
  assert.equal(critical.auto_remove, false);
});

test('new HIGH or CRITICAL vulnerabilities block against the reviewed baseline', async () => {
  const { evaluateVulnerabilityDelta } = await requiredModule('../scripts/brain/quality/vulnerability-delta.mjs');
  const result = evaluateVulnerabilityDelta({ baseline: { review_state: 'REVIEWED_POLICY', accepted_findings: [] }, current: [{ id: 'CVE-NEW', severity: 'HIGH', package: 'pkg', path: 'package-lock.json' }] });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.newBlocking.length, 1);
});

test('production business invariants and escaped-defect prevention are measurable', async () => {
  const { evaluateBusinessInvariants } = await requiredModule('../scripts/brain/quality/production-shadow.mjs');
  const { computeEscapedDefectPreventionRate } = await requiredModule('../scripts/brain/quality/escaped-defect-prevention.mjs');
  const good = evaluateBusinessInvariants({ action: 'a', provider: 'p', readback: 'r', outcome: 'o', learning: 'l', tenant_id: 't1', readback_tenant_id: 't1', idempotency_key: 'k1', duplicate_count: 1 });
  assert.equal(good.status, 'GREEN');
  const broken = evaluateBusinessInvariants({ action: 'a', provider: 'p', readback: null, outcome: 'o', learning: null, tenant_id: 't1', readback_tenant_id: 't2', idempotency_key: 'k1', duplicate_count: 2 });
  assert.equal(broken.status, 'RED');
  assert.equal(broken.violations.includes('tenant_integrity'), true);
  const metric = computeEscapedDefectPreventionRate({ escapedDefects: [{ id: 'd1' }, { id: 'd2' }], regressionEvidence: [{ defect_id: 'd1', catches_original_defect: true }] });
  assert.equal(metric.prevented_after_escape, 1);
  assert.equal(metric.total_escaped, 2);
  assert.equal(metric.rate, 0.5);
});

test('escaped defects create regression candidates that only promote after proof', async () => {
  const { createRegressionCandidate, evaluateRegressionCandidate } = await requiredModule('../scripts/brain/quality/regression-candidate.mjs');
  const candidate = createRegressionCandidate({ defect: { id: 'd1', fingerprint: 'fp1', surface_id: 'api:/score', evidence: 'prod-incident-1' } });
  assert.equal(candidate.state, 'CANDIDATE');
  assert.equal(candidate.learning_authority, 'BRAIN-CLOSED-LOOP-v1');
  assert.equal(evaluateRegressionCandidate(candidate, { catches_original_defect: false }).state, 'REJECTED');
  assert.equal(evaluateRegressionCandidate(candidate, { catches_original_defect: true, deterministic: true }).state, 'PROVEN_REGRESSION');
});

test('portfolio autopilot recommends action but never silently deletes tests', async () => {
  const { recommendPortfolioAction } = await requiredModule('../scripts/brain/quality/portfolio-autopilot.mjs');
  assert.equal(recommendPortfolioAction({ id: 'tenant', critical: true, classification: 'LOW_OBSERVED_YIELD' }).action, 'KEEP_PROTECTED');
  assert.equal(recommendPortfolioAction({ id: 'flaky', classification: 'FLAKY' }).action, 'REPAIR_FLAKE');
  const low = recommendPortfolioAction({ id: 'old', classification: 'LOW_OBSERVED_YIELD' });
  assert.equal(low.action, 'REVIEW_VALUE');
  assert.equal(low.auto_delete, false);
});

test('performance attribution is exact or UNKNOWN, never invented', async () => {
  const { attributePerformanceRegression } = await requiredModule('../scripts/brain/quality/performance-attribution.mjs');
  const exact = attributePerformanceRegression({ candidateSha: 'abc', route: '/portal', api: '/api/score', functionName: 'score_company', queryFingerprint: 'q1', dependency: 'postgres', baseline: 100, current: 180 });
  assert.equal(exact.status, 'ATTRIBUTED');
  assert.equal(exact.commit, 'abc');
  const unknown = attributePerformanceRegression({ candidateSha: 'abc', baseline: 100, current: 180 });
  assert.equal(unknown.status, 'UNKNOWN');
});

test('Game Days cover safe failure modes and reject destructive production targets', async () => {
  const { planSafeFaultScenario } = await requiredModule('../scripts/brain/quality/game-day.mjs');
  for (const fault of ['provider_outage','timeout','stale_data','duplicate_event','expired_token','partial_write']) assert.equal(planSafeFaultScenario({ fault, environment: 'staging' }).status, 'READY');
  assert.equal(planSafeFaultScenario({ fault: 'partial_write', environment: 'production', destructive: true }).status, 'REJECTED');
});

test('innovation self-benchmarking promotes only proven improvements', async () => {
  const { evaluateInnovationBenchmark } = await requiredModule('../scripts/brain/quality/innovation-benchmark.mjs');
  assert.equal(evaluateInnovationBenchmark({ incumbent: {}, candidate: {} }).decision, 'INSUFFICIENT_EVIDENCE');
  const result = evaluateInnovationBenchmark({ incumbent: { defect_yield: 0.4, false_positive_rate: 0.08, runtime_ms: 1000, cost: 1, reproducibility: 0.95, security_fit: true }, candidate: { defect_yield: 0.6, false_positive_rate: 0.05, runtime_ms: 900, cost: 1, reproducibility: 0.97, security_fit: true } });
  assert.equal(result.decision, 'ADOPT');
});
