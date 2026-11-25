// Read-only native protection classifier. No status, ruleset, ref or grant writes.
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const APP=5916428;
const BASE=Object.freeze(['CodeQL javascript-typescript','hygiene / admission','test']);
export const PROMOTION_CONTEXT='powerhouse / exclusive-promotion';
export function classifyReviewedProviderFence({repository,branch,protection,rulesets,complete}={}){
 const report=(state)=>Object.freeze({state,repository:REPO,branch:'main',appId:APP,requiredContext:PROMOTION_CONTEXT,exclusiveWriterVerified:false,mutationAuthority:false});
 if(repository!==REPO||branch!=='main'||complete!==true||!Array.isArray(rulesets)||rulesets.length!==0)return report('NATIVE_PROTECTION_INVENTORY_UNPROVEN');
 const p=protection,s=p?.required_status_checks;
 if(s?.strict!==true||p?.enforce_admins?.enabled!==true||p?.required_conversation_resolution?.enabled!==true||p?.allow_force_pushes?.enabled!==false||p?.allow_deletions?.enabled!==false||p?.lock_branch?.enabled!==false)return report('BASELINE_PROTECTION_UNPROVEN');
 // Unknown review bypass or push exceptions must be reviewed, never inferred safe.
 if(p.restrictions!=null||p.required_pull_request_reviews!=null)return report('ADDITIONAL_PROTECTION_REVIEW_REQUIRED');
 const checks=s.checks,contexts=s.contexts;
 if(!Array.isArray(checks)||!Array.isArray(contexts)||checks.some(c=>!c||typeof c.context!=='string'||!Number.isSafeInteger(c.app_id))||new Set(checks.map(c=>c.context)).size!==checks.length||new Set(contexts).size!==contexts.length||contexts.length!==checks.length||!checks.every(c=>contexts.includes(c.context)))return report('REQUIRED_CHECK_INVENTORY_UNPROVEN');
 if(!BASE.every(name=>checks.some(c=>c.context===name&&c.app_id===15368)))return report('BASELINE_REQUIRED_CHECK_UNPROVEN');
 const grant=checks.find(c=>c.context===PROMOTION_CONTEXT);
 if(!grant&&checks.length===BASE.length)return report('DEDICATED_CONTEXT_MISSING');
 if(!grant||grant.app_id!==APP||checks.length!==BASE.length+1)return report('DEDICATED_CONTEXT_BINDING_UNPROVEN');
 // Configuration evidence alone cannot prove that only a single writer can grant.
 return report('NATIVE_CONTEXT_BOUND_EXCLUSIVE_WRITER_UNPROVEN');
}

// Protected read-only inventory. Uses an already-authorized read credential;
// never requests a new token or changes a check, status, rule, or ref.
// A complete inventory still cannot establish exclusive writer authority.
export async function readReviewedProviderFence({token,expectedMainSha,fetchImpl=globalThis.fetch}={}){
 const report=(state)=>Object.freeze({state,repository:REPO,branch:'main',appId:APP,requiredContext:PROMOTION_CONTEXT,exclusiveWriterVerified:false,mutationAuthority:false});
 if(typeof token!=='string'||!/^[A-Za-z0-9._~+/-]+=*$/.test(token)||typeof expectedMainSha!=='string'||!/^[a-f0-9]{40}$/.test(expectedMainSha)||typeof fetchImpl!=='function')return report('NATIVE_READ_CREDENTIAL_OR_EPOCH_UNPROVEN');
 const api='https://api.github.com/repos/'+REPO;
 const get=async path=>{
  let r;
  try{r=await fetchImpl(api+path,{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}})}catch{throw Error('NATIVE_FENCE_READ_UNAVAILABLE')}
  if(r?.status!==200)throw Error(Number.isInteger(r?.status)?'NATIVE_FENCE_HTTP_'+r.status:'NATIVE_FENCE_READ_UNAVAILABLE');
  // Do not follow untrusted pagination links or treat a partial list as complete.
  if(typeof r.headers?.get!=='function'||r.headers.get('link'))throw Error('NATIVE_FENCE_INVENTORY_INCOMPLETE');
  try{return await r.json()}catch{throw Error('NATIVE_FENCE_RESPONSE_INVALID')}
 };
 const readBranch=async()=>{
  const b=await get('/branches/main');
  if(b?.name!=='main'||b.protected!==true||b.commit?.sha!==expectedMainSha)throw Error('NATIVE_FENCE_MAIN_EPOCH_UNPROVEN');
 };
 const snapshot=async()=>{
  const protection=await get('/branches/main/protection');
  const rulesets=await get('/rulesets?includes_parents=true&per_page=100');
  const effective=await get('/rules/branches/main');
  if(!Array.isArray(rulesets)||!Array.isArray(effective)||rulesets.length>=100)throw Error('NATIVE_FENCE_INVENTORY_INCOMPLETE');
  return {protection,rulesets,effective};
 };
 const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 try{
  const repository=await get('');
  if(repository?.id!==1303700955||repository.full_name!==REPO)return report('NATIVE_FENCE_REPOSITORY_UNPROVEN');
  await readBranch();
  const first=await snapshot(),second=await snapshot();
  await readBranch();
  if(stable(first)!==stable(second))return report('NATIVE_FENCE_CONFIGURATION_CHANGED');
  if(first.effective.length!==0)return report('NATIVE_EFFECTIVE_RULES_REVIEW_REQUIRED');
  return classifyReviewedProviderFence({repository:REPO,branch:'main',protection:first.protection,rulesets:first.rulesets,complete:true});
 }catch(e){
  const state=String(e?.message||'');
  return report(/^(NATIVE_FENCE_HTTP_[1-5][0-9]{2}|NATIVE_FENCE_(?:READ_UNAVAILABLE|INVENTORY_INCOMPLETE|RESPONSE_INVALID|MAIN_EPOCH_UNPROVEN))$/.test(state)?state:'NATIVE_FENCE_READ_UNAVAILABLE');
 }
}

// Review-only staging adapter: never invoke automatically or grant status/ref authority.
// Separate repository-bound administration/contents/metadata READ token; revoke and confirm 401 before returning.
import {verifyReleaseApp} from './release-app-identity.mjs';
const ORIGIN='https://api.github.com';
const REPO_ID=1303700955;
const APP_ID=APP;
const INSTALLATION_ID=185660155;
const need=(v,c)=>{if(v!==true)throw Error(c)};
const readOnly=p=>p&&p.administration==='read'&&p.contents==='read'&&p.metadata==='read'&&Object.keys(p).length===3;
// Provider-issued credential is opaque; only enforce safe Bearer transport syntax.
const safeToken=t=>typeof t==='string'&&/^[A-Za-z0-9._~+/-]+=*$/.test(t);
export async function proveScopedFenceRead({appId,privateKey,expectedMainSha,fetchImpl=globalThis.fetch,now=Date.now(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 need(appId===APP_ID,'FENCE_READ_APP_ID_UNPROVEN');
 need(typeof expectedMainSha==='string'&&/^[a-f0-9]{40}$/.test(expectedMainSha),'FENCE_READ_EPOCH_UNPROVEN');
 let appAuth;
 // Reuse the reviewed identity verifier. JWT stays only in this function.
 const identity=await verifyReleaseApp({appId,privateKey,now,fetchImpl:async(url,opts)=>{
   need(url.origin===ORIGIN&&opts.method==='GET'&&opts.redirect==='error'&&['/app','/repos/'+REPO+'/installation'].includes(url.pathname),'FENCE_READ_IDENTITY_REQUEST_INVALID');
   need(typeof opts.headers.Authorization==='string'&&opts.headers.Authorization.startsWith('Bearer '),'FENCE_READ_APP_AUTH_UNPROVEN');
   if(appAuth!==undefined)need(opts.headers.Authorization===appAuth,'FENCE_READ_APP_AUTH_CHANGED');
   appAuth=opts.headers.Authorization;
   return fetchImpl(url,opts);
 }});
 need(identity.authenticated===true&&identity.appId===APP_ID&&identity.installationId===INSTALLATION_ID&&identity.repository===REPO&&identity.mutationAuthority===false&&identity.exclusiveWriterVerified===false&&typeof appAuth==='string','FENCE_READ_IDENTITY_UNPROVEN');
 const request=async(path,method,auth,body)=>{
   let res;
   try {res=await fetchImpl(new URL(path,ORIGIN),{method,redirect:'error',signal:AbortSignal.timeout(5000),headers:{Authorization:auth,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}catch{throw Error('FENCE_READ_TOKEN_TRANSPORT_UNPROVEN')}
   need(Number.isInteger(res?.status),'FENCE_READ_TOKEN_RESPONSE_INVALID');return res;
 };
 const json=async(res)=>{try{return await res.json()}catch{throw Error('FENCE_READ_TOKEN_RESPONSE_INVALID')}};
 const issued=await request('/app/installations/'+INSTALLATION_ID+'/access_tokens','POST',appAuth,{repository_ids:[REPO_ID],permissions:{administration:'read',contents:'read',metadata:'read'}});
 appAuth=undefined;
 need(issued.status===201,'FENCE_READ_TOKEN_ISSUANCE_UNPROVEN');
 const receipt=await json(issued);
 // An unknown or malformed issuance receipt is never retried blindly.
 const token=receipt?.token;
 need(safeToken(token),'FENCE_READ_TOKEN_ISSUANCE_AMBIGUOUS');
 const tokenAuth='Bearer '+token;
 let fence;
 try{
   need(readOnly(receipt.permissions)===true,'FENCE_READ_TOKEN_PERMISSIONS_UNPROVEN');
   const expiry=Date.parse(receipt.expires_at);
   need(Number.isFinite(expiry)&&expiry>now&&expiry<=now+3660000,'FENCE_READ_TOKEN_EXPIRY_UNPROVEN');
   const inventory=await request('/installation/repositories?per_page=100','GET',tokenAuth);
   need(inventory.status===200,'FENCE_READ_TOKEN_SCOPE_READBACK_FAILED');
   // A contradictory or inaccessible pagination header cannot prove complete scope.
   need(typeof inventory.headers?.get==='function'&&!inventory.headers.get('link'),'FENCE_READ_TOKEN_REPOSITORY_SCOPE_UNPROVEN');
   const body=await json(inventory);
   need(body?.total_count===1&&Array.isArray(body.repositories)&&body.repositories.length===1&&body.repositories[0]?.id===REPO_ID&&body.repositories[0]?.full_name===REPO,'FENCE_READ_TOKEN_REPOSITORY_SCOPE_UNPROVEN');
   fence=await readReviewedProviderFence({token,expectedMainSha,fetchImpl:async(url,opts)=>fetchImpl(new URL(url),{...opts,signal:AbortSignal.timeout(5000)})});
 }finally{
   const revoked=await request('/installation/token','DELETE',tokenAuth);
   need(revoked.status===204,'FENCE_READ_TOKEN_REVOCATION_UNPROVEN');
   // A successful DELETE may precede provider-wide rejection. Only read back
   // the same token, with bounded delays; never mint a replacement or grant.
   let denied=false;
   for(const delay of [0,250,750,1500,3000,5000]){
     if(delay)await sleep(delay);
     const readback=await request('/installation/repositories?per_page=100','GET',tokenAuth);
     if(readback.status===401){denied=true;break}
     // Only a still-valid 200 is a possible propagation delay. Other HTTP
     // results do not prove rejection and must fail closed.
     need(readback.status===200,'FENCE_READ_TOKEN_REVOCATION_READBACK_UNPROVEN');
   }
   need(denied,'FENCE_READ_TOKEN_REVOCATION_READBACK_UNPROVEN');
 }
 return Object.freeze({state:'SCOPED_READ_TOKEN_REVOKED_AUTHORITY_UNPROVEN',fenceState:fence.state,expectedMainSha,appId:APP_ID,installationId:INSTALLATION_ID,repository:REPO,scopeVerified:true,revocationVerified:true,exclusiveWriterVerified:false,mutationAuthority:false});
}
