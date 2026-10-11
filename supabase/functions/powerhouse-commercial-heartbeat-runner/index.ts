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
   eligible:"action_type='reply_post' and channel='linkedin_personal' and status='suggested' and nullif(trim(coalesce(message_draft,'')),'') is not null and source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)' and evidence#>>'{social_execution_gate,quality_passed}'='true' and coalesce(evidence->>'linkedin_post_urn',evidence->>'post_urn',evidence#>>'{commercial_intelligence,post_urn}',evidence#>>'{social_execution_gate,post_urn}') ~ '^urn:li:(share|ugcPost):[0-9]+$'"},
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
      const rows=await tx.unsafe("select count(*)::int ready from public.powerhouse_sales_actions where "+def.eligible);
      const ready=Number(rows[0]?.ready||0);
      const state=def.executor===null?"PROVIDER_WRITE_NOT_AVAILABLE":ready===0?"NO_ELIGIBLE_APPROVED_ACTION":"READY";
      // Persist a genuine JSONB OBJECT (postgres.js serializes JSON strings as JSON
      // string scalars). The 5-minute Heartbeat may see an eligible action later
      // within the SAME hour: allow an earlier NO_ELIGIBLE receipt to promote
      // atomically to READY. Never replay a READY/queued delivery claim.
      const inserted=await tx.unsafe(
        "insert into public.powerhouse_runtime_events (dedupe_key,event_type,source,subject_key,channel,occurred_at,state,data_quality,evidence,context) "+
        "values ($1,'commercial_outbound_lane_dispatch','powerhouse-commercial-heartbeat-runner','growth-revenue-os',$2,now(),'observed','OBSERVED',"+
        "jsonb_build_object('contract','powerhouse-independent-commercial-lanes-v2','lane',$2::text,'ready',$3::int,'decision',$4::text,'provider_side_effect_verified',false),"+
        "jsonb_build_object('source','Brain+POWERHOUSE+Heartbeat','original_scheduler',true,'no_parallel_sender',true)) "+
        "on conflict (dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,occurred_at=excluded.occurred_at,updated_at=now() "+
        "where excluded.evidence->>'decision'='READY' "+
        "and public.powerhouse_runtime_events.state='observed' "+
        "and (case when jsonb_typeof(public.powerhouse_runtime_events.evidence)='object' "+
        "then coalesce(public.powerhouse_runtime_events.evidence->>'decision','') else '' end) "+
        "in ('','NO_ELIGIBLE_APPROVED_ACTION','PROVIDER_WRITE_NOT_AVAILABLE') "+
        "returning event_id",
        [dedupeKey,def.lane,ready,state]
      );
      if(inserted.length===0)return {lane:def.lane,dispatched:false,reason:"ALREADY_EVALUATED_THIS_HOUR"};
      if(state!=="READY"||def.executor===null)return {lane:def.lane,dispatched:false,ready,reason:state};
      // Reuse ONLY existing provider executors: per-recipient authorization,
      // quality, CAS, contact-pressure, suppression and proof remain mandatory.
      const dispatched=await tx.unsafe(
        "select public."+def.executor+"($1::date) as result",[business_date]
      );
      const receipt=dispatched[0]?.result||{};
      const queued=receipt?.dispatched===true&&Number(receipt?.request_id)>0;
      await tx.unsafe(
        "update public.powerhouse_runtime_events set evidence=evidence||"+
        "jsonb_build_object('queued',$2::boolean,'request_id',$3::bigint,'reason',$4::text),updated_at=now() "+
        "where dedupe_key=$1",
        [dedupeKey,queued,queued?Number(receipt.request_id):null,
          queued?"PROVIDER_RESULT_PENDING_READBACK":clean(receipt?.reason)||"DISPATCH_DECLINED"]
      );
      return {lane:def.lane,dispatched:queued,ready,request_id:queued?Number(receipt.request_id):null,
        reason:queued?"QUEUED_NOT_DELIVERED":clean(receipt?.reason)||"DISPATCH_DECLINED"};
    });
  }catch(error){
    console.error("COMMERCIAL_LANE_DISPATCH_FAILED",def.lane,error instanceof Error?error.message:String(error));
    return {lane:def.lane,dispatched:false,reason:"INDEPENDENT_LANE_ERROR"};
  }
}
async function materializeCommercialIntent(){
  // Materialize ORIGINAL Brain next-best-actions once per hour before delivery
  // checks. This merely prepares candidate rows, never calls provider sends.
  // Protected from expensive view failures by its own bounded transaction.
  try{
    return await db().begin(async tx=>{
      await tx.unsafe("set local statement_timeout = '16000ms'");
      await tx.unsafe("set local lock_timeout = '2000ms'");
      const got=await tx.unsafe("select pg_try_advisory_xact_lock(hashtextextended('powerhouse-outbound-brain-intent-v1',0)) locked");
      if(got[0]?.locked!==true)return {state:"PEER_PROCESSING",ok:true};
      const r=await tx.unsafe(
        "select (now() at time zone 'Europe/Amsterdam')::date as business_date,to_char(now() at time zone 'UTC','YYYYMMDDHH24') as bucket"
      );
      const {business_date,bucket}=r[0],key="commercial-intent-materialization:"+bucket;
      const claimed=await tx.unsafe(
        "insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,state,data_quality,evidence,context) "+
        "values ($1,'commercial_intent_materialization','powerhouse-commercial-heartbeat-runner','growth-revenue-os',now(),'observed','OBSERVED',"+
        "jsonb_build_object('contract','powerhouse-brain-action-feed-v1','source','canonical-command-center','provider_side_effect_verified',false),"+
        "jsonb_build_object('no_provider_mutation',true,'canonical_scheduler_owner',true)) "+
        "on conflict(dedupe_key) do nothing returning event_id",[key]
      );
      if(!claimed.length)return {state:"ALREADY_MATERIALIZED_THIS_HOUR",ok:true};
      const result=await tx.unsafe(
        "select public.powerhouse_materialize_command_center_actions_v1($1::date) as outcome",[business_date]
      );
      const outcome=result[0]?.outcome||{};
      await tx.unsafe(
        "update public.powerhouse_runtime_events set evidence=evidence||"+
        "jsonb_build_object('actions_touched',$2::int,'email_actions',$3::int,'linkedin_dm_actions',$4::int,'linkedin_comments',$5::int,'research_actions',$6::int),updated_at=now() "+
        "where dedupe_key=$1",
        [key,Number(outcome.actions_touched)||0,Number(outcome.email_actions)||0,
          Number(outcome.linkedin_dm_actions)||0,Number(outcome.linkedin_comments)||0,
          Number(outcome.research_actions)||0]
      );
      return {state:"CANONICAL_BRAIN_ACTIONS_MATERIALIZED",ok:true,
        actions_touched:Number(outcome.actions_touched)||0,
        email_actions:Number(outcome.email_actions)||0,
        dm_actions:Number(outcome.linkedin_dm_actions)||0,
        comment_actions:Number(outcome.linkedin_comments)||0,
        research_actions:Number(outcome.research_actions)||0};
    });
  }catch(error){
    console.error("COMMERCIAL_INTENT_MATERIALIZATION_FAILED",error instanceof Error?error.message:String(error));
    return {state:"INDEPENDENT_BRAIN_FEED_ERROR",ok:false};
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
  const brainActionFeed=await materializeCommercialIntent();
  const outboundLanesResult=await runOutboundLanes();
  try{
    const result=await runHeartbeat();
    return json({...result,brain_action_feed:brainActionFeed,outbound_lanes:outboundLanesResult},result.state==="SKIPPED_OVERLAP"?202:200);
  }catch(error){
    console.error("POWERHOUSE_COMMERCIAL_HEARTBEAT_RUNNER_FAILED",error instanceof Error?error.message:String(error));
    return json({
      ok:false,
      error:"COMMERCIAL_HEARTBEAT_FAILED",
      contract:"powerhouse-commercial-heartbeat-external-v1",
      brain_action_feed:brainActionFeed,
      outbound_lanes:outboundLanesResult
    },503);
  }
});
