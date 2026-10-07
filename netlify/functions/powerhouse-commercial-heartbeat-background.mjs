import { timingSafeEqual } from 'node:crypto';

const MAX_ATTEMPTS=4;
const DELAYS_MS=[0,5_000,15_000,30_000];
const EDGE_TIMEOUT_MS=120_000;

function requiredEnv(name){
  const value=Netlify.env.get(name);
  if(!value)throw new Error('HEARTBEAT_CONFIG_MISSING:'+name);
  return value;
}

function authorized(request){
  const provided=request.headers.get('x-bg-service-token')||'';
  const expected=requiredEnv('BG_PORTAL_EU_SERVICE_TOKEN');
  const a=Buffer.from(provided);
  const b=Buffer.from(expected);
  return a.length===b.length&&a.length>0&&timingSafeEqual(a,b);
}

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

async function observeDataSovereignty({siteUrl,baseUrl,token}){
  try{
    const proofResponse=await fetch(siteUrl+'/api/data-sovereignty/runtime-proof',{
      headers:{accept:'application/json'},
      signal:AbortSignal.timeout(5_000)
    });
    const proof=await proofResponse.json().catch(()=>null);
    if(!proofResponse.ok||!proof)return {recorded:false,verified:false,status:'PROOF_UNAVAILABLE'};

    const observationResponse=await fetch(baseUrl+'/functions/v1/portal-state-eu',{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'x-bg-service-token':token,
        'x-region':'eu-central-1'
      },
      body:JSON.stringify({
        action:'data_sovereignty_provider_observe',
        tenantId:'canonical',
        providerKey:'netlify',
        observedRegion:proof.runtimeRegion,
        configuredStorageRegion:proof.blobRegionTarget||proof.storageRegion||null,
        deployId:proof.deployId,
        commitRef:proof.commitRef,
        source:'powerhouse-heartbeat',
        evidence:{
          contract:proof.contract,
          runtimeRegionObservation:proof.runtimeRegionObservation===true,
          euOnlyGuarantee:proof.euOnlyGuarantee===true,
          limitation:proof.limitation||null,
          proofObservedAt:proof.observedAt
        }
      }),
      signal:AbortSignal.timeout(10_000)
    });
    const observation=await observationResponse.json().catch(()=>null);
    if(!observationResponse.ok)return {recorded:false,verified:false,status:'OBSERVATION_WRITE_FAILED'};
    return {recorded:true,verified:observation?.observation?.verified===true,status:'OBSERVED',...observation?.observation};
  }catch{
    return {recorded:false,verified:false,status:'OBSERVATION_UNAVAILABLE'};
  }
}

export default async function handler(request){
  if(request.method!=='POST')throw new Error('HEARTBEAT_BACKGROUND_POST_ONLY');
  if(!authorized(request))throw new Error('HEARTBEAT_BACKGROUND_UNAUTHORIZED');

  const baseUrl=requiredEnv('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const siteUrl=requiredEnv('URL').replace(/\/$/,'');
  const token=requiredEnv('BG_PORTAL_EU_SERVICE_TOKEN');

  let lastFailure='UNKNOWN';
  for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
    if(DELAYS_MS[attempt-1]>0)await sleep(DELAYS_MS[attempt-1]);
    try{
      const sovereigntyObservation=await observeDataSovereignty({siteUrl,baseUrl,token});
      const response=await fetch(baseUrl+'/functions/v1/powerhouse-commercial-heartbeat-runner',{
        method:'POST',
        headers:{
          'content-type':'application/json',
          'x-bg-service-token':token,
          'x-region':'eu-central-1'
        },
        body:JSON.stringify({source:'netlify-background',attempt}),
        signal:AbortSignal.timeout(EDGE_TIMEOUT_MS)
      });
      const body=await response.json().catch(()=>null);
      if(response.ok&&body?.ok===true&&body?.durable_readback_verified===true){
        console.log(JSON.stringify({
          event:'powerhouse-commercial-heartbeat',
          state:body.state,
          durable_readback_verified:body.durable_readback_verified===true,
          sovereignty_observed:sovereigntyObservation?.recorded===true,
          sovereignty_verified:sovereigntyObservation?.verified===true,
          sovereignty_region:sovereigntyObservation?.observedRegion||null,
          attempt,
          receipt:body.receipt||null
        }));
        return;
      }
      lastFailure='HTTP_'+response.status+':'+String(body?.error||'UNKNOWN');
    }catch(error){
      const code=String(error?.message||'');
      lastFailure=(error?.name==='TimeoutError'||error?.name==='AbortError')?'EDGE_TIMEOUT':'EDGE_NETWORK';
    }
    console.warn(JSON.stringify({event:'powerhouse-commercial-heartbeat-retry',attempt,lastFailure}));
  }

  throw new Error('COMMERCIAL_HEARTBEAT_DELIVERY_FAILED:'+lastFailure);
}

export const config={};
