import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeBrainRecord, deriveLoopState } from '../brain/operating-loop/model.mjs';
import { assertClosedBrainLoop, WHOLE_BRAIN_STAGES } from '../brain/operating-loop/loop-integrity.mjs';
import { intelligenceToImpact, actionToExecution, executionToVerification, verificationToValue, valueToLearning, learningToMemory, memoryToGraphFeedback } from '../brain/operating-loop/lifecycle.mjs';

const requiredStages = ['evidence','graph','intelligence','impact','decision','action','execution','verification','value','learning','memory','graph_feedback'];

test('canonical whole-brain loop exposes every required stage explicitly', () => {
  assert.deepEqual(WHOLE_BRAIN_STAGES, requiredStages);
});

test('record model supports explicit impact execution verification value and memory objects with lineage', () => {
  const types = ['Impact','Execution','Verification','Value','Memory'];
  for (const [index, type] of types.entries()) {
    const record = normalizeBrainRecord({
      tenantId:'T1', type, id:`R${index}`, correlationId:'CORR-1', predecessorIds:index ? [`R${index-1}`] : ['ROOT'],
      owner:'agent', evidenceIds:['EV-1'], payload:{},
    });
    assert.equal(record.correlationId, 'CORR-1');
    assert.ok(record.predecessorIds.length > 0);
  }
});

test('closed-loop integrity refuses a skipped stage and accepts a complete lineage', () => {
  const base = { tenantId:'T1', correlationId:'CORR-LOOP', owner:'agent', evidenceIds:['EV-1'] };
  const specs = [
    ['Evidence','E1',[],{}],
    ['Entity','G1',['E1'],{loopStage:'graph'}],
    ['Signal','I1',['G1'],{}],
    ['Impact','IMP1',['I1'],{}],
    ['Decision','D1',['IMP1'],{}],
    ['Action','A1',['D1'],{}],
    ['Execution','X1',['A1'],{}],
    ['Verification','V1',['X1'],{}],
    ['Value','VAL1',['V1'],{}],
    ['Learning','L1',['VAL1'],{}],
    ['Memory','M1',['L1'],{}],
    ['Relation','GF1',['M1'],{loopStage:'graph_feedback',from:'memory:M1',to:'entity:customer'}],
  ];
  const records = specs.map(([type,id,predecessorIds,payload]) => normalizeBrainRecord({...base,type,id,predecessorIds,payload}));
  assert.equal(assertClosedBrainLoop(records,{correlationId:'CORR-LOOP'}).complete, true);
  assert.throws(() => assertClosedBrainLoop(records.filter(r => r.type !== 'Verification'),{correlationId:'CORR-LOOP'}), /missing|sequence|verification/i);
  const state = deriveLoopState(records);
  for (const stage of requiredStages) assert.equal(state.stages[stage], true, `${stage} must be explicit`);
});

test('whole-brain lifecycle helpers preserve correlation, evidence and predecessor lineage', () => {
  const intelligence={tenantId:'T1',type:'Signal',id:'I1',subjectId:'customer:1',correlationId:'C1',owner:'agent',evidenceIds:['E1'],payload:{recommendation:'fix'}};
  const impact=intelligenceToImpact(intelligence,{id:'IMP1',impactScore:.8});
  const action={tenantId:'T1',type:'Action',id:'A1',subjectId:'customer:1',correlationId:'C1',owner:'agent',evidenceIds:['E1'],predecessorIds:['D1'],payload:{}};
  const execution=actionToExecution(action,{id:'X1',result:'executed'});
  const verification=executionToVerification(execution,{id:'V1',verified:true,result:'passed'});
  const value=verificationToValue(verification,{id:'VAL1',realisedValue:100,valueUnit:'EUR'});
  const learning=valueToLearning(value,{id:'L1'});
  const memory=learningToMemory(learning,{id:'M1'});
  const feedback=memoryToGraphFeedback(memory,{id:'GF1',targetSubjectId:'customer:1'});
  assert.deepEqual([impact.type,execution.type,verification.type,value.type,learning.type,memory.type,feedback.type],['Impact','Execution','Verification','Value','Learning','Memory','Relation']);
  assert.equal(feedback.payload.loopStage,'graph_feedback');
  assert.equal(feedback.correlationId,'C1');
  assert.deepEqual(feedback.predecessorIds,['M1']);
  for (const record of [impact,execution,verification,value,learning,memory,feedback]) assert.deepEqual(record.evidenceIds,['E1']);
});

test('Make Notion Supabase DataForSEO website portal and agent runtime all inherit source and production adapter contracts', async () => {
  const mappings = JSON.parse(await readFile('config/brain-source-mappings.json','utf8'));
  const adapters = JSON.parse(await readFile('config/brain-platform-adapters.json','utf8'));
  for (const source of ['make','notion','supabase','dataforseo','website','portal','agent_runtime']) {
    assert.ok(mappings.sources[source], `${source} source mapping missing`);
    assert.ok(adapters.platforms.some(x => x.platform === source), `${source} platform adapter missing`);
  }
  for (const type of ['Impact','Execution','Verification','Value','Memory']) assert.ok(mappings.allowed_canonical_types.includes(type), `${type} canonical type missing`);
  assert.deepEqual(adapters.outcome_contract.canonical_loop, requiredStages);
});
