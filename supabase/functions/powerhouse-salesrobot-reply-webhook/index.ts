
import { createClient } from "npm:@supabase/supabase-js@2";
// Admission token authorizes inbound storage only; it is not an independently verified SalesRobot provider signature.\nconst HASH="26b860b372c053683d594d96a8c7e787a7407a80ed36cae1b0e747ed3d49e156";
const CAMPAIGN="ae2812ad-c3eb-4c90-a0d4-6d4e5a94b93e";
const json=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
const clean=(x:any,n=500)=>(typeof x==="string"||typeof x==="number")?String(x).trim().slice(0,n):"";
const object=(x:any):Record<string,any>=>x!==null&&typeof x==="object"&&!Array.isArray(x)?x:{};
const encoder=new TextEncoder();
async function hash(t:string) {const b=await crypto.subtle.digest("SHA-256",encoder.encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function equal(a:string,b:string) {if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function pick(items:Record<string,any>[],names:string[],max=500){for(const item of items)for(const name of names){const v=clean(item[name],max);if(v)return v;}return "";}
function profileUrl(s:string):string|null {
  try {
    const u=new URL(s);
    if(u.protocol!=="https:"||!["www.linkedin.com","linkedin.com"].includes(u.hostname.toLowerCase()))return null;
    const parts=u.pathname.split("/").filter(Boolean);
    if(parts.length!==2||parts[0]!=="in"||!parts[1])return null;
    return "https://www.linkedin.com/in/"+parts[1]+"/";
  }catch{return null;}
}
Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"METHOD_NOT_ALLOWED"},405);
  const token=new URL(req.url).searchParams.get("token")||"";
  if(token.length!==64||!equal(await hash(token),HASH))return json({ok:false,error:"UNAUTHORIZED"},401);
  if(Number(req.headers.get("content-length")||0)>65536)return json({ok:false,error:"PAYLOAD_TOO_LARGE"},413);
  const raw=await req.text();
  if(encoder.encode(raw).length>65536)return json({ok:false,error:"PAYLOAD_TOO_LARGE"},413);
  let dataPayload:Record<string,any>;
  try{dataPayload=object(JSON.parse(raw));if(!Object.keys(dataPayload).length)throw new Error("empty");}
  catch{return json({ok:false,error:"INVALID_JSON_OBJECT"},400);}
  if(dataPayload._powerhouse_dry_run===true)return json({ok:true,dry_run:true,stored:false,contract:"salesrobot-reply-webhook-v1"});
  const data=object(dataPayload.data);
  const contact=object(data.contact||dataPayload.contact);
  const lead=object(data.lead||dataPayload.lead||data.prospect||dataPayload.prospect);
  const message=object(data.message||dataPayload.message||data.lastMessage);
  const all=[message,data,contact,lead,dataPayload];
  const sentCampaign=pick([data,dataPayload],["campaignUuid","campaignId","campaign_uuid","campaign_id","campaignName","campaign_name"],128);
  if(sentCampaign&&sentCampaign!==CAMPAIGN&&sentCampaign!=="Bedrijfsgeheugen")return json({ok:false,error:"UNEXPECTED_CAMPAIGN"},422);
  const profile=profileUrl(pick(all,["profileUrl","profile_url","linkedinUrl","linkedInUrl","linkedin_url","linkedinProfileUrl","linkedin_profile_url","profileLink","profile_link"],2048));
  const providerEventId=pick([message,data,dataPayload],["messageId","message_id","replyId","reply_id","eventId","event_id"],128);
  const payloadHash=await hash(raw);
  const dedupe="salesrobot:contact_reply:"+payloadHash;
  const timestamp=pick(all,["receivedAt","repliedAt","timestamp","occurredAt","createdAt","created_at","date"],100);
  const candidate=timestamp?new Date(timestamp):null;
  const now=Date.now();
  const occurredAt=candidate&&Number.isFinite(candidate.getTime())&&candidate.getTime()>now-365*86400000&&candidate.getTime()<now+86400000?candidate.toISOString():new Date(now).toISOString();
  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl||!serviceKey)return json({ok:false,error:"SERVER_CONFIG_MISSING"},503);
  const db=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let personKey:string|null=null;
  if(profile){
    const {data:matches,error:lookupErr}=await db.from("bg_connecties").select("sleutel").in("linkedin_url",[profile,profile.slice(0,-1)]).limit(2);
    if(lookupErr)return json({ok:false,error:"CRM_LOOKUP_FAILED"},503);
    if(matches?.length===1)personKey=clean(matches[0].sleutel,500);
  }
  const row={
    dedupe_key:dedupe,event_type:"salesrobot_contact_reply",source:"salesrobot",
    subject_key:profile,person_key:personKey,campaign_key:CAMPAIGN,channel:"linkedin_dm",occurred_at:occurredAt,
    evidence:{webhook_contract:"salesrobot-reply-webhook-v1",provider:"salesrobot",provider_event_id:providerEventId||null,payload_sha256:payloadHash,token_authenticated:true,provider_signature_verified:false,crm_identity_matched:!!personKey,original_event:dataPayload},
    context:{integration:"POWERHOUSE - SalesRobot CRM Sync",campaign_name:"Bedrijfsgeheugen",campaign_id:CAMPAIGN,identity_state:personKey?"CANONICAL_MATCH":"NEEDS_RECONCILIATION",next_step:personKey?"Review actual reply and decide follow-up":"Resolve prospect identity first; no automatic outreach"},
    state:"observed",data_quality:"OBSERVED",confidence:personKey?0.85:0.4
  };
  const {error}=await db.from("powerhouse_runtime_events").upsert(row,{onConflict:"dedupe_key",ignoreDuplicates:true});
  if(error){console.error("salesrobot_reply_persist_error",error.code);return json({ok:false,error:"PERSISTENCE_FAILED"},503);}
  return json({ok:true,accepted:true,event_key:dedupe,identity:personKey?"matched":"unmatched",campaign:"Bedrijfsgeheugen"});
});
