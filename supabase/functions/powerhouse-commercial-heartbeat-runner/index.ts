import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";

const DB_REF="adhjwmvyoixzjtmiroln";
const DB_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com";
const STATEMENT_TIMEOUT_MS=90_000;

let sql:ReturnType<typeof postgres>|null=null;

const clean=(value:unknown)=>String(value??"").trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{"content-type":"application/json","cache-control":"no-store"}
});

function constantTimeEqual(left:string,right:string){
  const a=new TextEncoder().encode(left);
  const b=new TextEncoder().encode(right);
  const length=Math.max(a.length,b.length);
  let diff=a.length^b.length;
  for(let i=0;i<length;i++)diff|=(a[i]??0)^(b[i]??0);
  return diff===0;
}

function poolerUrl(){
  const raw=clean(Deno.env.get("SUPABASE_DB_URL"));
  if(!raw)throw new Error("SUPABASE_DB_URL_MISSING");
  const url=new URL(raw);
  url.hostname=DB_POOLER_HOST;
  url.port="6543";
  url.username="postgres."+DB_REF;
  return url.toString();
}

function db(){
  if(!sql)sql=postgres(poolerUrl(),{
    max:1,
    prepare:false,
    connect_timeout:4,
    idle_timeout:10,
    max_lifetime:60,
    connection:{application_name:"powerhouse-commercial-heartbeat-runner"}
  });
  return sql;
}

async function runHeartbeat(){
  const startedAt=new Date().toISOString();
  return await db().begin(async tx=>{
    await tx.unsafe("set local statement_timeout = '90000ms'");
    await tx.unsafe("set local lock_timeout = '3000ms'");

    const lockRows=await tx.unsafe(
      "select pg_try_advisory_xact_lock(hashtextextended('powerhouse-commercial-heartbeat-external-v1',0)) as locked"
    );
    if(lockRows?.[0]?.locked!==true){
      return {
        ok:true,
        state:"SKIPPED_OVERLAP",
        contract:"powerhouse-commercial-heartbeat-external-v1",
        started_at:startedAt,
        durable_readback_verified:false
      };
    }

    const heartbeatRows=await tx.unsafe(
      "select public.powerhouse_commercial_heartbeat_v1(now()) as heartbeat"
    );
    const readbackRows=await tx.unsafe(
      "select occurred_at,dedupe_key,state,data_quality,confidence from public.powerhouse_runtime_events where event_type='commercial_heartbeat' and occurred_at >= transaction_timestamp()-interval '2 minutes' order by occurred_at desc limit 1"
    );
    const receipt=readbackRows?.[0]??null;
    const durable=Boolean(
      receipt &&
      String(receipt.data_quality||"")==="VERIFIED" &&
      ["actioned","observed","done"].includes(String(receipt.state||""))
    );
    if(!durable)throw new Error("HEARTBEAT_DURABLE_READBACK_MISSING");

    return {
      ok:true,
      state:"COMPLETED",
      contract:"powerhouse-commercial-heartbeat-external-v1",
      transport:"supavisor-ipv4-transaction",
      started_at:startedAt,
      completed_at:new Date().toISOString(),
      heartbeat:heartbeatRows?.[0]?.heartbeat??null,
      receipt,
      durable_readback_verified:true
    };
  });
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);

  const expected=clean(Deno.env.get("BG_PORTAL_EU_SERVICE_TOKEN"));
  const provided=clean(req.headers.get("x-bg-service-token"));
  if(!expected)return json({ok:false,error:"SERVER_AUTH_CONFIG_MISSING"},503);
  if(!provided||!constantTimeEqual(provided,expected))return json({ok:false,error:"UNAUTHORIZED"},401);

  try{
    const result=await runHeartbeat();
    return json(result,result.state==="SKIPPED_OVERLAP"?202:200);
  }catch(error){
    console.error("POWERHOUSE_COMMERCIAL_HEARTBEAT_RUNNER_FAILED",error instanceof Error?error.message:String(error));
    return json({
      ok:false,
      error:"COMMERCIAL_HEARTBEAT_FAILED",
      contract:"powerhouse-commercial-heartbeat-external-v1"
    },503);
  }
});
