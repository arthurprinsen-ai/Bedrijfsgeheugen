import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";

const TOKEN_HASH="0e8d5ba93342a281f1af6475c4451d067fbce0a3702bfd2a0981d143154114f4";
const DB_REF="adhjwmvyoixzjtmiroln";
const DB_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com";
const PROBE_CACHE_MS=30_000;

let cached:{at:number;body:Record<string,unknown>}|null=null;

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{"content-type":"application/json","cache-control":"no-store"}
});
async function sha256(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function poolerUrl(){
  const raw=String(Deno.env.get("SUPABASE_DB_URL")||"").trim();
  if(!raw)throw new Error("SUPABASE_DB_URL_MISSING");
  const url=new URL(raw);
  url.hostname=DB_POOLER_HOST;
  url.port="6543";
  url.username="postgres."+DB_REF;
  return url.toString();
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return json({ok:false,error:"GET_ONLY"},405);
  const url=new URL(req.url);
  if(url.searchParams.has("token"))return json({ok:false,error:"TOKEN_QUERY_FORBIDDEN"},400);

  const provided=String(req.headers.get("x-bg-runtime-verifier-token")||"");
  if(!provided||await sha256(provided)!==TOKEN_HASH)return json({ok:false,error:"UNAUTHORIZED"},401);

  const now=Date.now();
  if(cached&&now-cached.at<PROBE_CACHE_MS)return json({...cached.body,cached:true},200);

  const started=Date.now();
  let sql:ReturnType<typeof postgres>|null=null;
  try{
    sql=postgres(poolerUrl(),{
      max:1,
      prepare:false,
      connect_timeout:4,
      idle_timeout:5,
      max_lifetime:30
    });
    const rows=await sql`select 1::int as ok, now() as db_now`;
    const body={
      ok:rows?.[0]?.ok===1,
      state:"HEALTHY",
      transport:"supavisor-ipv4-transaction",
      elapsed_ms:Date.now()-started,
      db_now:rows?.[0]?.db_now||null,
      cached:false
    };
    cached={at:now,body};
    return json(body,200);
  }catch(error){
    const body={
      ok:false,
      state:"DEGRADED",
      transport:"supavisor-ipv4-transaction",
      error:"DB_CONNECT_DEGRADED",
      elapsed_ms:Date.now()-started,
      cached:false
    };
    cached={at:now,body};
    return json(body,200);
  }finally{
    try{if(sql)await sql.end({timeout:1});}catch{}
  }
});
