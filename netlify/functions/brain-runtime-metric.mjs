import {getUser} from '@netlify/identity';
import {createRuntimeMetricHandler} from '../../platform/api/runtime-metric-handler.mjs';
const endpoint=()=>String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const serviceKey=()=>String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
async function writeMetric(metric){
  const base=endpoint(),key=serviceKey();if(!base||!key){const error=new Error('metrics store unconfigured');error.code='METRICS_STORE_UNCONFIGURED';throw error;}
  const response=await fetch(`${base}/rest/v1/brain_runtime_metrics`,{method:'POST',headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json',prefer:'return=minimal'},body:JSON.stringify({tenant_id:metric.tenantId,surface:metric.surface,route:metric.route,metric_name:metric.metricName,metric_value_ms:metric.metricValueMs,cache_state:metric.cacheState,revision:metric.revision,session_id:metric.sessionId,metadata:metric.metadata})});
  if(!response.ok) throw new Error(`runtime metric write failed: ${response.status}`);
}
const handler=createRuntimeMetricHandler({getUser:()=>getUser(),writeMetric});
export default async request=>handler(request);
export const config={path:'/api/brain-runtime-metric'};
