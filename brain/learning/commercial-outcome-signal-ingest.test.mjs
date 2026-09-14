import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommercialOutcomeSignalIngestor} from './commercial-outcome-signal-ingest.mjs';

const openPrediction={
  id:'learning:prediction-1',
  decisionId:'decision-1',
  status:'OPEN',
  prediction:{prediction_id:'prediction-1',decision_id:'decision-1'},
};

function harness({predictions=[openPrediction]}={}){
  const calls=[];
  const ingest=createCommercialOutcomeSignalIngestor({
    getProjection:async()=>({revenuePredictions:predictions}),
    recordOutcome:async command=>{calls.push(command);return {ok:true,command};},
  });
  return {ingest,calls};
}

test('verified high-confidence meeting signal settles the exact open prediction through RECORD_OUTCOME',async()=>{
  const {ingest,calls}=harness();
  const result=await ingest({
    tenantId:'tenant-1',source:'calendar',signalId:'event-42',type:'meeting_completed',
    decisionId:'decision-1',predictionId:'prediction-1',confidence:0.98,verified:true,
    occurredAt:'2026-09-14T12:00:00.000Z',evidenceRefs:['calendar:event-42'],
  });
  assert.equal(result.status,'SETTLED');
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0],{
    command:'RECORD_OUTCOME',decisionId:'decision-1',idempotencyKey:'outcome-signal:calendar:event-42',
    commercial:true,verified:true,meeting:true,proposal:false,order:false,realizedValue:0,currency:'EUR',
    result:{signalType:'meeting_completed',source:'calendar',signalId:'event-42',predictionId:'prediction-1',occurredAt:'2026-09-14T12:00:00.000Z',confidence:0.98},
    evidenceIds:['calendar:event-42'],
  });
});

test('low-confidence or unverified signal never settles automatically',async()=>{
  const {ingest,calls}=harness();
  const low=await ingest({tenantId:'tenant-1',source:'gmail',signalId:'m1',type:'proposal_accepted',decisionId:'decision-1',predictionId:'prediction-1',confidence:0.7,verified:true,evidenceRefs:['gmail:m1']});
  const unverified=await ingest({tenantId:'tenant-1',source:'gmail',signalId:'m2',type:'proposal_accepted',decisionId:'decision-1',predictionId:'prediction-1',confidence:0.99,verified:false,evidenceRefs:['gmail:m2']});
  assert.equal(low.status,'REVIEW_REQUIRED');
  assert.equal(unverified.status,'REVIEW_REQUIRED');
  assert.equal(calls.length,0);
});

test('signal must match the exact open prediction and cannot settle another cycle',async()=>{
  const {ingest,calls}=harness();
  const result=await ingest({tenantId:'tenant-1',source:'crm',signalId:'deal-7',type:'deal_won',decisionId:'decision-1',predictionId:'prediction-old',confidence:1,verified:true,evidenceRefs:['crm:deal-7'],realizedValue:2900});
  assert.equal(result.status,'UNMATCHED');
  assert.equal(calls.length,0);
});

test('duplicate source signal is idempotent because the canonical command key is deterministic',async()=>{
  const {ingest,calls}=harness();
  const signal={tenantId:'tenant-1',source:'payments',signalId:'pay-9',type:'payment_received',decisionId:'decision-1',predictionId:'prediction-1',confidence:1,verified:true,evidenceRefs:['payment:pay-9'],realizedValue:2900,currency:'EUR'};
  await ingest(signal); await ingest(signal);
  assert.equal(calls[0].idempotencyKey,calls[1].idempotencyKey);
  assert.equal(calls[0].idempotencyKey,'outcome-signal:payments:pay-9');
});

test('evidence lineage is mandatory and unsupported signal types fail closed',async()=>{
  const {ingest,calls}=harness();
  await assert.rejects(()=>ingest({tenantId:'tenant-1',source:'crm',signalId:'x',type:'deal_won',decisionId:'decision-1',predictionId:'prediction-1',confidence:1,verified:true}),/EVIDENCE_REQUIRED/);
  await assert.rejects(()=>ingest({tenantId:'tenant-1',source:'crm',signalId:'y',type:'email_opened',decisionId:'decision-1',predictionId:'prediction-1',confidence:1,verified:true,evidenceRefs:['crm:y']}),/UNSUPPORTED_COMMERCIAL_OUTCOME_SIGNAL/);
  assert.equal(calls.length,0);
});
