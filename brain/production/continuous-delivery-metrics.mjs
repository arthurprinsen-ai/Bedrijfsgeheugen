const n=value=>Number.isFinite(Number(value))?Number(value):0;
export function summarizeContinuousDeliveryMetrics(events=[]){
  const rows=Array.isArray(events)?events:[];
  const summary={changeCount:0,timeToLiveMs:0,unrelatedWaitMs:0,branchRebuildsForUnrelatedDrift:0,serialWrites:0,duplicateWork:0,ciDurationMs:0,rollbackDurationMs:0,platformCost:0,unaffectedGatesSkipped:0};
  for(const row of rows){
    summary.changeCount+=1;
    summary.timeToLiveMs+=Math.max(0,n(row.liveAt)-n(row.startedAt));
    summary.unrelatedWaitMs+=Math.max(0,n(row.unrelatedWaitMs));
    summary.branchRebuildsForUnrelatedDrift+=Math.max(0,n(row.branchRebuildsForUnrelatedDrift));
    summary.serialWrites+=Math.max(0,n(row.serialWrites));
    summary.duplicateWork+=Math.max(0,n(row.duplicateWork));
    summary.ciDurationMs+=Math.max(0,n(row.ciDurationMs));
    summary.rollbackDurationMs+=Math.max(0,n(row.rollbackDurationMs));
    summary.platformCost+=Math.max(0,n(row.platformCost));
    summary.unaffectedGatesSkipped+=Math.max(0,n(row.unaffectedGatesSkipped));
  }
  return Object.freeze(summary);
}
