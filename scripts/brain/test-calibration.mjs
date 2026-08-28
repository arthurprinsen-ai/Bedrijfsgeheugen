import {calibrateDecision} from '../../brain/learning/calibration.mjs';
let r=calibrateDecision({decision:'TEST',expected_value:100,expected_cost:10},{actual_value:50,cost:12,causal_confidence:'HIGH'}); if(r.value_error!==50||r.direction!=='OVERPREDICT') throw new Error('overprediction');
r=calibrateDecision({decision:'TEST',expected_value:50,expected_cost:10},{actual_value:90,cost:8,causal_confidence:'HIGH'}); if(r.direction!=='UNDERPREDICT') throw new Error('underprediction');
r=calibrateDecision({decision:'WATCH',expected_value:0,expected_cost:0},{actual_value:0,cost:0,causal_confidence:'MEDIUM'}); if(r.decision_quality!=='CORRECT_WAIT') throw new Error('correct wait');
r=calibrateDecision({decision:'TEST',expected_value:70,expected_cost:10},{actual_value:-5,cost:10,causal_confidence:'HIGH'}); if(r.decision_quality!=='FALSE_POSITIVE') throw new Error('false positive');
r=calibrateDecision({decision:'WATCH',expected_value:0,expected_cost:0},{actual_value:100,cost:0,causal_confidence:'HIGH'}); if(r.decision_quality!=='MISSED_OPPORTUNITY') throw new Error('missed opportunity');
const low=calibrateDecision({decision:'TEST',expected_value:50,expected_cost:10},{actual_value:40,cost:10,causal_confidence:'LOW'}); const high=calibrateDecision({decision:'TEST',expected_value:50,expected_cost:10},{actual_value:40,cost:10,causal_confidence:'HIGH'}); if(!(low.learning_weight<high.learning_weight)) throw new Error('causal weighting');
console.log('calibration tests passed');
