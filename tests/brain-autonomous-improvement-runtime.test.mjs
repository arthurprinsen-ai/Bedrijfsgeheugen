import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  FINGERPRINT,
  buildRunId,
  measureArchitectureFitness,
  buildCapabilityGraph,
  decideExperimentPortfolio,
  assessCausalEvidence,
  replayPolicy,
  runFailureInjection,
  findSimplificationCandidates,
  prioritizeByBusinessValue,
  assessVerifiedGrowthLoop,
  buildAutonomousImprovementPacket
} from '../scripts/brain/continuous-improvement/autonomous-runtime.mjs';
import { validateAutonomousImprovementRuntime } from '../scripts/brain/continuous-improvement/run-autonomous-improvement.mjs';

test('runtime contract remains integrated with continuous improvement authority', async () => {
  const contract = JSON.parse(await readFile(new URL('../config/powerhouse-autonomous-improvement-runtime.json', import.meta.url), 'utf8'));
  assert.equal(contract.fingerprint, FINGERPRINT);
  assert.equal(contract.extends, 'powerhouse-continuous-improvement-engine-v1');
  assert.equal(contract.authority_model.new_persistent_authority, false);
  assert.equal(contract.scheduler.production_authority, 'Supabase pg_cron');
  assert.equal(contract.scheduler.production_function, 'public.powerhouse_autonomous_improvement_cron_v1()');
  assert.equal(contract.scheduler.cadence, 'hourly at minute 34');
  const staggerMigration=await readFile(new URL('../supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql', import.meta.url), 'utf8');
  assert.match(staggerMigration, /'powerhouse-autonomous-improvement-cycle-v1', '34 \* \* \* \*'/);
  assert.equal(contract.scheduler.schedule_source, 'supabase/migrations/20261006085416_stagger_cron_database_pressure_v1.sql');
  assert.equal(contract.scheduler.probe_workflow, '.github/workflows/business-os-intelligence.yml');
  assert.equal(contract.scheduler.probe_read_only, true);
  assert.equal(contract.writeback.route, 'public.brain_append_record -> existing public.brain_records');
  assert.equal(contract.writeback.new_store, false);
  assert.equal(contract.gates.destructive_simplification_auto_delete, false);
  assert.deepEqual((await validateAutonomousImprovementRuntime()).errors, []);
});

test('run identity is deterministic within the same hourly evidence bucket', () => {
  const input = { sourceSha: 'abc', observedAt: '2026-09-16T13:01:00Z', evidence: ['b','a'] };
  assert.equal(buildRunId(input), buildRunId({ ...input, observedAt: '2026-09-16T13:59:00Z' }));
  assert.notEqual(buildRunId(input), buildRunId({ ...input, observedAt: '2026-09-16T14:00:00Z' }));
});

test('architecture fitness detects material regressions without one magic score', () => {
  const result = measureArchitectureFitness({ baseline: { latency_ms: 100, reliability: 99.9, reuse: 0.8 }, current: { latency_ms: 131, reliability: 99.9, reuse: 0.8 }, lowerIsBetter: ['latency_ms'] });
  assert.equal(Math.round(result.dimensions.latency_ms.percent_change), 31);
  assert.equal(result.dimensions.latency_ms.material_regression, true);
  assert.equal(result.material_regressions[0].dimension, 'latency_ms');
  assert.equal('score' in result, false);
});

test('capability graph remains a projection and reveals overlaps and gaps', () => {
  const graph = buildCapabilityGraph({ capabilities: [{ id: 'a', provides: ['dedupe','learn'], agents: ['agent-a'] }, { id: 'b', provides: ['dedupe'], agents: ['agent-b'] }], requirements: ['dedupe','learn','replay'] });
  assert.equal(graph.projection_only, true);
  assert.deepEqual(graph.overlaps, [{ a: 'a', b: 'b', provides: ['dedupe'] }]);
  assert.deepEqual(graph.gaps, ['replay']);
});

test('champion challenger promotion requires observations and guardrails', () => {
  const held = decideExperimentPortfolio({ champion: { id: 'champion', observations: 40, metrics: { conversion: 0.1, error_rate: 0.01 } }, challengers: [{ id: 'challenger', observations: 10, metrics: { conversion: 0.2, error_rate: 0.01 } }], primaryMetric: 'conversion', minimumObservations: 30, guardrails: [{ metric: 'error_rate', max: 0.02 }] });
  assert.equal(held.decision, 'KEEP_CHAMPION');
  const promoted = decideExperimentPortfolio({ champion: { id: 'champion', observations: 40, metrics: { conversion: 0.1, error_rate: 0.01 } }, challengers: [{ id: 'challenger', observations: 40, metrics: { conversion: 0.2, error_rate: 0.015 } }], primaryMetric: 'conversion', minimumObservations: 30, guardrails: [{ metric: 'error_rate', max: 0.02 }] });
  assert.equal(promoted.decision, 'PROMOTE_CHALLENGER');
  assert.equal(promoted.winner, 'challenger');
});

test('causal learning defaults to correlation only and requires identification', () => {
  assert.equal(assessCausalEvidence({ design: { type: 'observational' } }).causalClaim, false);
  assert.equal(assessCausalEvidence({ design: { type: 'randomized', assignmentRecorded: true, contaminationChecked: true } }).causalClaim, true);
});

test('digital twin replay reports changed decisions, not invented outcomes', () => {
  const result = replayPolicy({ events: [{ id: '1', score: 1 }, { id: '2', score: 3 }], baselineDecision: event => event.score >= 3 ? 'ACT' : 'HOLD', candidateDecision: event => event.score >= 2 ? 'ACT' : 'HOLD' });
  assert.equal(result.total, 2);
  assert.equal(result.changed, 0);
  assert.equal(result.counterfactual_decisions_only, true);
});

test('safe chaos injection classifies recovery without destructive state', () => {
  const result = runFailureInjection({ scenarios: [{ id: 'provider-429', expected: 'RETRY_BOUNDED' }, { id: 'stale-knowledge', expected: 'HOLD_REVALIDATE' }], handler: scenario => ({ classification: scenario.id === 'provider-429' ? 'RETRY_BOUNDED' : 'HOLD_REVALIDATE' }) });
  assert.equal(result.passed, true);
  assert.equal(result.destructive, false);
});

test('simplification proposes removals but never auto deletes', () => {
  const result = findSimplificationCandidates({ capabilities: [{ id: 'a', provides: ['x'] }, { id: 'b', provides: ['x'] }], helpers: [{ id: 'dead-helper', kind: 'helper', usage_count: 0 }] });
  assert.equal(result.destructive_auto_delete, false);
  assert.ok(result.proposals.some(item => item.type === 'capability_overlap'));
  assert.ok(result.proposals.some(item => item.key === 'dead-helper'));
});

const growthEvidence=(id,realizedValue,overrides={})=>({
  id,tenant_id:'tenant-a',channel:'blog',
  outcome_id:'outcome-'+id,
  observed_at:'2026-10-23T09:00:00Z',
  realized_value:realizedValue,confidence:0.9,
  action_executed:true,verification_status:'REALIZED_VERIFIED',
  evidence_health:{status:'healthy'},source_refs:['provider:outcome-'+id],
  learning_verified:true,learning_evidence_refs:['learning:receipt-'+id],
  next_decision_id:'decision:next-'+id,
  growth_proof:{
    tenant_id:'tenant-a',goal_id:'goal:revenue',decision_id:'decision:'+id,
    action_id:'action:'+id,outcome_id:'outcome-'+id,
    published_artifact_id:'blog:article-'+id,
    provider_receipt_id:'publisher:create-'+id,provider_status:'LIVE_PROVEN'
  },
  ...overrides
});

test('one organism prioritizes independently source-backed verified business outcomes',()=>{
  const ranked=prioritizeByBusinessValue({
    now:'2026-10-23T10:00:00Z',
    candidates:[growthEvidence('unknown',null),growthEvidence('low',10),growthEvidence('high',100)]
  });
  assert.deepEqual(ranked.map(item=>item.id),['high','low','unknown']);
  assert.equal(ranked[0].value_known,true);
  assert.equal(ranked[0].loop_assurance.status,'CLOSED_LOOP_VERIFIED');
  assert.equal(ranked[2].value_priority,null);
});

test('unverified numeric revenue cannot outrank provider-verified value',()=>{
  const ranked=prioritizeByBusinessValue({
    now:'2026-10-23T10:00:00Z',
    candidates:[{id:'invented-million',realized_value:1e6,confidence:1,observed_at:'2026-10-23T09:00:00Z'},
      growthEvidence('confirmed',7)]
  });
  assert.deepEqual(ranked.map(x=>x.id),['confirmed','invented-million']);
  assert.equal(ranked[1].value_known,false);
  assert.equal(ranked[1].loop_assurance.status,'UNVERIFIED');
});

test('private tenant drift, stale sources, external delivery proof and time travel all fail closed',()=>{
  const base=growthEvidence('guard',150);
  const changes=[
    {growth_proof:{...base.growth_proof,tenant_id:'tenant-other'},reason:'TENANT_PROOF_MISMATCH'},
    {evidence_health:{status:'stale'},reason:'OUTCOME_PROVIDER_EVIDENCE_MISSING'},
    {growth_proof:{...base.growth_proof,provider_receipt_id:''},reason:'EXTERNAL_DELIVERY_NOT_PROVEN'},
    {observed_at:'2026-10-24T09:00:00Z',reason:'OBSERVATION_TIME_UNVERIFIED'},
    {action_executed:false,reason:'ACTION_NOT_VERIFIED_EXECUTED'},
    {source_refs:[],reason:'OUTCOME_PROVIDER_EVIDENCE_MISSING'}
  ];
  for(const {reason,...patch} of changes){
    const result=assessVerifiedGrowthLoop({...base,...patch},'2026-10-23T10:00:00Z');
    assert.equal(result.outcome_verified,false,reason);
    assert.ok(result.missing_evidence.includes(reason),reason);
    assert.equal(result.closed_loop_verified,false);
  }
});

test('real observed outcome is not a closed learning loop without evidence and next decision',()=>{
  const base=growthEvidence('learning',15);
  for(const patch of [
    {learning_verified:false},
    {learning_evidence_refs:[]},
    {next_decision_id:''}
  ]){
    const result=assessVerifiedGrowthLoop({...base,...patch},'2026-10-23T10:00:00Z');
    assert.equal(result.outcome_verified,true);
    assert.equal(result.status,'OUTCOME_VERIFIED_LEARNING_PENDING');
    assert.equal(result.closed_loop_verified,false);
    assert.equal(result.causal_attribution,'NOT_ESTABLISHED');
  }
});

test('multiple receipts for the same tenant outcome cannot inflate value ranking',()=>{
  const base=growthEvidence('single',18);
  const result=prioritizeByBusinessValue({now:'2026-10-23T10:00:00Z',
    candidates:[base,{...base,id:'duplicate',realized_value:250}]
  });
  assert.equal(result.filter(x=>x.value_known).length,1);
  assert.equal(result.filter(x=>x.loop_assurance.status==='DUPLICATE_OUTCOME_RECEIPT').length,1);
  assert.equal(result.filter(x=>x.value_priority!==null).length,1);
});

test('runtime composes one deterministic evidence packet over existing authorities', () => {
  const input = { sourceSha: 'abc', observedAt: '2026-09-16T12:00:00Z', evidence: ['e1'], fitness: { baseline: { reliability: 1 }, current: { reliability: 1 } }, capabilityGraph: { capabilities: [{ id: 'improve', provides: ['improve'] }], requirements: ['improve'] }, experimentPortfolio: { champion: { id: 'a', observations: 30, metrics: { q: 1 } }, primaryMetric: 'q' }, causalEvidence: {}, simplification: {}, valueFeedback: { candidates: [] } };
  const a = buildAutonomousImprovementPacket(input);
  const b = buildAutonomousImprovementPacket(input);
  assert.deepEqual(a, b);
  assert.equal(a.persistence_authority, 'existing Brain/Supabase writer routes only');
  assert.equal(a.projection_only, true);
});

test('Business OS Intelligence remains the read-only probe surface', async () => {
  const workflow = await readFile(new URL('../.github/workflows/business-os-intelligence.yml', import.meta.url), 'utf8');
  assert.match(workflow, /run-autonomous-improvement\.mjs/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('read-only probe is executable while production scheduling stays in Supabase', () => {
  const output = JSON.parse(execFileSync(process.execPath, ['scripts/brain/continuous-improvement/run-autonomous-improvement.mjs'], { encoding: 'utf8', env: { ...process.env, SOURCE_SHA: 'test-sha' } }));
  assert.equal(output.status, 'AUTONOMOUS_IMPROVEMENT_READY');
  assert.equal(output.validation.ok, true);
  assert.equal(output.packet.fingerprint, FINGERPRINT);
  assert.equal(output.production.scheduler_authority, 'Supabase pg_cron');
  assert.equal(output.production.job, 'powerhouse-autonomous-improvement-cycle-v1');
  assert.equal(output.writeback, 'not attempted by GitHub read-only probe');
  assert.equal(output.packet.probe_evidence.measured_performance, false);
  assert.equal(output.packet.probe_evidence.evaluated_champion, false);
  assert.equal(output.packet.probe_evidence.synthetic_performance_samples, false);
  assert.equal(output.packet.probe_evidence.automatic_promotion_allowed, false);
  assert.equal(output.packet.portfolio_decision.decision, 'HOLD');
  assert.equal(output.packet.portfolio_decision.winner, null);
  for (const metric of ['reliability', 'latency_ms', 'cost_per_outcome']) {
    assert.equal(output.packet.fitness.dimensions[metric].baseline, null);
    assert.equal(output.packet.fitness.dimensions[metric].current, null);
    assert.equal(output.packet.fitness.dimensions[metric].trend, 'unknown');
  }
  assert.deepEqual(output.packet.fitness.material_regressions, []);
});

test('daily contract probe never passes synthetic fixture metrics as real improvement evidence', async () => {
  const source = await readFile(new URL('../scripts/brain/continuous-improvement/run-autonomous-improvement.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /baseline:\s*\{\s*reliability:\s*99\.9/);
  assert.doesNotMatch(source, /champion:\s*\{\s*id:\s*'current',\s*observations:\s*30/);
  assert.match(source, /synthetic_performance_samples:\s*false/);
  assert.match(source, /automatic_promotion_allowed:\s*false/);
});

test('production adapter uses only canonical Brain record taxonomy', async () => {
  const migration = await readFile(new URL('../supabase/migration-history/repository-only/20260916152000_autonomous_improvement_brain_taxonomy_fix_v1.sql', import.meta.url), 'utf8');
  assert.match(migration, /'CurrentState','current_state'/);
  assert.match(migration, /record_type='CurrentState'/);
  assert.match(migration, /record_kind='current_state'/);
  assert.match(migration, /owner_id='powerhouse-autonomous-improvement-runtime-v1'/);
  assert.doesNotMatch(migration, /'improvement','autonomous_improvement_cycle'/);
});
