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

export default async function handler(request){
  if(request.method!=='POST')throw new Error('HEARTBEAT_BACKGROUND_POST_ONLY');
  if(!authorized(request))throw new Error('HEARTBEAT_BACKGROUND_UNAUTHORIZED');

  const baseUrl=requiredEnv('BG_PORTAL_EU_SUPABASE_URL').replace(/\/$/,'');
  const token=requiredEnv('BG_PORTAL_EU_SERVICE_TOKEN');

  let lastFailure='UNKNOWN';
  for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
    if(DELAYS_MS[attempt-1]>0)await sleep(DELAYS_MS[attempt-1]);
    try{
      const response=await fetch(baseUrl+'/functions/v1/powerhouse-commercial-heartbeat-runner',{
        method:'POST',
        headers:{
          'content-type':'application/json',
          'x-bg-service-token':token
        },
        body:JSON.stringify({source:'netlify-background',attempt}),
        signal:AbortSignal.timeout(EDGE_TIMEOUT_MS)
      });
      const body=await response.json().catch(()=>null);
      if(response.ok&&body?.ok===true&&(body?.durable_readback_verified===true||body?.state==='SKIPPED_OVERLAP')){
        console.log(JSON.stringify({
          event:'powerhouse-commercial-heartbeat',
          state:body.state,
          durable_readback_verified:body.durable_readback_verified===true,
          attempt,
          receipt:body.receipt||null
        }));
        return;
      }
      lastFailure='HTTP_'+response.status+':'+String(body?.error||'UNKNOWN');
    }catch(error){
      lastFailure=error?.name==='TimeoutError'||error?.name==='AbortError'
        ?'EDGE_TIMEOUT'
        :'EDGE_NETWORK';
    }
    console.warn(JSON.stringify({event:'powerhouse-commercial-heartbeat-retry',attempt,lastFailure}));
  }

  throw new Error('COMMERCIAL_HEARTBEAT_DELIVERY_FAILED:'+lastFailure);
}
