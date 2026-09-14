import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPredictionLearningRecord,
  settleCanonicalRevenueOutcome,
  buildRevenueCalibrationContext,
} from './company-revenue-learning-bridge.mjs';

const decision={id:'decision:acme',subjectId:'company:acme',score:87,confidence:.83,expectedValue:2900,nextAction:'personal_outreach',evidenceIds:['signal:intent']};

test('creates an immutable pre-action prediction as a canonical Brain Learning record',()=>{
  const record=buildPredictionLearningRecord({tenantId:'t1',decision,meetingProbability:.21,predictedAt:'2026-09-14T14:00:00Z'});
  assert.equal(record.type,'Learning');
  assert.equal(record.kind,'learning');
  assert.equal(record.decisionId,'decision:acme');
  assert.equal(record.payload.learningType,'revenue_prediction');
  assert.equal(record.payload.prediction.prediction.meeting_probability,.21);
  assert.equal(record.payload.prediction.prediction.expected_commercial_value,2900);
  assert.deepEqual(record.evidenceIds,['signal:intent']);
});

test('settles only the matching originating prediction and preserves outcome evidence',()=>{
  const predictionRecord=buildPredictionLearningRecord({tenantId:'t1',decision,meetingProbability:.7,predictedAt:'2026-09-14T14:00:00Z'});
  const settlement=settleCanonicalRevenueOutcome({
    predictionRecord,
    outcome:{decisionId:'decision:acme',meeting:true,proposal:true,order:true,revenue:2900,actionExecuted:true,occurredAt:'2026-09-16T10:00:00Z',evidenceRefs:['crm:deal-42']},
  });
  assert.equal(settlement.type,'Learning');
  assert.equal(settlement.payload.learningType,'revenue_settlement');
  assert.equal(settlement.payload.settled.outcome.order,1);
  assert.equal(settlement.payload.settled.outcome.revenue,2900);
  assert.ok(settlement.evidenceIds.includes('crm:deal-42'));
  assert.throws(()=>settleCanonicalRevenueOutcome({predictionRecord,outcome:{decisionId:'decision:other',meeting:true}}),/originating prediction/);
});

test('calibration context uses settled matched outcomes only and is ready for the next decision',()=>{
  const p1=buildPredictionLearningRecord({tenantId:'t1',decision:{...decision,id:'d1'},meetingProbability:.8});
  const p2=buildPredictionLearningRecord({tenantId:'t1',decision:{...decision,id:'d2'},meetingProbability:.2});
  const s1=settleCanonicalRevenueOutcome({predictionRecord:p1,outcome:{decisionId:'d1',meeting:true,revenue:2900,actionExecuted:true}});
  const s2=settleCanonicalRevenueOutcome({predictionRecord:p2,outcome:{decisionId:'d2',meeting:false,revenue:0,actionExecuted:true}});
  const context=buildRevenueCalibrationContext([p1,p2,s1,s2,{type:'Outcome',decisionId:'unmatched'}]);
  assert.equal(context.metrics.sample_size,2);
  assert.equal(context.metrics.brier_score,.04);
  assert.equal(context.next_decision_context.revenue_calibration.sample_size,2);
  assert.equal(context.unmatched_outcomes,1);
});

test('fails closed when a commercial action has no valid probability',()=>{
  assert.throws(()=>buildPredictionLearningRecord({tenantId:'t1',decision,meetingProbability:null}),/meetingProbability/);
});
