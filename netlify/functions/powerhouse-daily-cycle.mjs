import { runPowerhouseDaily, getPowerhouseHealth } from './_powerhouse-core-client.mjs';

export async function runDailyCycle({runDate=null,coreOptions={}}={}){
  const health=await getPowerhouseHealth(coreOptions);
  if(!health?.ok||health?.unifiedCore!==true||health?.makeCriticalPath!==false)throw new Error('POWERHOUSE_UNIFIED_CORE_UNHEALTHY');
  const result=await runPowerhouseDaily(runDate,coreOptions);
  if(!result?.ok||!result?.state)throw new Error('POWERHOUSE_DAILY_CYCLE_FAILED');
  return result;
}

export default async function handler(input={}){
  const dependencyInjection=input&&typeof input==='object'&&!(input instanceof Request)&&('coreOptions' in input||'runDate' in input);
  try{
    const result=await runDailyCycle(dependencyInjection?input:{});
    return Response.json({ok:true,...result},{status:200,headers:{'cache-control':'no-store'}});
  }catch(error){
    console.error('POWERHOUSE_DAILY_CYCLE_DEGRADED',error);
    return Response.json({ok:false,state:'degraded',error:'POWERHOUSE_DAILY_CYCLE_DEGRADED',message:String(error?.message||error)},{status:503,headers:{'cache-control':'no-store'}});
  }
}

export const config={schedule:'30 6 * * *'};
