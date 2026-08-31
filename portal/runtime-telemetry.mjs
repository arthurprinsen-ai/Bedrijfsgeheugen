const endpoint='/api/brain-runtime-metric';
const exactRevision=/^[a-f0-9]{40}$/i;
const loadRevision=async()=>{try{const r=await fetch('/release.json',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});if(!r.ok)return null;const data=await r.json();const value=String(data?.commit_ref||'').trim();return exactRevision.test(value)?value:null}catch{return null}};
const sessionId=()=>{try{let id=sessionStorage.getItem('bg-rum-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('bg-rum-session',id);}return id;}catch{return null;}};
const sentKey=(session,route,metricName)=>`bg-rum-sent:${session||'anonymous'}:${route}:${metricName}`;
const identityCurrent=()=>{try{return window.netlifyIdentity?.currentUser?.()||null}catch{return null}};
const waitForIdentity=(timeoutMs=3000)=>{const current=identityCurrent();if(current)return Promise.resolve(current);const identity=window.netlifyIdentity;if(!identity)return Promise.resolve(null);return new Promise(resolve=>{let done=false;let timer;const finish=user=>{if(done)return;done=true;if(timer)clearTimeout(timer);resolve(user||identityCurrent())};identity.on?.('init',finish);identity.on?.('login',finish);timer=setTimeout(()=>finish(identityCurrent()),timeoutMs);});};
const authHeaders=async()=>{const user=await waitForIdentity();if(!user)return{};try{const token=await user.jwt();return token?{authorization:`Bearer ${token}`}:{}}catch{return{}}};
const send=async payload=>{if(!exactRevision.test(String(payload?.revision||'')))return false;const key=sentKey(payload.sessionId,payload.route,payload.metricName);try{if(sessionStorage.getItem(key)==='1')return false}catch{}const headers=await authHeaders();if(!headers.authorization)return false;try{const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',keepalive:true,headers:{'content-type':'application/json',...headers},body:JSON.stringify(payload)});if(!response.ok)return false;try{sessionStorage.setItem(key,'1')}catch{}return true}catch{return false}};
const deviceClass=()=>innerWidth<640?'mobile':innerWidth<1024?'tablet':'desktop';
export function startPortalRuntimeTelemetry(){
  if(typeof window==='undefined'||typeof performance==='undefined') return;
  const nav=performance.getEntriesByType?.('navigation')?.[0];
  const session=sessionId();
  const route=location.pathname;
  const revisionPromise=loadRevision();
  const metadata={navigationType:nav?.type||'unknown',effectiveType:navigator.connection?.effectiveType||'unknown',deviceClass:deviceClass()};
  const emit=async(metricName,metricValueMs,cacheState)=>{const revision=await revisionPromise;if(!revision)return false;return send({surface:'portal',route,revision,sessionId:session,metadata,metricName,metricValueMs,cacheState})};
  const cached=performance.getEntriesByName?.('bg-cache-ready')?.[0];
  if(cached){const cachedMs=Math.max(0,cached.startTime);void emit('cached_ms',cachedMs,'hit')}
  const reportInteractive=()=>{const value=Math.max(0,performance.now());void emit('interactive_ms',value,cached?'hit':'unknown')};
  if(document.readyState==='complete') requestAnimationFrame(()=>requestAnimationFrame(reportInteractive));
  else addEventListener('load',()=>requestAnimationFrame(()=>requestAnimationFrame(reportInteractive)),{once:true});
}
startPortalRuntimeTelemetry();
