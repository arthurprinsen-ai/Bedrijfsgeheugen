/**
 * Fail-closed, read-only prewrite admission for the ORIGINAL blog queue.
 * This is not an alternate publisher, approval route or scheduler.
 */
const clean=(value)=>String(value??'').trim();
const published=new Set(['DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED']);
function evidenceObject(value){
 if(value&&typeof value==='object'&&!Array.isArray(value))return value;
 if(typeof value==='string'){try{return evidenceObject(JSON.parse(value));}catch{return {};}}
 return {};
}
export function assessBlogQueueAdmission({runDate='',today='',obligation=null}={}){
 const day=clean(runDate),local=clean(today);
 const deny=code=>Object.freeze({allowed:false,code});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{4}-\d{2}-\d{2}$/.test(local))
  return deny('BLOG_BUSINESS_DATE_INVALID');
 if(day!==local)return deny('BLOG_BUSINESS_DATE_NOT_CURRENT');
 const status=clean(obligation?.status).toUpperCase();
 const evidence=evidenceObject(obligation?.evidence);
 if(status==='SKIPPED'||clean(evidence.decision).toUpperCase()==='NO_PUBLISH')
  return deny('BLOG_EXPLICIT_NO_PUBLISH');
 const veto=evidence.veto;
 if(veto===true||(veto&&typeof veto==='object'&&!Array.isArray(veto)&&veto.active!==false))
  return deny('BLOG_ACTIVE_VETO');
 if(published.has(status)||clean(obligation?.external_id)||obligation?.published_at||obligation?.live_proven_at)
  return deny('BLOG_PROVIDER_SIDE_EFFECT_OR_TERMINAL');
 return Object.freeze({allowed:true,code:'DUE_UNSENT_BLOG'});
}
