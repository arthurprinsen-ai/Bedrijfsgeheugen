import { getStore, getDeployStore } from '@netlify/blobs';
import { cmsGateway } from './_cms-gateway.mjs';

const STORE='bg-cms-public-cache';
const FRESH_MS=30_000;
const STALE_MS=15*60_000;
const BREAKER_MS=30_000;
const GATEWAY_TIMEOUT_MS=2_500;
const BREAKER_KEY='_control/portal-state-eu-breaker';

function json(body,status=200,cache='miss'){
  return Response.json(body,{status,headers:{
    'cache-control':'public, max-age=30, stale-while-revalidate=300',
    'content-type':'application/json; charset=utf-8',
    'x-bg-cms-cache':cache
  }});
}
function storeForContext(context){return context?.deploy?.context==='production'?getStore(STORE,{consistency:'strong'}):getDeployStore(STORE);}
function routeKey(surface,locale,route){return 'route/'+surface+'/'+locale+'/'+encodeURIComponent(route);}
function ageMs(record,now){const t=Date.parse(String(record?.stored_at||''));return Number.isFinite(t)?Math.max(0,now-t):Number.POSITIVE_INFINITY;}
function publicPayload(record,{degraded=false,reason=null}={}){
  const data=record?.data&&typeof record.data==='object'?record.data:{items:[]};
  return {...data,items:Array.isArray(data.items)?data.items:[],degraded,reason};
}

export default async function handler(request,context){
  if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405);
  const url=new URL(request.url);
  const surface=String(url.searchParams.get('surface')||'website');
  const locale=String(url.searchParams.get('locale')||'nl-NL');
  const route=String(url.searchParams.get('route')||'/');
  const store=storeForContext(context);
  const key=routeKey(surface,locale,route);
  const now=Date.now();
  const cached=await store.get(key,{type:'json'}).catch(()=>null);
  const age=ageMs(cached,now);

  if(cached&&age<=FRESH_MS)return json(publicPayload(cached),200,'fresh');

  const breaker=await store.get(BREAKER_KEY,{type:'json'}).catch(()=>null);
  const openUntil=Number(breaker?.open_until||0);
  if(openUntil>now){
    if(cached&&age<=STALE_MS)return json(publicPayload(cached,{degraded:true,reason:'DATA_API_CIRCUIT_OPEN'}),200,'stale');
    return json({items:[],surface,locale,route,degraded:true,reason:'DATA_API_CIRCUIT_OPEN'},200,'degraded');
  }

  try{
    const data=await cmsGateway({action:'cms_public',surface,locale,route},{timeoutMs:GATEWAY_TIMEOUT_MS});
    await Promise.all([
      store.setJSON(key,{stored_at:new Date(now).toISOString(),data}),
      store.setJSON(BREAKER_KEY,{open_until:0,updated_at:new Date(now).toISOString(),reason:null})
    ]);
    return json(data,200,'origin');
  }catch(error){
    const reason=String(error?.message||'CMS_PUBLIC_BACKEND_UNAVAILABLE').slice(0,120);
    await store.setJSON(BREAKER_KEY,{open_until:now+BREAKER_MS,updated_at:new Date(now).toISOString(),reason}).catch(()=>{});
    if(cached&&age<=STALE_MS)return json(publicPayload(cached,{degraded:true,reason}),200,'stale');
    return json({items:[],surface,locale,route,degraded:true,reason},200,'degraded');
  }
}

export const config={path:'/api/cms-public'};
