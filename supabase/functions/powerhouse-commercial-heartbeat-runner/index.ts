import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";

const DB_REF="adhjwmvyoixzjtmiroln";
const DB_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com";
const STATEMENT_TIMEOUT_MS=90_000;
const SERVICE_TOKEN_HASH="0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75";

let sql:ReturnType<typeof postgres>|null=null;

const clean=(value:unknown)=>String(value??"").trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{"content-type":"application/json","cache-control":"no-store"}
});

async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
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
      const peerRows=await tx.unsafe(
        "select occurred_at,dedupe_key,state,data_quality,confidence from public.powerhouse_runtime_events where event_type='commercial_heartbeat' and occurred_at >= transaction_timestamp()-interval '2 minutes' order by occurred_at desc limit 1"
      );
      const peerReceipt=peerRows?.[0]??null;
      const peerDurable=Boolean(
        peerReceipt &&
        String(peerReceipt.data_quality||"")==="VERIFIED" &&
        ["actioned","observed","done"].includes(String(peerReceipt.state||""))
      );
      return {
        ok:peerDurable,
        state:peerDurable?"COMPLETED_BY_PEER":"SKIPPED_OVERLAP",
        contract:"powerhouse-commercial-heartbeat-external-v1",
        started_at:startedAt,
        receipt:peerReceipt,
        durable_readback_verified:peerDurable
      };
    }

    await tx.unsafe(
      "select set_config('powerhouse.external_heartbeat_owner','netlify-supabase-edge-v1',true)"
    );

    const heartbeatRows=await tx.unsafe(
      "select public.powerhouse_commercial_heartbeat_v1(now()) as heartbeat"
    );

    const sovereigntyRows=await tx.unsafe(
      "select public.powerhouse_refresh_data_sovereignty_v1() as data_sovereignty"
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
      data_sovereignty:sovereigntyRows?.[0]?.data_sovereignty??null,
      receipt,
      durable_readback_verified:true
    };
  });
}

// The EXISTING five-minute commercial Heartbeat owns these distinct lanes.
// This is not a second scheduler or a new sender: the only provider calls are
// dispatched by the three already deployed, approval- and CAS-gated executors.
// Each hourly lane has its own unique runtime receipt and database transaction.
type OutboundLane="email"|"linkedin_dm"|"linkedin_comment"|"linkedin_like";
const outboundLanes=[
  {lane:"email",executor:"powerhouse_dispatch_autonomous_outreach_v1",
   eligible:"action_type='autonomous_email' and channel='email' and ((status='prepared' and evidence->>'human_approved'='true' and due_at<=now()) or (status='waiting' and evidence#>>'{autonomous_outbound,needs_readback}'='true'))"},
  {lane:"linkedin_dm",executor:"powerhouse_dispatch_linkedin_sales_machine_v1",
   eligible:"channel='linkedin_dm' and status in ('prepared','suggested') and evidence->>'human_approved'='true' and nullif(trim(coalesce(message_draft,'')),'') is not null"},
  {lane:"linkedin_comment",executor:"powerhouse_dispatch_linkedin_comment_autopilot_v1",
   eligible:"action_type='reply_post' and channel='linkedin_personal' and status='suggested' and nullif(trim(coalesce(message_draft,'')),'') is not null and source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)' and evidence#>>'{social_execution_gate,quality_passed}'='true'"},
  {lane:"linkedin_like",executor:null,eligible:"action_type='like_post' and channel='linkedin_personal' and status='suggested'"}
] as const;
async function runOneOutboundLane(def:(typeof outboundLanes)[number]){
  try{
    return await db().begin(async tx=>{
      await tx.unsafe("set local statement_timeout = '12000ms'");
      await tx.unsafe("set local lock_timeout = '2000ms'");
      const bucketRows=await tx.unsafe("select to_char(now() at time zone 'UTC','YYYYMMDDHH24') bucket,(now() at time zone 'Europe/Amsterdam')::date as business_date");
      const {bucket,business_date}=bucketRows[0];
      const dedupeKey="commercial-channel-dispatch:"+def.lane+":"+bucket;
      // The exact linkedIn like mutation is not exposed by the connected
      // provider. A read/list-reactions tool must never masquerade as POST.
      const rows=await tx.unsafe("select count(*)::int ready from public.powerhouse_sales_actions where "+def.eligible);
      const ready=Number(rows[0]?.ready||0);
      const state=def.executor===null?"PROVIDER_WRITE_NOT_AVAILABLE":ready===0?"NO_ELIGIBLE_APPROVED_ACTION":"READY";
      const inserted=await tx.unsafe(
        "insert into public.powerhouse_runtime_events (dedupe_key,event_type,source,subject_key,channel,occurred_at,state,data_quality,evidence,context) "+
        "values ($1,'commercial_outbound_lane_dispatch','powerhouse-commercial-heartbeat-runner','growth-revenue-os',$2,now(),'observed','OBSERVED',$3::jsonb,$4::jsonb) "+
        "on conflict (dedupe_key) do nothing returning event_id",
        [dedupeKey,def.lane,JSON.stringify({contract:"powerhouse-independent-commercial-lanes-v1",lane:def.lane,ready,decision:state,provider_side_effect_verified:false}),JSON.stringify({source:"Brain+POWERHOUSE+Heartbeat",original_scheduler:true,no_parallel_sender:true})]
      );
      if(inserted.length===0)return {lane:def.lane,dispatched:false,reason:"ALREADY_EVALUATED_THIS_HOUR"};
      if(state!=="READY"||def.executor===null)return {lane:def.lane,dispatched:false,ready,reason:state};
      // Fixed whitelist only: each already-existing dispatcher fetches the
      // canonical scheduler token and retains human approval, consent, target,
      // quality, dedupe, pressure limits, and provider readback requirements.
      const dispatched=await tx.unsafe(
        "select public."+def.executor+"($1::date) as result",[business_date]
      );
      const receipt=dispatched[0]?.result||{};
      const queued=receipt?.dispatched===true&&Number(receipt?.request_id)>0;
      await tx.unsafe(
        "update public.powerhouse_runtime_events set evidence=evidence||$2::jsonb,updated_at=now() where dedupe_key=$1",
        [dedupeKey,JSON.stringify({queued,request_id:queued?Number(receipt.request_id):null,reason:queued?"PROVIDER_RESULT_PENDING_READBACK":clean(receipt?.reason)||"DISPATCH_DECLINED"})]
      );
      return {lane:def.lane,dispatched:queued,ready,request_id:queued?Number(receipt.request_id):null,
        reason:queued?"QUEUED_NOT_DELIVERED":clean(receipt?.reason)||"DISPATCH_DECLINED"};
    });
  }catch(error){
    console.error("COMMERCIAL_LANE_DISPATCH_FAILED",def.lane,error instanceof Error?error.message:String(error));
    return {lane:def.lane,dispatched:false,reason:"INDEPENDENT_LANE_ERROR"};
  }
}
async function runOutboundLanes(){
  const results=await Promise.allSettled(outboundLanes.map(def=>runOneOutboundLane(def)));
  return results.map((item,i)=>item.status==="fulfilled"?item.value:{
    lane:outboundLanes[i].lane,dispatched:false,reason:"INDEPENDENT_LANE_UNHANDLED_FAILURE"
  });
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);

  const provided=clean(req.headers.get("x-bg-service-token"));
  if(!provided||await sha256(provided)!==SERVICE_TOKEN_HASH)return json({ok:false,error:"UNAUTHORIZED"},401);

  // The outbound lanes are not coupled to the expensive Brain transaction.
  // A failure/timeout of the commercial scoring cycle cannot starve email,
  // DM, comments, or the honest unsupported-likes status.
  const outboundLanesResult=await runOutboundLanes();
  try{
    const result=await runHeartbeat();
    return json({...result,outbound_lanes:outboundLanesResult},result.state==="SKIPPED_OVERLAP"?202:200);
  }catch(error){
    console.error("POWERHOUSE_COMMERCIAL_HEARTBEAT_RUNNER_FAILED",error instanceof Error?error.message:String(error));
    return json({
      ok:false,
      error:"COMMERCIAL_HEARTBEAT_FAILED",
      contract:"powerhouse-commercial-heartbeat-external-v1",
      outbound_lanes:outboundLanesResult
    },503);
  }
});
