import { discoverBufferScope, collectBufferPosts } from './_buffer-social-collector.mjs';
import { ingestPowerhouseEvent } from './_powerhouse-core-client.mjs';

const splitCsv=value=>String(value||'').split(',').map(x=>x.trim()).filter(Boolean);
const isoSince=(now,days)=>new Date(new Date(now).getTime()-Math.max(1,Number(days)||8)*86400000).toISOString();

function envConfig(){
  return {
    apiKey:process.env.BUFFER_API_KEY||null,
    organizationId:process.env.BUFFER_ORGANIZATION_ID||null,
    channelIds:splitCsv(process.env.BUFFER_CHANNEL_IDS),
    targetServices:splitCsv(process.env.BUFFER_TARGET_SERVICES||'linkedin,instagram'),
    tenantId:process.env.BG_SOCIAL_LEARNING_TENANT_ID||'canonical',
    lookbackDays:Number(process.env.BUFFER_LOOKBACK_DAYS||8),
    legacyFallback:process.env.BG_LEGACY_SOCIAL_FALLBACK==='true',
  };
}

export function bufferEnvelopeToCoreEvents(envelope={}){
  const topicKey=envelope.topicKey||null;
  const common={
    source:'buffer',
    channel:envelope.platform,
    contentKey:envelope.contentHash||envelope.postId,
    topicKey,
    postUrl:envelope.url||'',
    text:envelope.text||'',
    occurredAt:envelope.publishedAt||envelope.observedAt,
    dataQuality:envelope.dataQuality||'OBSERVED',
  };
  const published={
    ...common,
    eventType:'social_post_published',
    dedupeKey:`buffer:published:${envelope.postId}`,
    externalPostId:envelope.externalPostId,
    evidence:{publishedAt:envelope.publishedAt,channelId:envelope.channelId},
  };
  const metric={
    ...common,
    eventType:'social_metric_observed',
    occurredAt:envelope.observedAt,
    dedupeKey:envelope.idempotencyKey,
    metrics:envelope.metrics||{},
    evidence:{metrics:envelope.metrics||{},observedAt:envelope.observedAt,externalPostId:envelope.externalPostId},
  };
  return [published,metric];
}

async function legacyIngest(envelope,{serviceToken,store}={}){
  const [{createSocialOutcomeHandler},{createSocialLearningStore}]=await Promise.all([
    import('./social-outcome-ingest.mjs'),
    import('./_social-learning-store.mjs'),
  ]);
  const activeStore=store||createSocialLearningStore();
  if(!serviceToken)throw new Error('BG_SOCIAL_LEARNING_SERVICE_TOKEN_REQUIRED');
  const handler=createSocialOutcomeHandler({store:activeStore,serviceToken});
  const response=await handler(new Request('https://internal.invalid/api/social-outcome-ingest',{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':serviceToken},body:JSON.stringify(envelope)}));
  if(!response.ok&&response.status!==409)throw new Error(`BUFFER_LEGACY_FALLBACK_${response.status}`);
}

export async function runBufferCollection({
  apiKey,
  organizationId=null,
  channelIds=[],
  targetServices=['linkedin','instagram'],
  tenantId='canonical',
  lookbackDays=8,
  fetchFn=globalThis.fetch,
  ingest,
  coreOptions={},
  legacyFallback=false,
  serviceToken=null,
  store=null,
  now=new Date(),
}={}){
  if(!apiKey)return {ok:false,reason:'BUFFER_API_KEY_REQUIRED',posts:0,pages:0};
  const scope=await discoverBufferScope({apiKey,fetchFn,organizationId,channelIds:channelIds?.length?channelIds:null,targetServices});
  const services=Object.fromEntries(scope.channels.map(channel=>[channel.id,channel.service]));
  const activeIngest=ingest||async envelope=>{
    try{
      for(const event of bufferEnvelopeToCoreEvents(envelope))await ingestPowerhouseEvent(event,{...coreOptions,fetchFn});
    }catch(error){
      if(!legacyFallback)throw error;
      await legacyIngest(envelope,{serviceToken,store});
    }
  };
  const result=await collectBufferPosts({apiKey,organizationId:scope.organizationId,channelIds:scope.channels.map(channel=>channel.id),channelServices:services,tenantId,fetchFn,ingest:activeIngest,now,since:isoSince(now,lookbackDays)});
  return {ok:true,core:'powerhouse-unified',organizationId:scope.organizationId,channels:scope.channels.map(channel=>({id:channel.id,service:channel.service})),...result};
}

export default async function bufferCollect(input={}){
  const dependencyInjection=input&&typeof input==='object'&&!(input instanceof Request)&&('apiKey' in input||'ingest' in input||'coreOptions' in input);
  const options=dependencyInjection?input:envConfig();
  try{
    const result=await runBufferCollection(options);
    if(!result.ok)return Response.json(result,{status:503,headers:{'cache-control':'no-store'}});
    return Response.json(result,{status:200,headers:{'cache-control':'no-store'}});
  }catch(error){
    console.error('BUFFER_SOCIAL_COLLECTION_FAILED',error);
    return Response.json({ok:false,error:'BUFFER_SOCIAL_COLLECTION_FAILED',message:error.message},{status:503,headers:{'cache-control':'no-store'}});
  }
}

export const config={schedule:'15 */6 * * *'};
