import {normalizeRuntimeMetric} from '../../brain/operating-loop/runtime-telemetry.mjs';
import {resolveIdentityTenant} from '../read-models/portal-server-state.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
export function createRuntimeMetricHandler({getUser,writeMetric}={}){
  if(typeof getUser!=='function') throw new TypeError('getUser required');if(typeof writeMetric!=='function') throw new TypeError('writeMetric required');
  return async request=>{
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    const user=await getUser(request);if(!user?.id) return reply({error:'UNAUTHENTICATED'},401);const tenantId=resolveIdentityTenant(user);if(!tenantId) return reply({error:'TENANT_UNRESOLVED'},403);
    let body;try{body=await request.json();}catch{return reply({error:'INVALID_JSON'},400);}
    let metric;try{metric=normalizeRuntimeMetric(body);}catch(error){return reply({error:'INVALID_METRIC',message:error.message},400);}
    try{await writeMetric({tenantId,...metric});return reply({accepted:true},202);}catch(error){if(error?.code==='METRICS_STORE_UNCONFIGURED') return reply({error:error.code},503);throw error;}
  };
}
