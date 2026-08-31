import {createSupabaseRecordAdapter} from './supabase-record-adapter.mjs';

const trimSlash=value=>String(value||'').replace(/\/+$/,'');
const error=(code,message)=>Object.assign(new Error(message),{code});

function createSupabaseRestClient({url,serviceRoleKey,fetchImpl=globalThis.fetch}){
  const base=trimSlash(url);
  if(typeof fetchImpl!=='function') throw error('BRAIN_CANONICAL_STORE_FETCH_UNAVAILABLE','Canonical Supabase store requires fetch');
  const headers={apikey:serviceRoleKey,authorization:`Bearer ${serviceRoleKey}`,'content-type':'application/json'};
  async function request(path,{method='GET',body=null}={}){
    const response=await fetchImpl(`${base}/rest/v1/${path}`,{method,headers,body:body===null?undefined:JSON.stringify(body)});
    let data=null;
    try{data=await response.json();}catch{}
    if(!response.ok) return {data:null,error:{code:String(response.status),message:data?.message||data?.error||`Supabase HTTP ${response.status}`}};
    return {data,error:null};
  }
  return Object.freeze({
    rpc(name,args){return request(`rpc/${encodeURIComponent(name)}`,{method:'POST',body:args});},
    from(table){
      const params=new URLSearchParams();
      const chain={
        select(value='*'){params.set('select',value);return chain;},
        eq(column,value){params.set(column,`eq.${value}`);return chain;},
        order(column,{ascending=true}={}){params.set('order',`${column}.${ascending?'asc':'desc'}`);return request(`${encodeURIComponent(table)}?${params.toString().replace(/%2A/g,'*').replace(/%2E/g,'.')}`);}
      };
      return chain;
    }
  });
}

export function createBrainRuntimeAdapter({env=process.env,blobAdapter=null,fetchImpl=globalThis.fetch}={}){
  const context=String(env.CONTEXT||env.NETLIFY_CONTEXT||'').toLowerCase();
  const production=context==='production';
  const backend=String(env.BRAIN_STORE_BACKEND||'supabase').trim().toLowerCase();
  if(backend==='blob'){
    if(production) throw error('BRAIN_NONCANONICAL_STORE_FORBIDDEN','Production Brain runtime cannot use Netlify Blobs as canonical store');
    if(!blobAdapter) throw error('BRAIN_BLOB_STORE_UNCONFIGURED','Explicit blob backend requires a blob adapter');
    return blobAdapter;
  }
  if(backend!=='supabase') throw error('BRAIN_STORE_BACKEND_UNSUPPORTED',`Unsupported Brain store backend: ${backend}`);
  const url=String(env.SUPABASE_URL||'').trim();
  const serviceRoleKey=String(env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!url||!serviceRoleKey) throw error('BRAIN_CANONICAL_STORE_UNCONFIGURED','Canonical Supabase Brain store requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  return createSupabaseRecordAdapter(createSupabaseRestClient({url,serviceRoleKey,fetchImpl}));
}
