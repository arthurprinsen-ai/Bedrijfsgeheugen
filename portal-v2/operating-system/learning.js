export function calibrateOutcome(expected={},realized={},history=[]){
 const e=Number(expected.amount),r=Number(realized.amount);if(!Number.isFinite(e)||!Number.isFinite(r))throw new Error('CALIBRATION_VALUES_REQUIRED');
 const error=Number((r-e).toFixed(2)),ratio=e===0?null:Number((r/e).toFixed(4));
 const prior=history.map(item=>Number(item.error)).filter(Number.isFinite);const meanPrior=prior.length?prior.reduce((a,b)=>a+b,0)/prior.length:0;
 return Object.freeze({expected:e,realized:r,error,ratio,prior_mean_error:Number(meanPrior.toFixed(2)),sample_size:prior.length+1});
}

export function learningExplanation(change={}){
 const error=Number(change.error);if(!Number.isFinite(error))return 'Nog onvoldoende outcome-data voor kalibratie.';
 if(error===0)return 'De gerealiseerde uitkomst kwam overeen met de verwachting.';
 const amount=Math.abs(error);return error<0?`De realisatie lag ${amount} onder de verwachting; toekomstige schattingen kunnen conservatiever worden gekalibreerd.`:`De realisatie lag ${amount} boven de verwachting; dit patroon kan de confidence van vergelijkbare acties verhogen.`;
}
