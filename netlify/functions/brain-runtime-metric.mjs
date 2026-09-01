import {getUser} from '@netlify/identity';
import {createRuntimeMetricHandler} from '../../platform/api/runtime-metric-handler.mjs';

const ingestUrl=()=>String(process.env.BRAIN_RUNTIME_METRIC_INGEST_URL||'').trim();
async function writeMetric(metric,authorization){
  const url=ingestUrl();
  if(!url){const error=new Error('metrics ingest unconfigured');error.code='METRICS_STORE_UNCONFIGURED';throw error;}
  if(!String(authorization||'').startsWith('Bearer ')){const error=new Error('metric authorization unavailable');error.code='UNAUTHENTICATED';throw error;}
  const response=await fetch(url,{method:'POST',headers:{authorization,'content-type':'application/json','accept':'application/json'},body:JSON.stringify(metric)});
  if(!response.ok){const error=new Error(`runtime metric ingest failed: ${response.status}`);error.code=response.status===401?'UNAUTHENTICATED':'METRIC_PERSIST_FAILED';throw error;}
}

export default async request=>{
  const authorization=request.headers.get('authorization')||'';
  const handler=createRuntimeMetricHandler({getUser:()=>getUser(),writeMetric:metric=>writeMetric(metric,authorization)});
  return handler(request);
};
export const config={path:'/api/brain-runtime-metric'};
