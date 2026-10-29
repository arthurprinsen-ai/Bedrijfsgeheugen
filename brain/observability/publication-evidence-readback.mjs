// Existing canonical provider-state obligations: admin-only, aggregate readback.
// This module does not publish, change obligations, or expose raw provider IDs/errors.
const EXPECTED=Object.freeze(['linkedin_company','linkedin_personal','instagram','blog']);
const unknown=reason=>({status:'UNVERIFIED',reason});
const dateAmsterdam=now=>{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
  const part=t=>parts.find(p=>p.type===t)?.value;
  return [part('year'),part('month'),part('day')].join('-');
};
const codeFor=(row)=>{
  const error=String(row.last_error||'').toUpperCase();
  if(row.external_id && row.status==='LIVE_PROVEN' && row.live_proven_at)
    return 'NO_REPOST_COLLECT_OUTCOMES';
  if(row.external_id)
    return 'PROVIDER_CREATE_RECORDED_VERIFY_READBACK_NO_REPOST';
  if(error.includes('STORY_FAMILY_DUPLICATE')||error.includes('GLOBAL_POST_DUPLICATE'))
    return 'NEW_FACT_VERIFIED_DISTINCT_STORY_REQUIRED';
  if(error.includes('VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH')||
     error.includes('MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED'))
    return 'MIRA_REJECTED_REQUIRES_NEW_APPROVED_MEDIA';
  if(error.includes('SOURCE_SUPPLY_REQUIRED')||
     error.includes('NO_UNIQUE_VERIFIED_PERSONAL_SOURCE'))
    return 'FRESH_INDEPENDENT_PERSONAL_SOURCE_REQUIRED';
  if(error.includes('MEDIA_ASSET_REQUIRED'))
    return 'CANONICAL_MEDIA_ASSET_REQUIRED';
  if(row.channel==='instagram')return 'MEDIA_IDENTITY_AND_PROVIDER_EVIDENCE_PENDING';
  if(row.channel==='blog')return 'PROTECTED_PUBLICATION_AND_PUBLIC_URL_READBACK';
  return 'CANONICAL_SOURCE_AND_PROVIDER_PROOF_PENDING';
};

export function summarizePublicationEvidence(rows,{count,date,observedAt}={}){
  if(!Array.isArray(rows)||!Number.isSafeInteger(count)||count!==rows.length||count!==EXPECTED.length)
    return unknown('PUBLICATION_REGISTRY_INCOMPLETE');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||Number.isNaN(Date.parse(observedAt)))
    return unknown('PUBLICATION_OBSERVATION_INVALID');
  const seen=new Set(),channels=[];
  for(const row of rows){
    if(!row||row.tenant_id!=='canonical'||row.publication_date!==date||
      !EXPECTED.includes(row.channel)||seen.has(row.channel)||
      typeof row.status!=='string'||!row.status.trim())
      return unknown('PUBLICATION_ROW_OR_TENANT_INVALID');
    seen.add(row.channel);
    channels.push({channel:row.channel,registryStatus:row.status,
      providerIdRecorded:typeof row.external_id==='string'&&row.external_id.trim().length>0,
      internalLiveProofRecorded:Boolean(row.live_proven_at),
      recoveryCode:codeFor(row)});
  }
  if(seen.size!==EXPECTED.length)return unknown('PUBLICATION_CHANNEL_MISSING');
  const order=new Map(EXPECTED.map((x,i)=>[x,i]));
  channels.sort((a,b)=>order.get(a.channel)-order.get(b.channel));
  return {status:'REGISTRY_READBACK_COMPLETE',source:'public.content_publication_obligations',
    tenant:'canonical',date,observedAt,channels,
    caveat:'Database status and stored provider-ID are not independent direct provider readback; never republish an existing provider side effect.'};
}

export async function loadPublicationEvidence({baseUrl,key,observedAt=new Date().toISOString(),fetchImpl=globalThis.fetch}={}){
  if(!baseUrl||!key)return unknown('PUBLICATION_CONFIG_MISSING');
  const date=dateAmsterdam(observedAt);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return unknown('INVALID_DATE');
  const url=new URL(String(baseUrl).replace(/\/$/,'')+'/rest/v1/content_publication_obligations');
  url.searchParams.set('select','tenant_id,publication_date,channel,status,external_id,live_proven_at,last_error');
  url.searchParams.set('tenant_id','eq.canonical');
  url.searchParams.set('publication_date','eq.'+date);
  url.searchParams.set('limit','8');
  try{
    const response=await fetchImpl(url.toString(),{method:'GET',
      headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json',prefer:'count=exact'},
      signal:AbortSignal.timeout(5000)});
    if(!response.ok)return unknown('PUBLICATION_HTTP_'+response.status);
    const countMatch=/\/(\d+)$/.exec(String(response.headers?.get('content-range')||''));
    const rows=await response.json();
    return summarizePublicationEvidence(rows,{count:countMatch?Number(countMatch[1]):null,date,observedAt});
  }catch{return unknown('PUBLICATION_READ_FAILED');}
}
