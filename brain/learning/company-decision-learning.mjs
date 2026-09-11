import {calibrateDecision} from './calibration.mjs';

const num=value=>Number.isFinite(Number(value))?Number(value):0;
const clamp01=value=>Math.max(0,Math.min(1,num(value)));

function adjustment({calibration,expectedValue,verified}){
  if(!verified) return 0;
  const denominator=Math.max(1,Math.abs(num(expectedValue)));
  const relativeError=Math.min(1,calibration.value_error/denominator);
  const magnitude=Math.min(.15,relativeError*.1*num(calibration.learning_weight));
  if(calibration.direction==='OVERPREDICT'||calibration.decision_quality==='FALSE_POSITIVE') return -magnitude;
  if(calibration.direction==='UNDERPREDICT'&&calibration.decision_quality==='USEFUL_ACTION') return magnitude;
  return 0;
}

export function learnFromCompanyDecision(decision={},outcome={}){
  const expectedValue=num(decision.expectedValue??decision.expected_value);
  const expectedCost=num(decision.expectedCost??decision.expected_cost??decision.investment);
  const actualValue=num(outcome.actualValue??outcome.actual_value??outcome.realizedValue);
  const actualCost=num(outcome.actualCost??outcome.cost);
  const verified=outcome.verified===true;
  const calibration=calibrateDecision(
    {decision:decision.decision,expected_value:expectedValue,expected_cost:expectedCost},
    {actual_value:actualValue,cost:actualCost,causal_confidence:outcome.causalConfidence??outcome.causal_confidence}
  );
  const previousConfidence=clamp01(decision.confidence);
  const confidenceDelta=adjustment({calibration,expectedValue,verified});
  const nextConfidence=clamp01(previousConfidence+confidenceDelta);
  const decisionId=String(decision.decisionId??decision.decision_id??'');
  const evidenceIds=Array.isArray(outcome.evidenceIds)?outcome.evidenceIds.filter(Boolean).map(String):[];
  const fingerprint=[decisionId,...evidenceIds.slice().sort()].filter(Boolean).join(':')||'unidentified';
  const reprioritize=verified&&(calibration.direction!=='CALIBRATED'||calibration.decision_quality==='FALSE_POSITIVE'||calibration.decision_quality==='MISSED_OPPORTUNITY');
  const learningRecord={
    type:'Learning',
    id:`company-learning:${fingerprint}`,
    decisionId,
    status:verified?'PROVEN':'HYPOTHESIS',
    verified,
    evidenceIds,
    result:calibration.direction,
    payload:{
      calibration,
      previousConfidence,
      confidenceDelta,
      nextConfidence,
      reprioritize
    }
  };
  return Object.freeze({calibration,previousConfidence,confidenceDelta,nextConfidence,reprioritize,learningRecord});
}
