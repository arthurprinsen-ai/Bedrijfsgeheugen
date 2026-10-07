const DISPATCH_TIMEOUT_MS=5_000;

function requiredEnv(name){
  const value=Netlify.env.get(name);
  if(!value)throw new Error('HEARTBEAT_SCHEDULE_CONFIG_MISSING:'+name);
  return value;
}

export default async function handler(){
  const siteUrl=requiredEnv('URL').replace(/\/$/,'');
  const token=requiredEnv('BG_PORTAL_EU_SERVICE_TOKEN');

  const response=await fetch(siteUrl+'/.netlify/functions/powerhouse-commercial-heartbeat-background',{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-bg-service-token':token
    },
    body:JSON.stringify({source:'netlify-scheduled-dispatch'}),
    signal:AbortSignal.timeout(DISPATCH_TIMEOUT_MS)
  });

  if(response.status!==202){
    throw new Error('HEARTBEAT_BACKGROUND_DISPATCH_FAILED:'+response.status);
  }

  console.log(JSON.stringify({
    event:'powerhouse-commercial-heartbeat-dispatch',
    status:response.status,
    scheduler:'netlify',
    cadence:'2-57/5 * * * *'
  }));
}

export const config={schedule:'2-57/5 * * * *'};
