import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateQualityContract,
  classifyQualityImpact,
  buildQualityState,
} from '../scripts/powerhouse-quality-intelligence.mjs';

const completeContract = (overrides = {}) => ({
  fingerprint: 'powerhouse-quality-intelligence-v1',
  release_decision: 'deterministic_evidence_only',
  authorities: {
    delivery: 'BRAIN-DELIVERY-v2',
    assurance: 'powerhouse-assurance-layer-v1',
    learning: 'BRAIN-CLOSED-LOOP-v1',
    production: 'BG169',
  },
  ai_policy: {
    may: ['discover','generate_tests','classify','root_cause','bounded_heal'],
    may_not: ['waive_gate','approve_without_evidence','auto_adopt_unvalidated_innovation'],
  },
  dimensions: {
    frontend: ['functional','visual','geometry','responsive','cross_browser','accessibility','runtime','network','performance','content_baseline'],
    backend: ['functional','property','api_contract','integration','performance','security','supply_chain','misconfiguration','resilience','data_integrity'],
  },
  impact_rules: [
    { prefix: 'portal-v2/', suites: ['frontend','portal','accessibility','security'] },
    { prefix: 'tools/site-shell/', suites: ['frontend','visual','accessibility'] },
    { prefix: 'netlify/functions/', suites: ['backend','api_contract','security','performance'] },
    { prefix: 'supabase/', suites: ['backend','security','data_integrity'] },
    { prefix: 'powerhouse/assurance/', suites: ['quality_contract','backend'] },
  ],
  learning: {
    preflight: 'node scripts/brain/chat-learning-preflight.mjs',
    contract: 'config/universal-closed-loop-learning.json',
    escaped_defect_requires: ['fingerprint','rootCause','regressionTest','preventionRule','evidence','learning_writeback','shared_context_refresh'],
  },
  innovation: {
    cadence: 'daily',
    adoption_stages: ['discover','dedupe','applicability','security_cost_review','isolated_benchmark','false_positive_check','detection_delta','speed_delta','experiment_result','explicit_adoption'],
    auto_adopt: false,
  },
  ...overrides,
});

test('quality contract requires complete frontend and backend dimensions', () => {
  const broken = completeContract({ dimensions: { frontend: ['functional'], backend: ['functional'] } });
  const result = validateQualityContract(broken);
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some(x => x.includes('frontend')));
  assert.ok(result.gaps.some(x => x.includes('backend')));
});

test('AI cannot become release authority', () => {
  const broken = completeContract({ release_decision: 'ai_judgement' });
  const result = validateQualityContract(broken);
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some(x => x.includes('deterministic')));
});

test('impact mapping selects only affected suites and deduplicates them', () => {
  const result = classifyQualityImpact(['portal-v2/app.js','netlify/functions/foo.mjs'], completeContract());
  assert.deepEqual(result.suites, ['accessibility','api_contract','backend','frontend','performance','portal','security']);
});

test('escaped defects require canonical closed-loop learning fields', () => {
  const broken = completeContract({ learning: { preflight: 'x', contract: 'parallel.json', escaped_defect_requires: [] } });
  const result = validateQualityContract(broken);
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some(x => x.includes('learning')));
});

test('quality state is explainable and never hides mandatory red dimensions', () => {
  const state = buildQualityState({ candidateSha: 'abc123', dimensions: [
    { id: 'functional', mandatory: true, status: 'green', evidence: 'ci:test' },
    { id: 'security', mandatory: true, status: 'red', evidence: 'trivy:1' },
    { id: 'innovation', mandatory: false, status: 'unknown', evidence: null },
  ]});
  assert.equal(state.status, 'BLOCKED');
  assert.equal(state.candidate_sha, 'abc123');
  assert.equal(state.dimensions.length, 3);
  assert.equal(state.blocking_dimensions[0], 'security');
});