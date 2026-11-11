import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_AGENT_TEAM} from '../platform/agents/agent-team.mjs';

const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const fingerprint='portal|cro|source-verified-autonomous-decision-receipt|20261111-v1';
const byId=id=>DEFAULT_AGENT_TEAM.find(agent=>agent.id===id);

test('only the original fourteen agents advise on CRO and original owner executes',()=>{
  assert.equal(DEFAULT_AGENT_TEAM.length,14);
  assert.equal(new Set(DEFAULT_AGENT_TEAM.map(a=>a.id)).size,14);
  for(const [id,task] of [
    ['agent-reliability','reconcile-stalled-portal-cro-handoff-with-original-owner'],
    ['agent-website-ux','verify-dependent-portal-projections-from-acknowledged-revision'],
    ['agent-growth-market','rank-source-verified-portal-cro-candidates'],
    ['agent-growth-market','decide-one-safe-cro-experiment-with-original-lease'],
    ['agent-growth-market','verify-cro-treatment-holdout-outcome-and-next-cycle-application']
  ]) assert.ok(byId(id)?.tasks.includes(task),id+':'+task);
  assert.ok(byId('agent-growth-market').playbooks.includes('portal-causal-input-to-cro-decision-and-ack'));
});

test('original SEO CRO skill gates autonomous decision on trusted source and outcome',async()=>{
 const skill=await read('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md');
 assert.ok(skill.startsWith('---\n'));
 for(const term of [
  fingerprint,'/api/portal-state','BusinessInput',
  'powerhouse_optimization_candidate_v1','powerhouse_optimization_closure_truth_v1',
  'powerhouse_autonomous_experiment_readiness_v1','powerhouse_cro_experiment_evidence_v1',
  'sourceRevision + tenant + candidate/action/experimentId',
  'INSUFFICIENT_MATURED_ASSIGNMENTS','NO_SAFE_CHANGE_WITH_EVIDENCE','REVIEW_REQUIRED',
  'control','holdout','protected merge','Heartbeat','OPEN','EVIDENCE_DUE',
  'two authenticated tenants','original writer lease'
 ]) assert.ok(skill.toLowerCase().includes(term.toLowerCase()),'missing '+term);
 assert.ok(skill.includes('zero assignments and zero treatment/holdout allocations'));
 assert.ok(skill.includes('not an instruction to mass-promote'));
 assert.ok(skill.includes('no second agent')||skill.includes('not a second agent'));
});

test('canonical incident learning and operator docs preserve independent proof boundary',async()=>{
 const r=JSON.parse(await read('brain/learning/2026-11-11-portal-cro-autonomous-decision-handoff-v1.json'));
 assert.equal(r.fingerprint,fingerprint);
 assert.equal(r.parent_issue,4215);
 assert.equal(r.no_new_executor,true);
 assert.equal(r.no_new_agent,true);
 assert.equal(r.no_new_scheduler,true);
 assert.equal(r.source_observation.assignments,0);
 assert.equal(r.source_observation.candidates_review_required,14);
 assert.equal(r.source_observation.actual_cro_treatment_proven,false);
 assert.equal(r.source_observation.two_authenticated_tenant_handoffs_proven,false);
 assert.equal(r.source_observation.customer_outcome_to_learning_proven,false);
 assert.equal(r.regression,'tests/brain-portal-cro-autonomous-decision-handoff-20261111.test.mjs');
 const doc=await read('docs/changes/2026-11-11-portal-cro-autonomous-decision-handoff.md');
 const ledger=await read('docs/development-ledger-events/2026-11-11-portal-cro-autonomous-decision-handoff.md');
 for(const str of [doc,ledger]){
  assert.ok(str.includes(fingerprint));
  assert.ok(str.includes('#4215'));
  assert.ok(str.includes('EVIDENCE_DUE'));
 }
});