const text=(value,max=650)=>String(value??'').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[REDACTED_EMAIL]').replace(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,}\d{3,}/g,'[REDACTED_PHONE]').slice(0,max);
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>['string','number'].includes(typeof value?.[k])).map(k=>[k,typeof value[k]==='string'?text(value[k]):value[k]]));
function sources({external_signals=[],search_signals=[]}) {
  const seen=new Set(), mapping=new Map();
  const refs=(rows,fields,kind)=>rows.slice(0,20).flatMap((row,index)=>{
    if(typeof row.ref!=='string'||!(/^(https?:\/\/|keyword:)/.test(row.ref))||seen.has(row.ref))return [];
    seen.add(row.ref);const ref=`${kind}:${index}`;mapping.set(ref,row.ref);
    return [{...pick(row,fields),ref}];
  });
  const external=refs(external_signals,['topic','title','summary','published_at','confidence'],'news');
  const search=refs(search_signals,['keyword','volume','competition','opportunity','position'],'search');
  return {external,search,mapping};
}
export function publicCalibrationPayload(context) {
  const {forecast}=context;
  if(!['segment','market','technology','regulation','behavior'].includes(forecast?.scope))throw new Error('CALIBRATION_PUBLIC_MARKET_SCOPE_REQUIRED');
  const {external,search}=sources(context);
  return {forecast:pick(forecast,['scope','scope_key','topic_key','predicted_event','predicted_problem','predicted_question','predicted_search_intent','probability','created_at','horizon_start','horizon_end','expected_by']),
    external_signals:external,search_signals:search};
}
export function resolveCalibrationReferences(refs,context) {
  const {mapping}=sources(context);
  if(refs.some(ref=>!mapping.has(ref)))throw new Error('CALIBRATION_UNKNOWN_REFERENCE');
  return refs.map(ref=>mapping.get(ref));
}
export function canCommitCalibration(verdict,payload) {
  // Public observations cannot prove an event never happened. Missed requires an
  // independently verified negative-evidence process; keep it unresolved here.
  if(verdict?.outcome!=='materialized'||!Number.isFinite(verdict.confidence)||verdict.confidence<0.6||verdict.confidence>1)return false;
  const refs=verdict.evidence_refs;
  const allowed=new Set([...payload.external_signals,...payload.search_signals].map(s=>s.ref));
  if(!Array.isArray(refs)||new Set(refs).size<2||refs.some(ref=>!allowed.has(ref)))return false;
  if(typeof verdict.actual_event_at!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(verdict.actual_event_at))return false;
  const event=Date.parse(verdict.actual_event_at),start=Date.parse(payload.forecast.created_at);
  const horizon=Date.parse(payload.forecast.horizon_end||payload.forecast.expected_by);
  const end=/^\d{4}-\d{2}-\d{2}$/.test(payload.forecast.horizon_end||payload.forecast.expected_by||'')?horizon+86400000-1:horizon;
  return Number.isFinite(event)&&new Date(event).toISOString().slice(0,10)===verdict.actual_event_at.slice(0,10)&&Number.isFinite(start)&&Number.isFinite(end)&&event>=start&&event<=end&&event<=Date.now();
}
