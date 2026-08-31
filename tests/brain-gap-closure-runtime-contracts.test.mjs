import test from 'node:test';
import assert from 'node:assert/strict';
import { WHOLE_BRAIN_STAGES, assertClosedBrainLoop } from '../brain/operating-loop/loop-integrity.mjs';
import { projectAiGovernance } from '../brain/operating-loop/ai-governance.mjs';

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

test('AI governance stays fail-closed until evidence, owner, risk controls and review are complete', () => {
  const now='2026-08-31T12:00:00Z';
  const incomplete=projectAiGovernance([{kind:'governance',id:'G1',subjectId:'ai:1',owner:'UNASSIGNED',verified:false,evidenceIds:[],payload:{systemName:'Agent',provider:'Provider',model:'Model',purpose:'analysis',role:'deployer',riskLevel:'transparency'}}],{now});
  assert.equal(incomplete.systems[0].readiness,'INCOMPLETE');
  assert.equal(incomplete.systems[0].productionAllowed,false);
  const evidenced=projectAiGovernance([{kind:'governance',id:'G2',subjectId:'ai:2',owner:'AI Governance',verified:true,evidenceIds:['E1'],payload:{systemName:'Agent',provider:'Provider',model:'Model',purpose:'analysis',role:'deployer',riskLevel:'transparency',classificationSource:'EU AI Act assessment',humanOversight:{required:true,control:'Human approval'},transparencyControl:'AI disclosure',loggingControl:'Audit log',reviewDueAt:'2026-09-30T00:00:00Z'}}],{now});
  assert.equal(evidenced.systems[0].readiness,'EVIDENCED');
  assert.equal(evidenced.systems[0].productionAllowed,true);
});
