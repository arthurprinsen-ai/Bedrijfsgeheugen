import postgres from 'npm:postgres@3.4.7';

const DB_REF='adhjwmvyoixzjtmiroln';
const DB_POOLER_HOST='aws-0-eu-central-1.pooler.supabase.com';
const AUTH_CACHE_MS=300_000;

let sql:ReturnType<typeof postgres>|null=null;
let cachedToken='';
let cachedUntil=0;

const clean=(value:unknown)=>String(value??'').trim();

function poolerUrl(){
  const raw=clean(Deno.env.get('SUPABASE_DB_URL'));
  if(!raw)throw new Error('SUPABASE_DB_URL_MISSING');
  const url=new URL(raw);
  url.hostname=DB_POOLER_HOST;
  url.port='6543';
  url.username='postgres.'+DB_REF;
  return url.toString();
}

function db(){
  if(!sql)sql=postgres(poolerUrl(),{
    max:1,
    prepare:false,
    connect_timeout:4,
    idle_timeout:10,
    max_lifetime:60
  });
  return sql;
}

async function expectedSchedulerToken(){
  const envToken=clean(Deno.env.get('POWERHOUSE_DAILY_SCHEDULER_TOKEN'));
  if(envToken)return {token:envToken,source:'env'};
  const now=Date.now();
  if(cachedToken&&cachedUntil>now)return {token:cachedToken,source:'cache'};
  const rows=await db().unsafe("select public.bg_geheim('powerhouse_daily_scheduler_token') as token");
  const token=clean(rows?.[0]?.token);
  if(token){
    cachedToken=token;
    cachedUntil=now+AUTH_CACHE_MS;
  }
  return {token,source:'supavisor'};
}

export async function authorizePowerhouseScheduler(request:Request){
  const provided=clean(request.headers.get('x-powerhouse-token'));
  if(!provided)return {ok:false,status:401,error:'TOKEN_REQUIRED',source:'request'};
  try{
    const expected=await expectedSchedulerToken();
    if(!expected.token)return {ok:false,status:503,error:'AUTH_SECRET_EMPTY',source:expected.source};
    if(provided!==expected.token)return {ok:false,status:401,error:'TOKEN_MISMATCH',source:expected.source};
    return {ok:true,status:200,error:null,source:expected.source};
  }catch(error){
    console.error('POWERHOUSE_SCHEDULER_AUTH_LOOKUP_FAILED',error instanceof Error?error.message:String(error));
    return {ok:false,status:503,error:'AUTH_SECRET_LOOKUP_FAILED',source:'supavisor'};
  }
}
