const allowedMetrics=new Set(['cached_ms','interactive_ms']);
const clean=v=>String(v??'').trim();
const safeMetadata=input=>{const out={};for(const key of ['navigationType','effectiveType','deviceClass']){const value=input?.[key];if(value!==undefined&&value!==null&&clean(value)) out[key]=clean(value).slice(0,64);}return out;};
export function normalizeRuntimeMetric(input={}){
  const surface=clean(input.surface),route=clean(input.route),metricName=clean(input.metricName);const metricValueMs=Number(input.metricValueMs);
  if(!surface||!route||!allowedMetrics.has(metricName)||!Number.isFinite(metricValueMs)||metricValueMs<0||metricValueMs>300000) throw new TypeError('invalid runtime metric');
  return Object.freeze({surface:surface.slice(0,64),route:route.slice(0,256),metricName,metricValueMs,cacheState:clean(input.cacheState).slice(0,32)||null,revision:clean(input.revision).slice(0,128)||null,sessionId:clean(input.sessionId).slice(0,128)||null,metadata:Object.freeze(safeMetadata(input.metadata||{}))});
}
export function assessRuntimeSlo({p95CachedMs,p95InteractiveMs,samples}={}, {cachedTargetMs=1000,interactiveTargetMs=2000,minSamples=10}={}){
  const count=Number(samples)||0;if(count<minSamples) return Object.freeze({status:'NOT_PROVEN',samples:count,breaches:Object.freeze([])});
  const breaches=[];if(Number(p95CachedMs)>=cachedTargetMs) breaches.push('cached_ms');if(Number(p95InteractiveMs)>=interactiveTargetMs) breaches.push('interactive_ms');
  return Object.freeze({status:breaches.length?'FAIL':'PASS',samples:count,breaches:Object.freeze(breaches),targets:Object.freeze({cached_ms:cachedTargetMs,interactive_ms:interactiveTargetMs})});
}
