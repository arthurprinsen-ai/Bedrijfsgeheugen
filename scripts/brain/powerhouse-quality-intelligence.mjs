import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FINGERPRINT = 'powerhouse-quality-intelligence-v1';
export const V2_FINGERPRINT = 'powerhouse-quality-intelligence-v2';
export const AUTOPILOT_FINGERPRINT = 'powerhouse-quality-autopilot-v2';
const FRONTEND_REQUIRED = ['functional','visual','geometry','responsive','cross_browser','accessibility','runtime','network','performance','content_baseline'];
const BACKEND_REQUIRED = ['functional','property','api_contract','integration','performance','security','supply_chain','misconfiguration','resilience','data_integrity'];
const LEARNING_REQUIRED = ['fingerprint','rootCause','regressionTest','preventionRule','evidence','learning_writeback','shared_context_refresh'];
const ADOPTION_REQUIRED = ['discover','dedupe','applicability','security_cost_review','isolated_benchmark','false_positive_check','detection_delta','speed_delta','experiment_result','explicit_adoption'];
const V2_CAPABILITIES = ['coverage_intelligence','autonomous_exploratory_testing','semantic_visual_intelligence','stateful_fuzz_chaos_testing','production_shadow_verification','performance_root_cause_intelligence','security_adversarial_matrix','build_provenance_sbom','test_the_tests_intelligence','quality_economics'];
const AUTOPILOT_CAPABILITIES = ['deep_sensor_history','dynamic_surface_discovery','vulnerability_delta_gate','test_effectiveness_learning','business_invariant_shadow','escaped_defect_prevention_rate','performance_root_cause_attribution','safe_game_days','innovation_self_benchmarking'];

const missing = (values = [], required = []) => required.filter(value => !values.includes(value));

export function validateQualityContract(contract = {}) {
  const gaps = [];
  if (contract.fingerprint !== FINGERPRINT) gaps.push(`fingerprint must be ${FINGERPRINT}`);
  if (contract.release_decision !== 'deterministic_evidence_only') gaps.push('release decision must use deterministic evidence only');
  if (contract.authorities?.delivery !== 'BRAIN-DELIVERY-v2') gaps.push('delivery authority must remain BRAIN-DELIVERY-v2');
  if (contract.authorities?.learning !== 'BRAIN-CLOSED-LOOP-v1') gaps.push('learning authority must remain BRAIN-CLOSED-LOOP-v1');
  if (contract.authorities?.production !== 'BG169') gaps.push('production authority must remain BG169');
  const frontendMissing = missing(contract.dimensions?.frontend, FRONTEND_REQUIRED);
  const backendMissing = missing(contract.dimensions?.backend, BACKEND_REQUIRED);
  if (frontendMissing.length) gaps.push(`frontend dimensions missing: ${frontendMissing.join(', ')}`);
  if (backendMissing.length) gaps.push(`backend dimensions missing: ${backendMissing.join(', ')}`);
  for (const forbidden of ['waive_gate','approve_without_evidence','auto_adopt_unvalidated_innovation']) {
    if (!contract.ai_policy?.may_not?.includes(forbidden)) gaps.push(`AI policy must forbid ${forbidden}`);
  }
  if (contract.learning?.contract !== 'config/universal-closed-loop-learning.json') gaps.push('learning must reuse config/universal-closed-loop-learning.json');
  const learningMissing = missing(contract.learning?.escaped_defect_requires, LEARNING_REQUIRED);
  if (learningMissing.length) gaps.push(`learning requirements missing: ${learningMissing.join(', ')}`);
  if (contract.innovation?.cadence !== 'daily' || contract.innovation?.auto_adopt !== false) gaps.push('innovation must scan daily and never auto-adopt');
  const adoptionMissing = missing(contract.innovation?.adoption_stages, ADOPTION_REQUIRED);
  if (adoptionMissing.length) gaps.push(`innovation adoption stages missing: ${adoptionMissing.join(', ')}`);
  if (!Array.isArray(contract.impact_rules) || contract.impact_rules.length === 0) gaps.push('impact_rules must not be empty');
  return Object.freeze({ ok: gaps.length === 0, gaps });
}

export function validateQualityV2Contract(contract = {}) {
  const gaps = [];
  if (contract.fingerprint !== V2_FINGERPRINT) gaps.push(`fingerprint must be ${V2_FINGERPRINT}`);
  if (contract.extends !== FINGERPRINT) gaps.push(`v2 must extend ${FINGERPRINT}`);
  if (contract.release_authority !== FINGERPRINT) gaps.push('v1 must remain release authority');
  const capabilityMissing = missing(contract.capabilities, V2_CAPABILITIES);
  if (capabilityMissing.length) gaps.push(`v2 capabilities missing: ${capabilityMissing.join(', ')}`);
  for (const required of ['GREEN','RED','UNKNOWN','NOT_REGISTERED']) {
    if (!contract.evidence_states?.includes(required)) gaps.push(`evidence state missing: ${required}`);
  }
  if (!Array.isArray(contract.green_states) || contract.green_states.length !== 1 || contract.green_states[0] !== 'GREEN') gaps.push('GREEN must be the only green evidence state');
  if (contract.ai_policy?.may_waive_gate !== false) gaps.push('AI may not waive gates');
  if (contract.deep_sensors?.release_authority !== false) gaps.push('deep sensors may not become release authority');
  return Object.freeze({ ok: gaps.length === 0, gaps });
}

export function validateQualityAutopilotContract(contract = {}) {
  const gaps = [];
  if (contract.fingerprint !== AUTOPILOT_FINGERPRINT) gaps.push(`fingerprint must be ${AUTOPILOT_FINGERPRINT}`);
  if (contract.extends !== V2_FINGERPRINT) gaps.push(`autopilot must extend ${V2_FINGERPRINT}`);
  if (contract.release_authority !== FINGERPRINT) gaps.push('v1 must remain release authority');
  const capabilityMissing = missing(contract.capabilities, AUTOPILOT_CAPABILITIES);
  if (capabilityMissing.length) gaps.push(`autopilot capabilities missing: ${capabilityMissing.join(', ')}`);
  if (!Array.isArray(contract.green_states) || contract.green_states.length !== 1 || contract.green_states[0] !== 'GREEN') gaps.push('GREEN must remain the only green state');
  for (const required of ['RED','UNKNOWN','NOT_REGISTERED','UNTESTED']) {
    if (!contract.non_green_states?.includes(required)) gaps.push(`non-green state missing: ${required}`);
  }
  if (contract.deep_sensor_history?.installed_is_proven !== false || contract.deep_sensor_history?.history_required !== true) gaps.push('installed sensors must not count as proven without history');
  if (contract.learning?.authority !== 'BRAIN-CLOSED-LOOP-v1' || contract.learning?.parallel_store_forbidden !== true) gaps.push('autopilot learning must reuse BRAIN-CLOSED-LOOP-v1 without a parallel store');
  if (contract.learning?.critical_test_auto_removal !== false) gaps.push('critical tests may not be auto-removed');
  if (contract.game_days?.production_destructive_forbidden !== true) gaps.push('destructive production game days must be forbidden');
  if (contract.innovation?.auto_promote_without_benchmark !== false) gaps.push('innovation may not auto-promote without benchmark evidence');
  if (contract.registration_obligations?.openapi_api_contract !== 'fail_closed_until_registered') gaps.push('OpenAPI/API contract registration must fail closed');
  if (contract.registration_obligations?.postgres_testcontainers_profile !== 'fail_closed_until_registered') gaps.push('PostgreSQL/Testcontainers registration must fail closed');
  return Object.freeze({ ok: gaps.length === 0, gaps });
}

export function classifyQualityImpact(paths = [], contract = {}) {
  const suites = new Set();
  for (const rawPath of paths) {
    const candidate = String(rawPath || '').replace(/^\.\//, '');
    for (const rule of contract.impact_rules || []) {
      if (candidate.startsWith(rule.prefix)) for (const suite of rule.suites || []) suites.add(suite);
    }
  }
  return Object.freeze({ paths: [...new Set(paths)].sort(), suites: [...suites].sort() });
}

export function buildQualityState({ candidateSha = null, dimensions = [] } = {}) {
  const normalized = dimensions.map(item => ({ id: String(item.id), mandatory: item.mandatory !== false, status: String(item.status || 'unknown'), evidence: item.evidence ?? null }));
  const blocking = normalized.filter(item => item.mandatory && item.status !== 'green').map(item => item.id);
  return Object.freeze({ fingerprint: FINGERPRINT, candidate_sha: candidateSha, status: blocking.length ? 'BLOCKED' : 'GREEN', blocking_dimensions: blocking, dimensions: normalized });
}

export function loadQualityContract(filename = 'powerhouse/assurance/quality-intelligence.json') {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

export function loadQualityV2Contract(filename = 'powerhouse/assurance/quality-intelligence-v2.json') {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

export function loadQualityAutopilotContract(filename = 'config/powerhouse-quality-autopilot.json') {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function main() {
  const v1 = validateQualityContract(loadQualityContract());
  const v2Path = 'powerhouse/assurance/quality-intelligence-v2.json';
  const autopilotPath = 'config/powerhouse-quality-autopilot.json';
  const v2 = fs.existsSync(v2Path) ? validateQualityV2Contract(loadQualityV2Contract(v2Path)) : { ok: true, gaps: [] };
  const autopilot = fs.existsSync(autopilotPath) ? validateQualityAutopilotContract(loadQualityAutopilotContract(autopilotPath)) : { ok: true, gaps: [] };
  const gaps = [...v1.gaps, ...v2.gaps, ...autopilot.gaps];
  const extensions = [];
  if (fs.existsSync(v2Path)) extensions.push(V2_FINGERPRINT);
  if (fs.existsSync(autopilotPath)) extensions.push(AUTOPILOT_FINGERPRINT);
  const output = { fingerprint: FINGERPRINT, extensions, status: gaps.length ? 'BLOCKED' : 'READY', gaps };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (process.argv.includes('--check') && gaps.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
