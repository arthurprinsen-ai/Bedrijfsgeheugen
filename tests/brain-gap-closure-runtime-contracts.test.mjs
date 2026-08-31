import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { WHOLE_BRAIN_STAGES, assertClosedBrainLoop } from '../brain/operating-loop/loop-integrity.mjs';
import { projectAiGovernance } from '../brain/operating-loop/ai-governance.mjs';
import { verificationToOutcome, outcomeToValue } from '../brain/operating-loop/lifecycle.mjs';

const stageRecord = (kind,id,predecessorIds=[]) => ({kind,id,correlationId:'C1',predecessorIds});

test('whole-brain completion requires an explicit outcome/result between verification and value', () => {
  assert.deepEqual(WHOLE_BRAIN_STAGES, [
    'evidence','graph','intelligence','impact','decision','action','execution','verification','outcome','value','learning','memory','graph_feedback'
  ]);
  const records = [
    stageRecord('evidence','e1'),
    {...stageRecord('entity','g1',['e1']),payload:{}},
    stageRecord('signal','s1',['g1']),
    stageRecord('impact','i1',['s1']),
    stageRecord('decision','d1',['i1']),
    stageRecord('action','a1',['d1']),
    stageRecord('execution','x1',['a1']),
    stageRecord('verification','v1',['x1']),
    stageRecord('value','val1',['v1']),
    stageRecord('learning','l1',['val1']),
    stageRecord('memory','m1',['l1']),
    {...stageRecord('relation','r1',['m1']),payload:{loopStage:'graph_feedback'}}
  ];
  assert.throws(() => assertClosedBrainLoop(records,{correlationId:'C1'}), /missing outcome stage/);
  records.splice(8,0,stageRecord('outcome','o1',['v1']));
  records[9] = stageRecord('value','val1',['o1']);
  assert.equal(assertClosedBrainLoop(records,{correlationId:'C1'}).complete,true);
});

test('canonical lifecycle helpers preserve verification -> outcome -> value lineage', () => {
  const verification={tenantId:'T1',type:'Verification',id:'V1',subjectId:'seo:keyword',correlationId:'C2',owner:'SEO Agent',evidenceIds:['E1'],executed:true,verified:true,result:'SERP checked',executionId:'X1'};
  const outcome=verificationToOutcome(verification,{id:'O1',result:'recommendation executed and result observed'});
  const value=outcomeToValue(outcome,{id:'VAL1',realisedValue:1,valueUnit:'verified_outcome'});
  assert.equal(outcome.type,'Outcome');
  assert.deepEqual(outcome.predecessorIds,['V1']);
  assert.equal(value.type,'Value');
  assert.deepEqual(value.predecessorIds,['O1']);
  assert.deepEqual(value.evidenceIds,['E1']);
});

test('AI governance stays fail-closed until evidence, approval, owner, risk controls and review are complete', () => {
  const now='2026-08-31T12:00:00Z';
  const incomplete=projectAiGovernance([{kind:'governance',id:'G1',subjectId:'ai:1',owner:'UNASSIGNED',verified:false,evidenceIds:[],observedAt:'2026-08-31T10:00:00Z',payload:{systemName:'Agent',provider:'Provider',model:'Model',purpose:'analysis',role:'deployer',riskLevel:'LIMITED',approved:false}}],{now});
  assert.equal(incomplete.systems[0].readiness,'INCOMPLETE');
  assert.equal(incomplete.systems[0].productionAllowed,false);
  const evidenced=projectAiGovernance([{kind:'governance',id:'G2',subjectId:'ai:2',owner:'AI Governance',verified:true,evidenceIds:['E1'],observedAt:'2026-08-31T11:00:00Z',payload:{systemName:'Agent',provider:'Provider',model:'Model',purpose:'analysis',role:'deployer',riskLevel:'LIMITED',classificationSource:'EU AI Act assessment',humanOversight:{required:true,control:'Human approval'},transparencyControl:'AI disclosure',loggingControl:'Audit log',reviewDueAt:'2026-09-30T00:00:00Z',approved:true,approvalEvidenceIds:['AE1']}}],{now});
  assert.equal(evidenced.systems[0].riskLevel,'transparency');
  assert.equal(evidenced.systems[0].readiness,'EVIDENCED');
  assert.equal(evidenced.systems[0].productionAllowed,true);
});

test('AI governance projection keeps only the newest immutable revision per use case', () => {
  const common={kind:'governance',subjectId:'ai:agent-1',owner:'AI Governance',verified:true,evidenceIds:['E1'],payload:{systemName:'Agent',provider:'Provider',model:'Model',purpose:'analysis',role:'deployer',riskLevel:'MINIMAL',classificationSource:'registry',humanOversight:{required:false,control:'policy'},transparencyControl:'not-required',loggingControl:'audit',reviewDueAt:'2026-09-30T00:00:00Z',approved:true,approvalEvidenceIds:['AE1']}};
  const projection=projectAiGovernance([{...common,id:'G-old',observedAt:'2026-08-30T10:00:00Z'},{...common,id:'G-new',observedAt:'2026-08-31T10:00:00Z',payload:{...common.payload,model:'Model-v2'}}],{now:'2026-08-31T12:00:00Z'});
  assert.equal(projection.summary.total,1);
  assert.equal(projection.systems[0].id,'G-new');
  assert.equal(projection.systems[0].model,'Model-v2');
});

test('Governance is a canonical type for the production AI registry source', async () => {
  const mappings=JSON.parse(await readFile('config/brain-source-mappings.json','utf8'));
  assert.ok(mappings.allowed_canonical_types.includes('Governance'));
  assert.ok(mappings.sources.supabase.canonical_types.includes('Governance'));
  assert.ok(mappings.sources.agent_runtime.canonical_types.includes('Governance'));
  assert.ok(mappings.sources.ai_model_services.canonical_types.includes('Governance'));
  const migration=await readFile('supabase/migrations/20260831_brain_ai_governance_projection.sql','utf8');
  assert.match(migration,/brain_sync_ai_governance_record/);
  assert.match(migration,/record_type in \([^)]*'Governance'/s);
  assert.match(migration,/after insert or update on public\.brain_ai_governance_registry/i);
});
