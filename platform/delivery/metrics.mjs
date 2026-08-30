const number=value=>Number.isFinite(Number(value))?Number(value):0;

export function summarizeDeliveryMetrics(events=[]){
  const rows=Array.isArray(events)?events:[];
  return Object.freeze(rows.reduce((summary,row)=>{
    summary.changeCount+=1;
    summary.timeToLiveMs+=Math.max(0,number(row.liveAt)-number(row.startedAt));
    summary.unrelatedWaitMs+=Math.max(0,number(row.unrelatedWaitMs));
    summary.branchRebuildsForUnrelatedDrift+=Math.max(0,number(row.branchRebuildsForUnrelatedDrift));
    summary.serialWrites+=Math.max(0,number(row.serialWrites));
    summary.duplicateWork+=Math.max(0,number(row.duplicateWork));
    summary.ciDurationMs+=Math.max(0,number(row.ciDurationMs));
    summary.rollbackDurationMs+=Math.max(0,number(row.rollbackDurationMs));
    summary.platformCost+=Math.max(0,number(row.platformCost));
    summary.unaffectedGatesSkipped+=Math.max(0,number(row.unaffectedGatesSkipped));
    return summary;
  },{changeCount:0,timeToLiveMs:0,unrelatedWaitMs:0,branchRebuildsForUnrelatedDrift:0,serialWrites:0,duplicateWork:0,ciDurationMs:0,rollbackDurationMs:0,platformCost:0,unaffectedGatesSkipped:0}));
}
