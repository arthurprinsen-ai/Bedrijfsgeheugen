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

// Provider calls are bounded and run only after the admin/tenant authorization gate.
// Each provider supplies independent identity. Unknown is never treated as passed.
async function releaseProviderEvidence(){
  const ghToken=String(Netlify.env.get('GITHUB_TOKEN')||'').trim();
  const netlifyToken=String(Netlify.env.get('NETLIFY_AUTH_TOKEN')||'').trim();
  const siteId='fd527056-493a-4d8a-8125-d00370104fa3';
  const read=async(url,token)=>{
    if(!token)return null;
    try{
      const result=await fetch(url,{headers:{authorization:`Bearer ${token}`,accept:'application/json'},signal:AbortSignal.timeout(5000)});
      if(!result.ok)return null;
      return await result.json();
    }catch{return null;}
  };
  const [main,site]=await Promise.all([
    read('https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen/git/ref/heads/main',ghToken),
    read(`https://api.netlify.com/api/v1/sites/${siteId}`,netlifyToken)
  ]);
  const head=/^[a-f0-9]{40}$/.test(main?.object?.sha||'')?main.object.sha:null;
  const deployId=site?.published_deploy?.id||null;
  const deploy=deployId?await read(`https://api.netlify.com/api/v1/deploys/${deployId}`,netlifyToken):null;
  const published=/^[a-f0-9]{40}$/.test(deploy?.commit_ref||'')?deploy.commit_ref:null;
  const repoUrl='https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen';
  const [checks,compare]=await Promise.all([
    head?read(`${repoUrl}/commits/${head}/check-runs?per_page=100`,ghToken):null,
    head&&published&&head!==published?read(`${repoUrl}/compare/${published}...${head}`,ghToken):null
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
  const deploymentReady=deploy?.state==='ready';
  // A successful published deploy does not prove it contains the newest commit.
  const matches=Boolean(head&&published&&head===published&&deploymentReady);
  return {
    github:{merged:Boolean(head),requiredChecks},
    deployment:{required,reason,state:required===true&&matches?'success':required===true?'pending':'unknown'},
    production:{checked:Boolean(deploy),fresh:Boolean(deploy?.published_at&&Date.now()-Date.parse(deploy.published_at)<86400000),matchesExpectedRelease:matches},
    providerIdentity:{githubHeadSha:head,netlifyPublishedSha:published,netlifyDeployId:deployId},
    evidenceStatus:head&&published&&checks?'PROVIDER_IDENTITIES_AND_CHECKS_READ':'PROVIDER_READBACK_INCOMPLETE'
  };
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
    const [supabaseInventory,releaseEvidence]=await Promise.all([loadSupabaseSystemMapInventory(),releaseProviderEvidence()]);
    return reply({ ...projection, observability:{...(projection.observability||{}),releaseEvidence}, systemMap:{...POWERHOUSE_SYSTEM_MAP,supabaseInventory} },200);
  }catch(error){
    if(error?.code==='OBJECT_ACCESS_DENIED')return reply({error:error.code},403);
    return reply({error:'OBSERVABILITY_UNAVAILABLE'},503);
  }
};

export const config={path:'/api/powerhouse-observability'};
