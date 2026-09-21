const clean=v=>String(v??'').trim();
const json=(body,status=200)=>Response.json(body,{status,headers:{
  'cache-control':'private, no-store',
  'pragma':'no-cache',
  'x-robots-tag':'noindex, nofollow, noarchive',
  'x-content-type-options':'nosniff'
}});

async function callSetup(baseUrl,serviceToken,payload){
  const response=await fetch(`${baseUrl}/functions/v1/powerhouse-composio-instagram-setup`,{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-service-token':serviceToken},
    body:JSON.stringify(payload)
  });
  const data=await response.json().catch(()=>({error:'INVALID_EDGE_RESPONSE'}));
  return {response,data};
}

export async function syncComposioSecret(){
  const apiKey=clean(process.env.COMPOSIO_API_KEY);
  const baseUrl=clean(process.env.BG_PORTAL_EU_SUPABASE_URL).replace(/\/$/,'');
  const serviceToken=clean(process.env.BG_PORTAL_EU_SERVICE_TOKEN);
  if(!apiKey||!baseUrl||!serviceToken)return json({ok:false,error:'SERVER_CONFIG'},500);

  const status=await callSetup(baseUrl,serviceToken,{action:'status'});
  if(status.response.ok&&status.data?.api_key_present===true){
    return json({ok:true,synced:false,state:status.data?.state||null,ready:status.data?.ready===true,active_accounts:Number(status.data?.active_accounts||0)});
  }

  const sync=await callSetup(baseUrl,serviceToken,{action:'set_api_key',api_key:apiKey});
  if(!sync.response.ok)return json({ok:false,error:'COMPOSIO_SECRET_SYNC_FAILED',state:sync.data?.state||null,detail:sync.data?.error||null},502);

  const result={
    ok:true,
    synced:true,
    state:sync.data?.state||null,
    ready:sync.data?.ready===true,
    active_accounts:Number(sync.data?.active_accounts||0),
    secret_values_exposed:false
  };
  return json(result);
};

export default async ()=>syncComposioSecret();

export const config={schedule:'17 4 * * *'};
