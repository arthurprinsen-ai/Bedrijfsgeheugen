// Conservative advisory capacity; never grants writer or merge authority.
export function recoveryBudget({activeRuns,limit=12,max=5,reserve=2,fanout=3}={}){
 if(![activeRuns,limit,max,reserve,fanout].every(Number.isSafeInteger)||activeRuns<0||limit<1||max<0||reserve<0||fanout<1) return 0;
 return Math.max(0,Math.min(5,max,Math.floor((limit-reserve-activeRuns)/fanout)));
}
