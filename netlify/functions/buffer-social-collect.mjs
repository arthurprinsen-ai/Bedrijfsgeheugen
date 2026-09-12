import { discoverBufferScope, collectBufferPosts, inferBufferChannelKind } from './_buffer-social-collector.mjs';
import { createSocialOutcomeHandler } from './social-outcome-ingest.mjs';
import { createSocialLearningStore } from './_social-learning-store.mjs';

const splitCsv=value=>String(value||'').split(',').map(x=>x.trim()).filter(Boolean);
const isoSince=(now,days)=>new Date(new Date(now).getTime()-Math.max(1,Number(days)||8)*86400000).toISOString();
function channelOverridesFromEnv(){
  const pairs=[
    ['BUFFER_LINKEDIN_PERSONAL_CHANNEL_IDS','linkedin_personal'],
    ['BUFFER_LINKEDIN_COMPANY_CHANNEL_IDS','linkedin_company'],
    ['BUFFER_INSTAGRAM_CHANNEL_IDS','instagram_company'],
  ];
  return Object.fromEntries(pairs.flatMap(([key,kind])=>splitCsv(process.env[key]).map(id=>[id,kind])));
}
function envConfig(){return {apiKey:process.env.BUFFER_API_KEY||null,organizationId:process.env.BUFFER_ORGANIZATION_ID||null,channelIds:splitCsv(process.env.BUFFER_CHANNEL_IDS),targetServices:splitCsv(process.env.BUFFER_TARGET_SERVICES||'linkedin,instagram'),tenantId:process.env.BG_SOCIAL_LEARNING_TENANT_ID||'canonical',serviceToken:process.env.BG_SOCIAL_LEARNING_SERVICE_TOKEN||process.env.BG_PORTAL_EU_SERVICE_TOKEN||null,lookbackDays:Number(process.env.BUFFER_LOOKBACK_DAYS||8),channelKindOverrides:channelOverridesFromEnv()};}
async function recordCredentialObligation(store,now){if(!store?.recordObligation)return;await store.recordObligation({tenantId:'canonical',id:'buffer-social-learning:credential',type:'MISSING_CREDENTIAL',owner:'POWERHOUSE_SOCIAL_LEARNING',dueAt:new Date(now).toISOString(),status:'OPEN',source:'buffer',requiredSecret:'BUFFER_API_KEY'});}
export async function runBufferCollection({apiKey,organizationId=null,channelIds=[],targetServices=['linkedin','instagram'],tenantId='canonical',serviceToken=null,lookbackDays=8,channelKindOverrides={},fetchFn=globalThis.fetch,store,ingest,now=new Date()}={}){
  const activeStore=store||createSocialLearningStore();if(!apiKey){await recordCredentialObligation(activeStore,now);return {ok:false,reason:'BUFFER_API_KEY_REQUIRED',posts:0,pages:0};}
  const scope=await discoverBufferScope({apiKey,fetchFn,organizationId,channelIds:channelIds?.length?channelIds:null,targetServices});
  const services=Object.fromEntries(scope.channels.map(channel=>[channel.id,channel.service]));
  const channelMetadata=Object.fromEntries(scope.channels.map(channel=>[channel.id,{channelName:channel.displayName||channel.name||null,channelKind:inferBufferChannelKind(channel,channelKindOverrides)}]));
  let activeIngest=ingest;if(!activeIngest){if(!serviceToken)throw new Error('BG_SOCIAL_LEARNING_SERVICE_TOKEN_REQUIRED');const handler=createSocialOutcomeHandler({store:activeStore,serviceToken});activeIngest=async envelope=>{const response=await handler(new Request('https://internal.invalid/api/social-outcome-ingest',{method:'POST',headers:{'content-type':'application/json','x-bg-service-token':serviceToken},body:JSON.stringify(envelope)}));if(!response.ok&&response.status!==409){const body=await response.text().catch(()=>response.statusText);throw new Error(`BUFFER_SOCIAL_OUTCOME_INGEST_${response.status}:${body}`);}};}
  const result=await collectBufferPosts({apiKey,organizationId:scope.organizationId,channelIds:scope.channels.map(channel=>channel.id),channelServices:services,channelMetadata,tenantId,fetchFn,ingest:activeIngest,now,since:isoSince(now,lookbackDays)});
  return {ok:true,organizationId:scope.organizationId,channels:scope.channels.map(channel=>({id:channel.id,service:channel.service,name:channel.displayName||channel.name||null,kind:channelMetadata[channel.id]?.channelKind||null})),...result};
}
export default async function bufferCollect(input={}){const dependencyInjection=input&&typeof input==='object'&&!(input instanceof Request)&&('apiKey' in input||'store' in input||'ingest' in input);const options=dependencyInjection?input:envConfig();try{const result=await runBufferCollection(options);if(!result.ok)return Response.json(result,{status:503,headers:{'cache-control':'no-store'}});return Response.json(result,{status:200,headers:{'cache-control':'no-store'}});}catch(error){console.error('BUFFER_SOCIAL_COLLECTION_FAILED',error);return Response.json({ok:false,error:'BUFFER_SOCIAL_COLLECTION_FAILED',message:error.message},{status:503,headers:{'cache-control':'no-store'}});}}
export const config={schedule:'15 */6 * * *'};
