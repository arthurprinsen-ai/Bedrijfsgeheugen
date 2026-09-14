import {normalizeBrainRecord} from '../operating-loop/model.mjs';
import {
  createDecisionPrediction,
  settleDecisionOutcome,
  calculateCalibrationMetrics,
} from './revenue-calibration-loop.mjs';

const text=value=>value==null?'':String(value).trim();
const list=value=>[...new Set((Array.isArray(value)?value:[]).filter(Boolean).map(String))];

function actionFrom(value){
  if(value&&typeof value==='object'&&text(value.type)) return structuredClone(value);
  const type=text(value)||'observe_and_enrich';
  return {type,priority:'normal'};
}

function predictionFromRecord(record){
  const prediction=record?.payload?.prediction;
  if(record?.kind!=='learning'||record?.payload?.learningType!=='revenue_prediction'||!prediction?.decision_id) {
    throw new Error('originating prediction Learning record is required');
  }
  return prediction;
}

export function buildPredictionLearningRecord({tenantId,decision,meetingProbability,modelVersion='company-decision-v1',predictionModel=null,predictedAt=new Date().toISOString(),actor='agent:brain'}={}){
  if(!tenantId) throw new Error('tenantId is required');
  if(!decision?.id) throw new Error('decision.id is required');
  if(meetingProbability===null||meetingProbability===undefined||meetingProbability==='') throw new Error('meetingProbability is required');
  const prediction=createDecisionPrediction({
    decisionId:decision.id,
    entityId:decision.subjectId||decision.id,
    opportunityScore:Number(decision.score??0),
    confidence:Number(decision.confidence??0),
    meetingProbability,
    expectedCommercialValue:Number(decision.expectedValue??0),
    recommendedAction:actionFrom(decision.nextAction),
    evidenceRefs:list(decision.evidenceIds),
    modelVersion,
    predictedAt,
  });
  return normalizeBrainRecord({
    tenantId,
    type:'Learning',
    id:`learning:revenue-prediction:${decision.id}:${prediction.predicted_at}`,
    subjectId:decision.subjectId||decision.id,
    decisionId:decision.id,
    owner:decision.owner||actor,
    actor,
    status:'PREDICTED',
    observedAt:prediction.predicted_at,
    evidenceIds:prediction.evidence_refs,
    expectedValue:prediction.prediction.expected_commercial_value,
    payload:{learningType:'revenue_prediction',prediction,predictionModel:predictionModel?structuredClone(predictionModel):null},
    source:'revenue-calibration-loop',
  });
}

export function settleCanonicalRevenueOutcome({predictionRecord,outcome={}}={}){
  const prediction=predictionFromRecord(predictionRecord);
  if(text(outcome.decisionId)!==prediction.decision_id) throw new Error('outcome must match its originating prediction decision_id');
  const settled=settleDecisionOutcome({
    prediction,
    outcome:{
      meeting:outcome.meeting,
      proposal:outcome.proposal,
      order:outcome.order,
      revenue:outcome.revenue,
      actionExecuted:outcome.actionExecuted,
      occurredAt:outcome.occurredAt,
      evidenceRefs:list(outcome.evidenceRefs),
    },
  });
  return normalizeBrainRecord({
    tenantId:predictionRecord.tenantId,
    type:'Learning',
    id:`learning:revenue-settlement:${prediction.decision_id}:${settled.outcome.occurred_at}`,
    subjectId:predictionRecord.subjectId,
    decisionId:prediction.decision_id,
    owner:predictionRecord.owner,
    actor:'agent:brain',
    status:'SETTLED',
    observedAt:settled.outcome.occurred_at,
    evidenceIds:list([...prediction.evidence_refs,...settled.outcome.evidence_refs]),
    realizedValue:settled.outcome.revenue,
    payload:{learningType:'revenue_settlement',settled,originatingPredictionId:predictionRecord.id},
    source:'revenue-calibration-loop',
  });
}

export function buildRevenueCalibrationContext(records=[]){
  const items=Array.isArray(records)?records:[];
  const settlements=items
    .filter(record=>record?.kind==='learning'&&record?.payload?.learningType==='revenue_settlement'&&record?.payload?.settled?.status==='settled')
    .map(record=>record.payload.settled);
  const knownPredictionIds=new Set(items
    .filter(record=>record?.kind==='learning'&&record?.payload?.learningType==='revenue_prediction')
    .map(record=>record.decisionId));
  const unmatchedOutcomes=items.filter(record=>record?.type==='Outcome'&&record?.decisionId&&!knownPredictionIds.has(record.decisionId)).length;
  const metrics=calculateCalibrationMetrics({settledDecisions:settlements});
  return Object.freeze({
    schema_version:'powerhouse.revenue-calibration-context.v1',
    metrics,
    matched_settlements:settlements.length,
    unmatched_outcomes:unmatchedOutcomes,
    next_decision_context:Object.freeze({revenue_calibration:metrics}),
  });
}

export const COMPANY_REVENUE_LEARNING_BRIDGE_CONTRACT=Object.freeze({
  version:'COMPANY-REVENUE-LEARNING-BRIDGE-v1',
  canonicalRecordType:'Learning',
  parallelTruthStore:false,
  failClosed:Object.freeze([
    'commercial execution requires a valid pre-action probability',
    'outcomes settle only the same originating decision_id',
    'unmatched outcomes never enter calibration',
  ]),
});
