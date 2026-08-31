const DEFAULT_STATE_ENDPOINT='/.netlify/functions/portal-state';
const DEFAULT_METRIC_ENDPOINT='/.netlify/functions/brain-runtime-metric';
const clean=v=>String(v??'').trim();

export async function loadCanonicalPortalState({fetchFn=globalThis.fetch,stateEndpoint=DEFAULT_STATE_ENDPOINT,fallback=()=>null}={}){
  try{
    const response=await fetchFn(stateEndpoint,{method:'GET',credentials:'same-origin',headers:{accept:'application/json'}});
    if(!response?.ok) return fallback();
    const body=await response.json();
    return body?.data&&typeof body.data==='object'?body.data:fallback();
  }catch{return fallback();}
}

export function createRuntimeReporter({fetchFn=globalThis.fetch,metricEndpoint=DEFAULT_METRIC_ENDPOINT,revision='',storage=globalThis.sessionStorage,sessionId='',surface='klantportaal'}={}){
  const exactRevision=clean(revision);
  const sid=clean(sessionId)||`portal-${Date.now().toString(36)}`;
  return Object.freeze({
    async reportElapsed(metricName,elapsedMs,{route='/klantportaal.html',cacheState=null,metadata={}}={}){
      const name=clean(metricName);
      const value=Math.round(Number(elapsedMs));
      if(!['cached_ms','interactive_ms'].includes(name)||!Number.isFinite(value)||value<0) return false;
      const dedupeKey=`bg:rum:${surface}:${route}:${name}:${exactRevision||'unknown'}`;
      try{if(storage?.getItem(dedupeKey)) return false;}catch{}
      const body={surface,route,metricName:name,metricValueMs:value,cacheState,revision:exactRevision||null,sessionId:sid,metadata};
      const response=await fetchFn(metricEndpoint,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(body)});
      if(!response?.ok) return false;
      try{storage?.setItem(dedupeKey,'1');}catch{}
      return true;
    }
  });
}

export async function resolveProductionRevision({fetchFn=globalThis.fetch,url='/release.json'}={}){
  try{const response=await fetchFn(url,{credentials:'same-origin',cache:'no-store'});if(!response?.ok)return '';const body=await response.json();const ref=clean(body?.commit_ref);return /^[a-f0-9]{40}$/i.test(ref)?ref:'';}catch{return '';}
}
