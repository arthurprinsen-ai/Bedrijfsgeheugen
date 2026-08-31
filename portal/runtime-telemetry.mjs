const endpoint='/api/brain-runtime-metric';
const revision=()=>document.querySelector('meta[name="bg-revision"]')?.content||null;
const sessionId=()=>{try{let id=sessionStorage.getItem('bg-rum-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('bg-rum-session',id);}return id;}catch{return null;}};
const send=payload=>{try{fetch(endpoint,{method:'POST',credentials:'include',keepalive:true,headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});}catch{}};
const deviceClass=()=>innerWidth<640?'mobile':innerWidth<1024?'tablet':'desktop';
export function startPortalRuntimeTelemetry(){
  if(typeof window==='undefined'||typeof performance==='undefined') return;
  const nav=performance.getEntriesByType?.('navigation')?.[0];
  const base={surface:'portal',route:location.pathname,revision:revision(),sessionId:sessionId(),metadata:{navigationType:nav?.type||'unknown',effectiveType:navigator.connection?.effectiveType||'unknown',deviceClass:deviceClass()}};
  const cached=performance.getEntriesByName?.('bg-cache-ready')?.[0];
  if(cached) send({...base,metricName:'cached_ms',metricValueMs:Math.max(0,cached.startTime)});
  const reportInteractive=()=>{
    const value=Math.max(0,performance.now());send({...base,metricName:'interactive_ms',metricValueMs:value,cacheState:cached?'hit':'unknown'});
  };
  if(document.readyState==='complete') requestAnimationFrame(()=>requestAnimationFrame(reportInteractive));
  else addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(reportInteractive)),{once:true});
}
startPortalRuntimeTelemetry();
