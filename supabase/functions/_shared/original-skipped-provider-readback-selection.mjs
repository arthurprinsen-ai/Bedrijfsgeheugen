// Same original publisher audit loop: select historical SKIPPED source conflicts.
// Never authorize a provider create, infer deletion from GET 400/403 or treat a
// 24-character internal source ID as a public Meta/LinkedIn provider ID.
const text=value=>String(value??'').trim();
export const ORIGINAL_HISTORICAL_READBACK_BATCH=3;
export const ORIGINAL_HISTORICAL_READBACK_COOLDOWN_MS=24*60*60*1000;
export function originalHistoricalProviderReference(row,{nowMs=Date.now()}={}){
 if(row?.status!=='SKIPPED')return {eligible:false,reason:'NOT_SKIPPED'};
 const ev=row?.evidence||{};
 if(ev.source_state_conflict!=='SKIPPED_WITH_ORIGINAL_PROVIDER_REFERENCE'||
    ev.republish_forbidden!==true||ev.reconciliation_required!==true)
   return {eligible:false,reason:'SOURCE_FENCE_NOT_VERIFIED'};
 const ref=text(row.external_id);
 if(!ref)return {eligible:false,reason:'ORIGINAL_EXTERNAL_REFERENCE_MISSING'};
 const prior=Date.parse(text(ev.reconciliation_provider_probe?.checked_at));
 if(Number.isFinite(prior)&&nowMs-prior<ORIGINAL_HISTORICAL_READBACK_COOLDOWN_MS)
   return {eligible:false,reason:'EXISTING_PROVIDER_PROBE_COOLDOWN'};
 const ch=text(row.channel);
 if(ch==='instagram'&&/^\d{14,20}$/.test(ref))
   return {eligible:true,kind:'instagram',ref};
 if((ch==='linkedin_personal'||ch==='linkedin_company')&&/^urn:li:(?:share|ugcPost):\d+$/.test(ref))
   return {eligible:true,kind:ch,ref};
 if(/^[0-9a-f]{24}$/i.test(ref))
   return {eligible:true,kind:'internal_reference',ref};
 return {eligible:false,reason:'UNSUPPORTED_PROVIDER_REFERENCE'};
}
export function originalProviderReadbackResult(row,providerData,{expectedAuthor='',expectedUsername=''}={}){
 const target=originalHistoricalProviderReference({...row,evidence:{...row.evidence,reconciliation_provider_probe:null}},{nowMs:Date.now()});
 const data=providerData?.data||providerData||{};
 if(!target.eligible||target.kind==='internal_reference')
   return {verified:false,reason:'NO_SUPPORTED_PUBLIC_PROVIDER_REFERENCE'};
 const id=text(data.id||data.ig_media_id||data.media_id);
 if(id!==target.ref)return {verified:false,reason:'EXACT_PROVIDER_ID_MISMATCH'};
 let publishedAt;
 try{
   const raw=target.kind==='instagram'?data.timestamp:(data.publishedAt??data.published_at);
   publishedAt=new Date(typeof raw==='number'||(/^\d{13}$/.test(text(raw)))?Number(raw):text(raw));
 }catch{return {verified:false,reason:'PROVIDER_TIMESTAMP_INVALID'}}
 if(!Number.isFinite(publishedAt?.getTime()))return {verified:false,reason:'PROVIDER_TIMESTAMP_UNVERIFIED'};
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(publishedAt).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 const day=parts.year+'-'+parts.month+'-'+parts.day;
 if(day!==text(row.publication_date))return {verified:false,reason:'PROVIDER_PUBLICATION_DAY_MISMATCH'};
 if(target.kind==='instagram'){
   if(text(data.username).toLowerCase()!==text(expectedUsername).toLowerCase()||
      !/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/?/.test(text(data.permalink)))
     return {verified:false,reason:'PROVIDER_INSTAGRAM_OWNER_OR_PERMALINK_UNVERIFIED'};
 }else if(text(data.author)!==text(expectedAuthor)||
          text(data.lifecycleState).toUpperCase()!=='PUBLISHED')
   return {verified:false,reason:'PROVIDER_LINKEDIN_AUTHOR_OR_STATE_UNVERIFIED'};
 return {verified:true,reason:'EXACT_PROVIDER_ID_OWNER_DATE_PROVEN',
   source_ref:target.ref,provider_published_at:publishedAt.toISOString()};
}
export function originalProviderReadbackErrorCode(error){
 const code=Number(error?.http||error?.status||0),message=text(error?.message||'').toUpperCase();
 if(code===401||code===403||/PERMISSION|REVOKED_ACCESS_TOKEN|AUTH_REQUIRED|FORBIDDEN|UNAUTHORIZED/.test(message))return 'PROVIDER_READ_PERMISSION_LIMITED';
 if(code===404||code===400||/UNSUPPORTED GET REQUEST|OBJECT WITH ID/.test(message))return 'PROVIDER_OBJECT_UNAVAILABLE_OR_ACCESS_LIMITED';
 if(code===429)return 'PROVIDER_READ_RATE_LIMITED';
 return 'PROVIDER_READBACK_UNVERIFIED';
}
