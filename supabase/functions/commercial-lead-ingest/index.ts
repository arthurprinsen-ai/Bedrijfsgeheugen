import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_HASH='0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75';
const ORIGIN='https://www.bedrijfsgeheugen.nl';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown,max=500)=>String(v??'').trim().slice(0,max);
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function validEmail(v:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=200;}
function validCanonical(v:string){return !v||v===`${ORIGIN}/`||v.startsWith(`${ORIGIN}/`);}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  const token=req.headers.get('x-bg-service-token')||'';
  if(await sha256(token)!==TOKEN_HASH)return json({error:'UNAUTHORIZED'},401);
  let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
  if(String(body?.action||'')!=='lead')return json({error:'INVALID_ACTION'},400);
  const lead=body?.lead||{};
  const email=clean(lead.email,200).toLowerCase();
  const idempotencyKey=clean(lead.idempotency_key,300);
  const source=clean(lead.source,120);
  const canonical=clean(lead.canonical,1000);
  const attributionRootKey=clean(lead.attribution_root_key,300);
  if(!validEmail(email)||!idempotencyKey||!source||!validCanonical(canonical))return json({error:'INVALID_LEAD'},422);
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const row={idempotency_key:idempotencyKey,source,email,canonical:canonical||null,attribution_root_key:attributionRootKey||null,status:'new',metadata:{}};
  const {data,error}=await client.from('commercial_leads').upsert(row,{onConflict:'idempotency_key',ignoreDuplicates:true}).select('lead_id,idempotency_key,status,created_at,expires_at').maybeSingle();
  if(error)return json({error:'LEAD_STORE_FAILED',detail:error.message.slice(0,300)},500);
  if(data)return json({stored:true,deduped:false,lead:data},201);
  const {data:existing,error:readError}=await client.from('commercial_leads').select('lead_id,idempotency_key,status,created_at,expires_at').eq('idempotency_key',idempotencyKey).maybeSingle();
  if(readError||!existing)return json({error:'LEAD_READBACK_FAILED'},500);
  return json({stored:true,deduped:true,lead:existing},200);
});
