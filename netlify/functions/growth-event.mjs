import { getStore, getDeployStore } from '@netlify/blobs';
import { normalizeBehaviorEvent } from '../../tools/seo-growth/normalize-observation.mjs';
import { normalizeGrowthEventForDataHub } from '../../tools/seo-growth/datahub-contract.mjs';
import { toBg211Envelope } from '../../tools/seo-growth/bg211-envelope.mjs';

const STORE='bg-growth-events';
const ALLOWED_ORIGIN=/^https:\/\/(?:www\.)?bedrijfsgeheugen\.nl$|^https:\/\/(?:deploy-preview-\d+--|main--)?bedrijfsgeheugen\.netlify\.app$/i;
const MAX_BYTES=16_384;

function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8',...headers}});}
function safeKey(envelope){return 'event/'+envelope.fingerprint.replace(/[^a-z0-9|_-]/gi,'_')+'/'+String(envelope.event_id).replace(/[^a-z0-9_-]/gi,'_');}
function storeForContext(context){return context?.deploy?.context==='production'?getStore(STORE):getDeployStore(STORE);}

export default async function handler(request,context){
  if(request.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{allow:'POST','cache-control':'no-store'}});
  const origin=request.headers.get('origin')||'';if(origin&&!ALLOWED_ORIGIN.test(origin))return json({error:'origin-not-allowed'},403);
  const raw=await request.text();if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return json({error:'payload-too-large'},413);
  let input;try{input=JSON.parse(raw);}catch{return json({error:'invalid-json'},400);}
  let observation;try{observation=normalizeBehaviorEvent(input);}catch(error){return json({error:'invalid-growth-event',detail:String(error.message||error)},422);}
  const envelope=toBg211Envelope(observation);
  let datahubEvent;try{
    datahubEvent=normalizeGrowthEventForDataHub({
      event_id:observation.event_id||envelope.event_id,
      event_type:observation.event_type,
      canonical:observation.canonical,
      intent:observation.intent_id,
      intent_owner:input.intent_owner||'',
      attribution_root_key:observation.attribution_root||input.attribution_root_key||'',
      source:observation.source,
      medium:observation.medium,
      campaign:input.campaign||'',
      occurred_at:observation.occurred_at||new Date().toISOString(),
      page_role:observation.page_role,
      funnel_stage:observation.funnel_stage,
      content_id:observation.content_id||input.content_id||'',
      content_type:observation.content_type||input.content_type||'',
      channel:observation.channel||input.channel||'',
      fingerprint:envelope.fingerprint
    });
  }catch(error){return json({error:'invalid-datahub-growth-event',detail:String(error.message||error)},422);}

  const store=storeForContext(context);
  const key=safeKey(envelope);
  const previous=await store.get(key,{type:'json'}).catch(()=>null);
  if(previous?.envelope?.event_id===envelope.event_id){
    return json({
      accepted:true,
      deduped:true,
      event_id:envelope.event_id,
      queue:'durable',
      datahub:previous?.datahub?.persisted?'persisted':'queued',
      brain:previous?.delivery?.delivered?'delivered':'queued'
    },202);
  }

  const queuedAt=previous?.queued_at||new Date().toISOString();
  await store.setJSON(key,{
    ...previous,
    state:previous?.delivery?.delivered?'delivered':previous?.datahub?.persisted?'datahub-persisted':'queued',
    queued_at:queuedAt,
    envelope,
    datahub_event:datahubEvent
  });

  return json({accepted:true,deduped:false,event_id:envelope.event_id,queue:'durable',datahub:'queued',brain:'queued'},202);
}

export const config={path:'/api/growth-event'};
