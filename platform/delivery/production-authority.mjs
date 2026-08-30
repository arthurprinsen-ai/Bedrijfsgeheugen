const decision=(action,reason,platform)=>Object.freeze({action,reason,platform:String(platform??'').trim().toLowerCase(),waitForUnrelatedChanges:false,batchRequired:false});

export function decideProductionActivation(input={}){
  const platform=String(input.platform??'').trim().toLowerCase();
  if(input.hardBoundary===true)return decision('BLOCKED_HARD_BOUNDARY','hard-boundary',platform);
  if(input.productionRegressed===true)return decision('ROLLBACK','production-regression',platform);
  if(input.registered!==true)return decision('REJECT','platform-not-registered',platform);
  if(input.gatesGreen!==true)return decision('REJECT','required-gates-not-green',platform);
  if(input.dependenciesGreen!==true)return decision('REJECT','true-dependency-not-green',platform);
  if(input.exactEvidence!==true)return decision('REJECT','exact-live-evidence-missing',platform);
  return decision('PROMOTE','independently-green',platform);
}
