import { timingSafeEqual } from 'node:crypto';
import { persistBrainEvent } from './_brain-event-store.mjs';
import { createSocialLearningStore } from './_social-learning-store.mjs';
import { normalizeMetricSnapshot } from './_social-learning-model.mjs';

export function normalizeOutcomeEnvelope(input){const raw=input?.body?.result??input?.result??input;return raw&&typeof raw==='object'?raw:{};}
function tokenMatches(actual,expected){if(!actual||!expected)return false;const a=Buffer.from(String(actual));const b=Buffer.from(String(expected));return a.length===b.length&&timingSafeEqual(a,b);}
function validate(event){const required=['eventId','tenantId','idempotencyKey','platform','externalPostId','observedAt','source','metrics'];const missing=required.filter(k=>event?.[k]===undefined||event?.[k]===null||event?.[k]==='');if(missing.length) throw new TypeError(`Missing required social outcome fields: ${missing.join(', ')}`);if(typeof event.metrics!=='object'||Array.isArray(event.metrics)) throw new TypeError('metrics must be an object');}
function snapshotId(event){return `${event.externalPostId}:${event.observedAt}`;}
export function createSocialOutcomeHandler({persistEvent=persistBrainEvent,store,serviceToken=process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN}={}){
  return async request=>{
    if(request.method!=='POST') return new Response('Method Not Allowed',{status:405,headers:{allow:'POST'}});
    if(!tokenMatches(request.headers.get('x-bg-service-token'),serviceToken)) return Response.json({error:'UNAUTHORIZED'},{status:401,headers:{'cache-control':'no-store'}});
    let payload;try{payload=normalizeOutcomeEnvelope(await request.json());validate(payload);}catch(error){return Response.json({error:'INVALID_SOCIAL_OUTCOME',message:error.message},{status:400,headers:{'cache-control':'no-store'}});}
    const normalized={...payload,metrics:normalizeMetricSnapshot(payload.metrics)};const activeStore=store||createSocialLearningStore();
    try{
      await persistEvent({...normalized,eventType:'SOCIAL_OUTCOME'},{status:'RECEIVED'});
      await activeStore.putPost({postId:normalized.postId||normalized.externalPostId,tenantId:normalized.tenantId,platform:normalized.platform,externalPostId:normalized.externalPostId,publishedAt:normalized.publishedAt||null,contentHash:normalized.contentHash||null,channelId:normalized.channelId||null,channelName:normalized.channelName||null,channelKind:normalized.channelKind||null,topic:normalized.topic||null,contentPillar:normalized.contentPillar||null,audience:normalized.audience||null,funnelStage:normalized.funnelStage||null,format:normalized.format||null,hookType:normalized.hookType||null,narrativeType:normalized.narrativeType||null,emotion:normalized.emotion||null,ctaType:normalized.ctaType||null,sourceCampaignId:normalized.sourceCampaignId||null});
      await activeStore.appendSnapshot({snapshotId:snapshotId(normalized),postId:normalized.postId||normalized.externalPostId,tenantId:normalized.tenantId,observedAt:normalized.observedAt,source:normalized.source,sourceEventId:normalized.eventId,dataQuality:normalized.dataQuality||'OBSERVED',metrics:normalized.metrics});
      return Response.json({accepted:true,eventId:normalized.eventId,postId:normalized.postId||normalized.externalPostId,snapshotId:snapshotId(normalized)},{status:202,headers:{'cache-control':'no-store'}});
    }catch(error){const status=error?.code==='EVENT_ID_CONFLICT'||error?.status===409?409:503;return Response.json({error:status===409?'SOCIAL_OUTCOME_CONFLICT':'SOCIAL_OUTCOME_PERSISTENCE_FAILED',message:error.message},{status,headers:{'cache-control':'no-store'}});}
  };
}
export default async request=>createSocialOutcomeHandler()(request);
export const config={path:'/api/social-outcome-ingest'};
