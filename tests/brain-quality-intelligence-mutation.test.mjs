import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  FINGERPRINT,
  V2_FINGERPRINT,
  validateQualityContract,
  validateQualityV2Contract,
  classifyQualityImpact,
  buildQualityState,
  loadQualityContract,
  loadQualityV2Contract,
} from '../scripts/brain/powerhouse-quality-intelligence.mjs';

const FRONTEND = ['functional','visual','geometry','responsive','cross_browser','accessibility','runtime','network','performance','content_baseline'];
const BACKEND = ['functional','property','api_contract','integration','performance','security','supply_chain','misconfiguration','resilience','data_integrity'];
const LEARNING = ['fingerprint','rootCause','regressionTest','preventionRule','evidence','learning_writeback','shared_context_refresh'];
const ADOPTION = ['discover','dedupe','applicability','security_cost_review','isolated_benchmark','false_positive_check','detection_delta','speed_delta','experiment_result','explicit_adoption'];
const CAPABILITIES = ['coverage_intelligence','autonomous_exploratory_testing','semantic_visual_intelligence','stateful_fuzz_chaos_testing','production_shadow_verification','performance_root_cause_intelligence','security_adversarial_matrix','build_provenance_sbom','test_the_tests_intelligence','quality_economics'];
const EVIDENCE = ['GREEN','RED','UNKNOWN','NOT_REGISTERED'];

const v1 = () => ({
  fingerprint: FINGERPRINT,
  release_decision: 'deterministic_evidence_only',
  authorities: { delivery: 'BRAIN-DELIVERY-v2', learning: 'BRAIN-CLOSED-LOOP-v1', production: 'BG169' },
  ai_policy: { may_not: ['waive_gate','approve_without_evidence','auto_adopt_unvalidated_innovation'] },
  dimensions: { frontend: [...FRONTEND], backend: [...BACKEND] },
  impact_rules: [
    { prefix: 'portal-v2/', suites: ['frontend','portal','accessibility','security'] },
    { prefix: 'netlify/functions/', suites: ['backend','api_contract','security','performance'] },
  ],
  learning: { contract: 'config/universal-closed-loop-learning.json', escaped_defect_requires: [...LEARNING] },
  innovation: { cadence: 'daily', auto_adopt: false, adoption_stages: [...ADOPTION] },
});

const v2 = () => ({
  fingerprint: V2_FINGERPRINT,
  extends: FINGERPRINT,
  release_authority: FINGERPRINT,
  capabilities: [...CAPABILITIES],
  evidence_states: [...EVIDENCE],
  green_states: ['GREEN'],
  ai_policy: { may_waive_gate: false },
  deep_sensors: { release_authority: false },
});

const onlyGap = (result, expected) => {
  assert.equal(result.ok, false);
  assert.deepEqual(result.gaps, [expected]);
};

test('canonical fingerprints are immutable public contract constants', () => {
  assert.equal(FINGERPRINT, 'powerhouse-quality-intelligence-v1');
  assert.equal(V2_FINGERPRINT, 'powerhouse-quality-intelligence-v2');
});

test('complete v1 contract is exactly green', () => {
  assert.deepEqual(validateQualityContract(v1()), { ok: true, gaps: [] });
});

test('v1 rejects each scalar authority mutation with exact evidence', () => {
  const cases = [
    [c => { c.fingerprint = 'wrong'; }, `fingerprint must be ${FINGERPRINT}`],
    [c => { c.release_decision = 'ai'; }, 'release decision must use deterministic evidence only'],
    [c => { c.authorities.delivery = 'wrong'; }, 'delivery authority must remain BRAIN-DELIVERY-v2'],
    [c => { c.authorities.learning = 'wrong'; }, 'learning authority must remain BRAIN-CLOSED-LOOP-v1'],
    [c => { c.authorities.production = 'wrong'; }, 'production authority must remain BG169'],
    [c => { c.learning.contract = 'parallel.json'; }, 'learning must reuse config/universal-closed-loop-learning.json'],
    [c => { c.innovation.cadence = 'weekly'; }, 'innovation must scan daily and never auto-adopt'],
    [c => { c.innovation.auto_adopt = true; }, 'innovation must scan daily and never auto-adopt'],
    [c => { c.impact_rules = []; }, 'impact_rules must not be empty'],
  ];
  for (const [mutate, expected] of cases) {
    const c = v1(); mutate(c); onlyGap(validateQualityContract(c), expected);
  }
});

test('v1 rejects every missing frontend dimension', () => {
  for (const item of FRONTEND) {
    const c = v1(); c.dimensions.frontend = FRONTEND.filter(x => x !== item);
    onlyGap(validateQualityContract(c), `frontend dimensions missing: ${item}`);
  }
});

test('v1 rejects every missing backend dimension', () => {
  for (const item of BACKEND) {
    const c = v1(); c.dimensions.backend = BACKEND.filter(x => x !== item);
    onlyGap(validateQualityContract(c), `backend dimensions missing: ${item}`);
  }
});

test('v1 rejects every missing AI prohibition', () => {
  for (const item of ['waive_gate','approve_without_evidence','auto_adopt_unvalidated_innovation']) {
    const c = v1(); c.ai_policy.may_not = c.ai_policy.may_not.filter(x => x !== item);
    onlyGap(validateQualityContract(c), `AI policy must forbid ${item}`);
  }
});

test('v1 rejects every missing closed-loop learning field', () => {
  for (const item of LEARNING) {
    const c = v1(); c.learning.escaped_defect_requires = LEARNING.filter(x => x !== item);
    onlyGap(validateQualityContract(c), `learning requirements missing: ${item}`);
  }
});

test('v1 rejects every missing innovation adoption stage', () => {
  for (const item of ADOPTION) {
    const c = v1(); c.innovation.adoption_stages = ADOPTION.filter(x => x !== item);
    onlyGap(validateQualityContract(c), `innovation adoption stages missing: ${item}`);
  }
});

test('missing optional v1 subtrees fail closed instead of throwing', () => {
  for (const key of ['authorities','ai_policy','dimensions','learning','innovation']) {
    const c = v1(); delete c[key];
    const result = validateQualityContract(c);
    assert.equal(result.ok, false);
    assert.ok(result.gaps.length > 0);
  }
});

test('complete v2 contract is exactly green', () => {
  assert.deepEqual(validateQualityV2Contract(v2()), { ok: true, gaps: [] });
});

test('v2 rejects scalar authority changes exactly', () => {
  const cases = [
    [c => { c.fingerprint = 'wrong'; }, `fingerprint must be ${V2_FINGERPRINT}`],
    [c => { c.extends = 'wrong'; }, `v2 must extend ${FINGERPRINT}`],
    [c => { c.release_authority = 'wrong'; }, 'v1 must remain release authority'],
    [c => { c.ai_policy.may_waive_gate = true; }, 'AI may not waive gates'],
    [c => { c.deep_sensors.release_authority = true; }, 'deep sensors may not become release authority'],
  ];
  for (const [mutate, expected] of cases) {
    const c = v2(); mutate(c); onlyGap(validateQualityV2Contract(c), expected);
  }
});

test('v2 rejects every missing capability', () => {
  for (const item of CAPABILITIES) {
    const c = v2(); c.capabilities = CAPABILITIES.filter(x => x !== item);
    onlyGap(validateQualityV2Contract(c), `v2 capabilities missing: ${item}`);
  }
});

test('v2 rejects every missing evidence state', () => {
  for (const item of EVIDENCE) {
    const c = v2(); c.evidence_states = EVIDENCE.filter(x => x !== item);
    onlyGap(validateQualityV2Contract(c), `evidence state missing: ${item}`);
  }
});

test('v2 green state is exactly one literal GREEN', () => {
  for (const states of [[], ['RED'], ['GREEN','RED'], 'GREEN']) {
    const c = v2(); c.green_states = states;
    onlyGap(validateQualityV2Contract(c), 'GREEN must be the only green evidence state');
  }
});

test('missing v2 policy subtrees fail closed', () => {
  for (const key of ['ai_policy','deep_sensors']) {
    const c = v2(); delete c[key];
    const result = validateQualityV2Contract(c);
    assert.equal(result.ok, false);
    assert.ok(result.gaps.length > 0);
  }
});

test('impact classification normalizes, deduplicates and sorts paths and suites', () => {
  const result = classifyQualityImpact(['netlify/functions/x.mjs','./portal-v2/app.js','portal-v2/app.js'], v1());
  assert.deepEqual(result.paths, ['./portal-v2/app.js','netlify/functions/x.mjs','portal-v2/app.js']);
  assert.deepEqual(result.suites, ['accessibility','api_contract','backend','frontend','performance','portal','security']);
  assert.deepEqual(classifyQualityImpact([], v1()), { paths: [], suites: [] });
});

test('quality state defaults fail closed and optional red does not block', () => {
  const empty = buildQualityState({ candidateSha: 'sha', dimensions: [] });
  assert.equal(empty.fingerprint, FINGERPRINT);
  assert.equal(empty.status, 'GREEN');
  assert.deepEqual(empty.blocking_dimensions, []);

  const state = buildQualityState({ candidateSha: 'abc', dimensions: [
    { id: 7, status: '', evidence: undefined },
    { id: 'optional', mandatory: false, status: 'red', evidence: null },
    { id: 'ok', mandatory: true, status: 'green', evidence: 'ci:1' },
  ]});
  assert.equal(state.status, 'BLOCKED');
  assert.equal(state.candidate_sha, 'abc');
  assert.deepEqual(state.blocking_dimensions, ['7']);
  assert.deepEqual(state.dimensions[0], { id: '7', mandatory: true, status: 'unknown', evidence: null });
  assert.equal(state.dimensions[1].mandatory, false);
});

test('canonical loaders read the registered v1 and v2 contracts', () => {
  assert.equal(loadQualityContract().fingerprint, FINGERPRINT);
  assert.equal(loadQualityV2Contract().fingerprint, V2_FINGERPRINT);
});

test('CLI validator reports both fingerprints and READY on canonical files', () => {
  const raw = execFileSync(process.execPath, ['scripts/brain/powerhouse-quality-intelligence.mjs','--check'], { encoding: 'utf8' });
  const output = JSON.parse(raw);
  assert.equal(output.fingerprint, FINGERPRINT);
  assert.deepEqual(output.extensions, [V2_FINGERPRINT]);
  assert.equal(output.status, 'READY');
  assert.deepEqual(output.gaps, []);
});
