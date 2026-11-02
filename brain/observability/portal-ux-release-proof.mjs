/**
 * Original ONE BRAIN production observation, projected only for the authenticated
 * existing Powerhouse administrator. No raw evidence or provider secrets go to UI.
 * The *registration* is not independently sufficient to prove a current deploy.
 */
const SUBJECT='portal-v2-living-interface-ux-v1';
const SHA=/^[a-f0-9]{40}$/;
const DEPLOY=/^[a-z0-9]{12,50}$/i;
const PENDING='EVIDENCE_DUE';
const safeStatus=(value,allowed)=>allowed.includes(value)?value:PENDING;
const unavailable=reason=>({status:'UNVERIFIED',reason});
export function summarizePortalUxReleaseProof(rows,{now=new Date()}={}){
 if(!Array.isArray(rows)||rows.length!==1)return unavailable('UX_OBSERVATION_MISSING_OR_DUPLICATED');
 const row=rows[0];
 if(!row||row.subject_id!==SUBJECT||row.environment!=='production')return unavailable('UX_OBSERVATION_IDENTITY_INVALID');
 const observed=Date.parse(row.observed_at),until=Date.parse(row.valid_until),current=+new Date(now);
 if(!Number.isFinite(observed)||!Number.isFinite(until)||!Number.isFinite(current)||observed>current+300000||until<=current||until<observed)
  return unavailable('UX_OBSERVATION_STALE_OR_INVALID');
 const state=row.observed_state;
 if(!state||typeof state!=='object'||Array.isArray(state))return unavailable('UX_OBSERVATION_MALFORMED');
 const productionSha=String(state.production_sha||'');
 if(!SHA.test(productionSha)||productionSha!==row.artifact_version)return unavailable('UX_RELEASE_SHA_MISMATCH');
 const originalSha=String(state.original_ux_release_sha||'');
 const originalDeploy=String(state.netlify_deploy||'');
 if(!SHA.test(originalSha)||!DEPLOY.test(originalDeploy))return unavailable('UX_ORIGINAL_PROOF_MISSING');
 return {
  status:'READBACK_COMPLETE',evidenceStatus:'REGISTERED_NOT_INDEPENDENTLY_DEPLOY_VERIFIED',
  observedAt:new Date(observed).toISOString(),validUntil:new Date(until).toISOString(),
  productionSha,originalSha,deployId:originalDeploy,
  release:safeStatus(state.release,['LIVE_SOURCE_AND_BROWSER_PROVEN']),
  browser:safeStatus(state.original_ux_browser_result,['PASS_15_SKIPPED_1']),
  securityDiagnostic:safeStatus(state.security_diagnostic_status,[
   'MERGED_POSTMERGE_BACKEND_AND_PORTAL_PASS_NOT_YET_PUBLISHED','PUBLISHED_SOURCE_AND_BROWSER_VERIFIED'
  ]),
  acceptance:{
   wcag:safeStatus(state.wcag_22_aa_independent_audit,['EVIDENCE_DUE','VERIFIED']),
   usability:safeStatus(state.real_entrepreneur_usability,['EVIDENCE_DUE','VERIFIED']),
   tenants:safeStatus(state.authenticated_two_tenant_tests,['EVIDENCE_DUE','VERIFIED']),
   award:safeStatus(state.award_readiness,['NOT_ASSESSED','ASSESSED'])
  }
 };
}

export async function loadPortalUxReleaseProof({baseUrl,key,fetchImpl=globalThis.fetch,now=new Date()}={}){
 if(!baseUrl||!key)return unavailable('UX_OBSERVATION_PROVIDER_CONFIG_MISSING');
 try{
  const url=new URL(String(baseUrl).replace(/\/$/,'')+'/rest/v1/brain_observed_states');
  url.searchParams.set('select','subject_id,environment,observed_state,observed_at,valid_until,artifact_version');
  url.searchParams.set('subject_id','eq.'+SUBJECT);
  url.searchParams.set('environment','eq.production');
  url.searchParams.set('order','observed_at.desc');
  url.searchParams.set('limit','1');
  const response=await fetchImpl(url.toString(),{
   method:'GET',
   headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json'},
   signal:AbortSignal.timeout(5000)
  });
  if(!response?.ok)return unavailable('UX_OBSERVATION_PROVIDER_HTTP_'+(response?.status||'UNKNOWN'));
  return summarizePortalUxReleaseProof(await response.json(),{now});
 }catch{return unavailable('UX_OBSERVATION_READBACK_FAILED');}
}
