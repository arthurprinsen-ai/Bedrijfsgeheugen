const weight={LOW:.25,MEDIUM:.6,HIGH:1};
export function calibrateDecision(d,o){
  const expected=Number(d.expected_value||0),actual=Number(o.actual_value||0),expectedCost=Number(d.expected_cost||0),actualCost=Number(o.cost||0);
  const signed=expected-actual,value_error=Math.abs(signed),cost_error=Math.abs(expectedCost-actualCost);
  const direction=signed>5?'OVERPREDICT':signed<-5?'UNDERPREDICT':'CALIBRATED';
  let decision_quality='MIXED';
  if(['WATCH','PAUSE','IGNORE'].includes(d.decision)&&actual<=0) decision_quality='CORRECT_WAIT';
  else if(['WATCH','PAUSE','IGNORE'].includes(d.decision)&&actual>20) decision_quality='MISSED_OPPORTUNITY';
  else if(!['WATCH','PAUSE','IGNORE'].includes(d.decision)&&actual<=0&&expected>0) decision_quality='FALSE_POSITIVE';
  else if(actual>0) decision_quality='USEFUL_ACTION';
  return {value_error,cost_error,direction,decision_quality,causal_confidence:o.causal_confidence||'LOW',learning_weight:weight[o.causal_confidence]??.25,challenger_only:true};
}
