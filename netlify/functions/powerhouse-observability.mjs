import { getUser } from '@netlify/identity';
import adapterContract from '../../config/brain-platform-adapters.json' with { type: 'json' };
import { createOperatingLoopStore } from '../../brain/operating-loop/store.mjs';
import { createRemoteRecordAdapter } from '../../brain/operating-loop/remote-record-adapter.mjs';
import { resolveIdentityTenant } from '../../platform/read-models/portal-server-state.mjs';
import { principalFromUser } from '../../brain/operating-loop/object-access-policy.mjs';
import { isPowerhouseAdmin } from '../../platform/auth/powerhouse-admin.mjs';
import { POWERHOUSE_SYSTEM_MAP } from '../../platform/system-map/canonical-system-map.mjs';
import { deriveNetlifyDeploymentApplicability } from '../../tools/delivery/netlify-deployment-applicability.mjs';
import deliveryPolicy from '../../config/brain-delivery-system.json' with { type: 'json' };
import { loadFailureCoverage } from '../../brain/observability/failure-coverage-projection.mjs';
import { loadCycleEvidenceCoverage } from '../../brain/observability/cycle-evidence-coverage.mjs';

const reply=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store',
  'pragma':'no-cache',
  'vary':'authorization, cookie',
  'x-robots-tag':'noindex, nofollow, noarchive',
  'x-content-type-options':'nosniff'
}});

const authorityUrl=()=>String(Netlify.env.get('BRAIN_OPERATING_AUTHORITY_URL')||'').trim();
const adminEmails=()=>String(Netlify.env.get('POWERHOUSE_ADMIN_EMAILS')||'').trim();


async function loadSupabaseSystemMapInventory(){
  const baseUrl=String(Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  const serviceToken=String(Netlify.env.get('BG_PORTAL_EU_SERVICE_TOKEN')||'').trim();
  if(!baseUrl||!serviceToken)return {status:'UNAVAILABLE',reason:'SUPABASE_INVENTORY_CONFIG_MISSING',inventory:null};
  try{
    const response=await fetch(`${baseUrl}/functions/v1/powerhouse-system-map-inventory`,{
      method:'POST',
      headers:{'content-type':'application/json','x-bg-service-token':serviceToken}
    });
    const body=await response.json().catch(()=>null);
    if(!response.ok)return {status:'UNAVAILABLE',reason:body?.error||`SUPABASE_INVENTORY_${response.status}`,inventory:null};
    return {status:'LIVE',reason:null,inventory:body?.inventory||null,generatedAt:body?.generatedAt||null};
  }catch(error){
    return {status:'UNAVAILABLE',reason:error?.message||'SUPABASE_INVENTORY_READ_FAILED',inventory:null};
  }
}

// Read-only register view for the admin "oud versus nieuw" tab. The SQL function is service_role only.
async function loadExperimentChanges(){
  const baseUrl=String(Netlify.env.get('SUPABASE_URL')||Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim().replace(/\/$/,'');
  const key=String(Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')||'').trim();
  if(!baseUrl||!key)return {status:'UNAVAILABLE',reason:'EXPERIMENT_REGISTER_CONFIG_MISSING',rows:[]};
  try{
    const response=await fetch(`${baseUrl}/rest/v1/rpc/bg_experiment_wijzigingen_overzicht`,{
      method:'POST',
      headers:{'content-type':'application/json',apikey:key,authorization:`Bearer ${key}`},
      body:JSON.stringify({p_limiet:100}),
      signal:AbortSignal.timeout(5000)
    });
    if(!response.ok)return {status:'UNAVAILABLE',reason:`EXPERIMENT_REGISTER_${response.status}`,rows:[]};
    const rows=await response.json().catch(()=>null);
    return Array.isArray(rows)?{status:'LIVE',reason:'',rows}:{status:'UNAVAILABLE',reason:'EXPERIMENT_REGISTER_SHAPE_INVALID',rows:[]};
  }catch(error){
    return {status:'UNAVAILABLE',reason:'EXPERIMENT_REGISTER_READ_FAILED',rows:[]};
  }
}

// Provider calls are bounded and run only after the admin/tenant authorization gate.
// Each provider supplies independent identity. Unknown is never treated as passed.
let releaseEvidenceCache=null;
let releaseEvidenceCacheAt=0;
async function releaseProviderEvidence(){
  if(releaseEvidenceCache&&Date.now()-releaseEvidenceCacheAt<300000)return releaseEvidenceCache;
  // Public repository checks and the Netlify-published release manifest need no long-lived credentials.
  const read=async(url)=>{
    try{
      const result=await fetch(url,{headers:{accept:'application/vnd.github+json'},signal:AbortSignal.timeout(5000)});
      if(!result.ok)return null;
      return await result.json();
    }catch{return null;}
  };
  const [main,manifest]=await Promise.all([
    read('https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen/git/ref/heads/main'),
    read('https://www.bedrijfsgeheugen.nl/release.json')
  ]);
  const head=/^[a-f0-9]{40}$/.test(main?.object?.sha||'')?main.object.sha:null;
  const validManifest=manifest?.contract==='BRAIN-DELIVERY-v2'&&manifest?.context==='production'&&
    /^[a-f0-9]{40}$/.test(manifest?.commit_ref||'')&&typeof manifest?.deploy_id==='string'&&manifest.deploy_id.length>5;
  const published=validManifest?manifest.commit_ref:null;
  const deployId=validManifest?manifest.deploy_id:null;
  const repoUrl='https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen';
  const [checks,compare]=await Promise.all([
    head?read(`${repoUrl}/commits/${head}/check-runs?per_page=100`):null,
    head&&published&&head!==published?read(`${repoUrl}/compare/${published}...${head}`):null
  ]);
  const requiredContexts=['CodeQL javascript-typescript','hygiene / admission','test'];
  const matching=requiredContexts.map(name=>(checks?.check_runs||[]).filter(run=>run.name===name&&run.app?.id===15368).sort((a,b)=>String(b.completed_at||'').localeCompare(String(a.completed_at||'')))[0]);
  const requiredChecks=matching.every(run=>run?.conclusion==='success')?'passed':matching.some(run=>run&&run.conclusion&&run.conclusion!=='success')?'failed':'unknown';
  // If provider commits are equal, no deployment is necessary. Otherwise
  // rely on the canonical path classifier, never on the SHA mismatch alone.
  let required=null,reason='APPLICABILITY_UNVERIFIED';
  if(head&&published&&head===published){required=false;reason='production-sha-matches-main';}
  else if(head&&published&&compare?.status==='ahead'&&Array.isArray(compare.files)&&compare.truncated!==true){
    const paths=compare.files.map(file=>file.filename);
    try{
      const outcome=deriveNetlifyDeploymentApplicability({changedPaths:paths,headSha:head,policy:deliveryPolicy});
      required=outcome.deploymentRequired;
      reason=outcome.reason;
    }catch{reason='APPLICABILITY_CLASSIFIER_FAILED';}
  }
  const deploymentReady=Boolean(validManifest);
  // A successful published deploy does not prove it contains the newest commit.
  const matches=Boolean(head&&published&&head===published&&deploymentReady);
  const evidence={
    github:{merged:Boolean(head),requiredChecks},
    deployment:{required,reason,state:required===true&&matches?'success':required===true?'pending':'unknown'},
    production:{checked:Boolean(validManifest),fresh:Boolean(validManifest&&Date.now()-Date.parse(manifest.generated_at)>=0&&Date.now()-Date.parse(manifest.generated_at)<31536000000),matchesExpectedRelease:matches},
    providerIdentity:{githubHeadSha:head,netlifyPublishedSha:published,netlifyDeployId:deployId},
    evidenceStatus:head&&published&&checks?'PROVIDER_IDENTITIES_AND_CHECKS_READ':'PROVIDER_READBACK_INCOMPLETE'
  };
  if(head&&published&&checks){releaseEvidenceCache=evidence;releaseEvidenceCacheAt=Date.now();}
  return evidence;
}

export default async request=>{
  if(request.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{allow:'GET'}});
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer\s+.+/i.test(authorization))return reply({error:'UNAUTHENTICATED'},401);
  const user=await getUser(request);
  if(!user?.id)return reply({error:'UNAUTHENTICATED'},401);
  if(!isPowerhouseAdmin(user,{allowedEmails:adminEmails()}))return reply({error:'POWERHOUSE_ADMIN_REQUIRED'},403);
  const tenantId=resolveIdentityTenant(user);
  if(!tenantId)return reply({error:'TENANT_UNRESOLVED'},403);
  let store;
  try{
    store=createOperatingLoopStore(createRemoteRecordAdapter({baseUrl:authorityUrl(),authorization}),{adapterContract});
  }catch(error){
    return reply({error:error?.message||'BRAIN_OPERATING_AUTHORITY_UNAVAILABLE'},503);
  }
  const principal=principalFromUser(user,tenantId);
  try{
    const projection=await store.getProjection(tenantId,{principal});
    const [supabaseInventory,releaseEvidence,experimentChanges,failureCoverage,agentCycleCoverage]=await Promise.all([loadSupabaseSystemMapInventory(),releaseProviderEvidence(),loadExperimentChanges(),loadFailureCoverage({baseUrl:String(Netlify.env.get('SUPABASE_URL')||Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim(),key:String(Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')||'').trim()}),loadCycleEvidenceCoverage({baseUrl:String(Netlify.env.get('SUPABASE_URL')||Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL')||'').trim(),key:String(Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')||'').trim()})]);
    return reply({ ...projection, observability:{...(projection.observability||{}),releaseEvidence,agentCycleCoverage}, systemMap:{...POWERHOUSE_SYSTEM_MAP,supabaseInventory,failureCoverage}, experimentChanges },200);
  }catch(error){
    if(error?.code==='OBJECT_ACCESS_DENIED')return reply({error:error.code},403);
    return reply({error:'OBSERVABILITY_UNAVAILABLE'},503);
  }
};

export const config={path:'/api/powerhouse-observability'};
