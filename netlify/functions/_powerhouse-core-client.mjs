const clean=v=>String(v??'').trim();

export function powerhouseCoreConfig(env=process.env){
  return {
    url:clean(env.POWERHOUSE_CORE_URL||env.BG_PORTAL_EU_SUPABASE_URL&&`${String(env.BG_PORTAL_EU_SUPABASE_URL).replace(/\/$/,'')}/functions/v1/powerhouse-runtime`),
    token:clean(env.POWERHOUSE_CORE_TOKEN||env.BG_POWERHOUSE_CORE_TOKEN),
  };
}

async function callCore(route,{method='GET',body,fetchFn=globalThis.fetch,env=process.env,timeoutMs=5000}={}){
  const {url,token}=powerhouseCoreConfig(env);
  if(!url)throw new Error('POWERHOUSE_CORE_URL_REQUIRED');
  if(!token)throw new Error('POWERHOUSE_CORE_TOKEN_REQUIRED');
  const response=await fetchFn(`${url.replace(/\/$/,'')}/${route}`,{
    method,
    headers:{'content-type':'application/json','x-powerhouse-token':token},
    body:body===undefined?undefined:JSON.stringify(body),
    signal:AbortSignal.timeout(timeoutMs),
  });
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(`POWERHOUSE_CORE_HTTP_${response.status}:${payload?.error||'unknown'}`);
  return payload;
}

export const ingestPowerhouseEvent=(event,options={})=>callCore('ingest',{...options,method:'POST',body:{event}});
export const recordPowerhouseOutcome=(outcome,options={})=>callCore('outcomes',{...options,method:'POST',body:outcome});
export const getPowerhouseActions=(limit=15,options={})=>callCore(`actions?limit=${Math.max(1,Math.min(50,Number(limit)||15))}`,options);
export const runPowerhouseDaily=(runDate=null,options={})=>callCore('daily',{...options,method:'POST',body:runDate?{runDate}:{}});
export const getPowerhouseLearning=(options={})=>callCore('learning',options);
export const getPowerhouseHealth=(options={})=>callCore('health',options);
