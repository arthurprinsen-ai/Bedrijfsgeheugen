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
  // An APPROVED draft is NOT provider-ready when its own original auth preflight failed.
  // Read only safe scalar fields from the canonical obligation, never provider tokens.
  if(row.channel==='linkedin_personal' &&
     (String(row.auth_preflight||'').toLowerCase()==='failed'||
      String(row.auth_error||'').toUpperCase().includes('LINKEDIN_REAUTH_REQUIRED')))
    return 'LINKEDIN_PERSONAL_CANONICAL_OAUTH_CONSENT_REQUIRED';
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
  url.searchParams.set('select','tenant_id,publication_date,channel,status,external_id,live_proven_at,last_error,auth_preflight:evidence->>provider_auth_preflight,auth_error:evidence->>error');
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

/**
 * Read-only, admin-route aggregate evidence of the existing source table.
 * A usable source is NOT publication proof and cannot change an obligation.
 * Fail closed on an unknown HTTP count; no fabricated zero or ready state.
 */
export async function loadPersonalSourceSupply({baseUrl,key,observedAt=new Date().toISOString(),fetchImpl=globalThis.fetch}={}){
  if(!baseUrl||!key)return unknown('PERSONAL_SOURCE_CONFIG_MISSING');
  const date=dateAmsterdam(observedAt);
  const since=new Date(Date.parse(date+'T00:00:00Z')-45*86400000).toISOString().slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(since)))return unknown('PERSONAL_SOURCE_DATE_INVALID');
  const url=new URL(String(baseUrl).replace(/\/$/,'')+'/rest/v1/powerhouse_mira_problem_signals_v1');
  url.searchParams.set('select','signal_id');
  url.searchParams.set('metadata->>contract','eq.personal-observational-life-source-v1');
  url.searchParams.set('eligible','eq.true');
  url.searchParams.append('source_published_at','gte.'+since);
  url.searchParams.append('source_published_at','lte.'+date+'T23:59:59Z');
  url.searchParams.set('limit','1');
  try{
    const response=await fetchImpl(url.toString(),{method:'GET',headers:{
      apikey:key,authorization:'Bearer '+key,accept:'application/json',prefer:'count=exact'
    },signal:AbortSignal.timeout(5000)});
    if(!response.ok)return unknown('PERSONAL_SOURCE_HTTP_'+response.status);
    const match=/\/(\d+)$/.exec(String(response.headers?.get('content-range')||''));
    if(!match)return unknown('PERSONAL_SOURCE_COUNT_UNVERIFIED');
    const count=Number(match[1]);
    if(!Number.isSafeInteger(count)||count<0)return unknown('PERSONAL_SOURCE_COUNT_INVALID');
    return {status:count>0?'FRESH_ELIGIBLE_SOURCES_PRESENT':'SOURCE_SUPPLY_REQUIRED',
      source:'public.powerhouse_mira_problem_signals_v1',
      sourceContract:'personal-observational-life-source-v1',tenant:'canonical',date,observedAt,
      freshEligibleSourceCount:count,
      caveat:'A fresh external public-life source is not proof of a unique drafted personal story or a LinkedIn provider-side publication.'};
  }catch{return unknown('PERSONAL_SOURCE_READ_FAILED');}
}
