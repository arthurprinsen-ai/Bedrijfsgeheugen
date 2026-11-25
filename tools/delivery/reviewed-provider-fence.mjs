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
