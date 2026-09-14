import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrainRecord} from '../operating-loop/model.mjs';
import {buildCompanyDecisionProjection} from '../operating-loop/company-decision-projection.mjs';
import {createCompanyDecisionHandler} from '../../platform/api/company-decision-handler.mjs';

function harness({score=87,confidence=.83}={}){
  const records=[normalizeBrainRecord({
    tenantId:'user:arthur',type:'Decision',id:'decision:acme',subjectId:'company:acme',owner:'agent:brain',actor:'agent:brain',status:'APPROVED',observedAt:'2026-09-14T13:00:00Z',expectedValue:2900,evidenceIds:['signal:intent'],payload:{score,confidence,nextAction:'personal_outreach'}
  })];
  const store={
    async getProjection(tenantId){return buildCompanyDecisionProjection(records,{tenantId});},
    async append(input){
      const record=input?.schemaVersion==='brain-record.v1'?input:normalizeBrainRecord(input);
      const existing=records.find(item=>item.id===record.id);
      if(existing) return {duplicate:true,record:existing};
      records.push(record);
      return {duplicate:false,record};
    },
  };
  const handler=createCompanyDecisionHandler({getUser:async()=>({id:'arthur'}),store,now:(()=>{const times=['2026-09-14T14:00:00Z','2026-09-16T10:00:00Z','2026-09-18T09:00:00Z'];let i=0;return()=>times[Math.min(i++,times.length-1)];})()});
  return {records,store,handler};
}

async function post(handler,body){
  return handler(new Request('https://bedrijfsgeheugen.nl/api/company-decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
}

test('commercial START generates its own probability before action and RECORD_OUTCOME closes it into calibration',async()=>{
  const {records,store,handler}=harness();
  const started=await post(handler,{command:'START',decisionId:'decision:acme',idempotencyKey:'start-1',evidenceIds:['signal:intent']});
  assert.equal(started.status,201);
  assert.equal(records[1].kind,'learning');
  assert.equal(records[1].payload.learningType,'revenue_prediction');
  assert.equal(records[1].payload.prediction.prediction.meeting_probability,.7221);
  assert.equal(records[1].payload.prediction.model_version,'meeting-probability-v1');
  assert.equal(records[1].payload.predictionModel.source,'bootstrap_proxy');
  assert.equal(records[1].payload.predictionModel.calibration.applied,false);
  assert.equal(records[2].kind,'action');

  const openProjection=await store.getProjection('user:arthur');
  assert.equal(openProjection.revenuePredictions[0].status,'OPEN');
  assert.equal(Object.hasOwn(openProjection.revenuePredictions[0],'canonicalRecord'),false);

  const outcome=await post(handler,{command:'RECORD_OUTCOME',decisionId:'decision:acme',idempotencyKey:'outcome-1',meeting:true,proposal:true,order:true,verified:true,realizedValue:2900,evidenceIds:['crm:deal-42'],result:'order won'});
  assert.equal(outcome.status,201);
  const settlement=records.find(item=>item.kind==='learning'&&item.payload?.learningType==='revenue_settlement');
  assert.ok(settlement);
  assert.equal(settlement.payload.settled.prediction.decision_id,'decision:acme');
  assert.equal(settlement.payload.settled.outcome.revenue,2900);
  const projection=await store.getProjection('user:arthur');
  assert.equal(projection.revenuePredictions[0].status,'SETTLED');
  assert.equal(projection.revenueCalibration.metrics.sample_size,1);
  assert.equal(projection.nextDecisionContext.revenue_calibration.sample_size,1);

  const restarted=await post(handler,{command:'START',decisionId:'decision:acme',idempotencyKey:'start-2',meetingProbability:.99,evidenceIds:['signal:new-intent']});
  assert.equal(restarted.status,201);
  const latestPrediction=records.filter(item=>item.kind==='learning'&&item.payload?.learningType==='revenue_prediction').at(-1);
  assert.equal(latestPrediction.payload.prediction.prediction.meeting_probability,.7221);
  assert.notEqual(latestPrediction.payload.prediction.prediction.meeting_probability,.99);
  const secondProjection=await store.getProjection('user:arthur');
  assert.equal(secondProjection.revenuePredictions[0].status,'OPEN');
  assert.notEqual(secondProjection.revenuePredictions[0].id,settlement.payload.originatingPredictionId);
  assert.equal(secondProjection.revenueCalibration.metrics.sample_size,1);
});

test('commercial START fails closed when score or confidence is unavailable; outcome still requires originating prediction',async()=>{
  const noScore=harness({score:null,confidence:.83});
  const start=await post(noScore.handler,{command:'START',decisionId:'decision:acme',idempotencyKey:'start-no-score'});
  assert.equal(start.status,409);
  assert.equal((await start.json()).error,'PREDICTION_INPUTS_REQUIRED');
  assert.equal(noScore.records.length,1);

  const noConfidence=harness({score:87,confidence:null});
  const confidenceStart=await post(noConfidence.handler,{command:'START',decisionId:'decision:acme',idempotencyKey:'start-no-confidence'});
  assert.equal(confidenceStart.status,409);
  assert.equal((await confidenceStart.json()).error,'PREDICTION_INPUTS_REQUIRED');
  assert.equal(noConfidence.records.length,1);

  const {records,handler}=harness();
  const outcome=await post(handler,{command:'RECORD_OUTCOME',decisionId:'decision:acme',idempotencyKey:'outcome-missing',meeting:true,verified:true,realizedValue:2900});
  assert.equal(outcome.status,409);
  assert.equal((await outcome.json()).error,'ORIGINATING_PREDICTION_REQUIRED');
  assert.equal(records.length,1);
});
