const clean=v=>String(v??'').trim();
const success=v=>String(v??'').toLowerCase()==='success';
const pending=v=>['queued','pending','in_progress','waiting','requested'].includes(String(v??'').toLowerCase());
const failed=v=>['failure','failed','error','cancelled','timed_out','action_required'].includes(String(v??'').toLowerCase());

export function diagnoseRequiredStatus({requiredContext,requiredAppId=null,headStatuses=[],headCheckRuns=[],mergeCheckRuns=[],mergeApiMessage=''}={}){
  const context=clean(requiredContext);
  if(!context) throw new TypeError('requiredContext is required');
  const statusMatches=(headStatuses||[]).filter(x=>clean(x?.context)===context);
  const checkMatches=(headCheckRuns||[]).filter(x=>clean(x?.name)===context||clean(x?.context)===context);
  const mergeMatches=(mergeCheckRuns||[]).filter(x=>clean(x?.name)===context||clean(x?.context)===context);
  const providerMatches=requiredAppId==null||[...statusMatches,...checkMatches].some(x=>Number(x?.app_id??x?.app?.id)===Number(requiredAppId));
  const headGreen=statusMatches.some(x=>success(x?.state))||checkMatches.some(x=>success(x?.conclusion));
  const headPending=statusMatches.some(x=>pending(x?.state))||checkMatches.some(x=>pending(x?.status));
  const headFailed=statusMatches.some(x=>failed(x?.state))||checkMatches.some(x=>failed(x?.conclusion));
  const mergeGreen=mergeMatches.some(x=>success(x?.conclusion)||success(x?.state));
  const expectedMessage=/required status check\s+["']?.+?["']?\s+is expected/i.test(clean(mergeApiMessage));
  let classification='unknown';
  let rerunTests=false;
  if(!providerMatches&&headGreen) classification='provider_mismatch';
  else if(headFailed){classification='failed';rerunTests=true;}
  else if(headPending) classification='queued';
  else if(headGreen&&expectedMessage&&mergeMatches.length===0) classification='expected_on_synthetic_ref';
  else if(headGreen&&expectedMessage&&!mergeGreen) classification='success_but_not_recognized';
  else if(headGreen) classification='success';
  return Object.freeze({classification,requiredContext:context,requiredAppId,headGreen,mergeGreen,providerMatches,rerunTests,disableRequiredCheck:false,recommendation:classification==='expected_on_synthetic_ref'?'Keep the required check; inspect or relax only the synthetic/up-to-date merge-ref requirement when exact platform evidence proves the mismatch.':null});
}
