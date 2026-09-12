import { createHash } from 'node:crypto';

const API_URL='https://api.buffer.com';
const METRIC_MAP=Object.freeze({
  impressions:'impressions', impression:'impressions', reach:'reach', reactions:'likes', reaction:'likes', likes:'likes', like:'likes', comments:'comments', comment:'comments', shares:'shares', share:'shares', reposts:'shares', repost:'shares', saves:'saves', save:'saves', clicks:'clicks', click:'clicks', profileviews:'profile_visits', profilevisits:'profile_visits', profile_views:'profile_visits', followersgained:'followers_gained', followers_gain:'followers_gained',
});
const canonicalMetricKey=value=>String(value??'').trim().toLowerCase().replace(/[\s.-]+/g,'_');
export function normalizeBufferMetricName(value){const key=canonicalMetricKey(value);return METRIC_MAP[key]||METRIC_MAP[key.replaceAll('_','')]||null;}
function metricValue(metric){const value=Number(metric?.value);return Number.isFinite(value)?value:null;}
function sha256(value){return createHash('sha256').update(String(value??'')).digest('hex');}
function platformFromService(service=''){const value=String(service).trim().toLowerCase();if(value.includes('linkedin'))return 'linkedin';if(value.includes('instagram'))return 'instagram';if(value.includes('facebook'))return 'facebook';if(value==='x'||value.includes('twitter'))return 'x';return value||'buffer';}

export function inferBufferChannelKind(channel={}, overrides={}){
  const id=String(channel?.id||'');
  if(overrides[id])return overrides[id];
  const platform=platformFromService(channel?.service);
  const label=String(channel?.displayName||channel?.name||'').trim().toLowerCase();
  if(platform==='linkedin'){
    if(/bedrijfsgeheugen|company|bedrijf|organisatie|organization/.test(label))return 'linkedin_company';
    return 'linkedin_personal';
  }
  if(platform==='instagram')return 'instagram_company';
  if(platform==='facebook')return 'facebook_company';
  if(platform==='x')return 'x_account';
  return `${platform}_account`;
}

export function normalizeBufferPost(post={},context={}){
  if(!post?.id)throw new TypeError('BUFFER_POST_ID_REQUIRED');
  const observedAt=post.metricsUpdatedAt||context.observedAt||new Date().toISOString();
  const metrics={};
  for(const metric of Array.isArray(post.metrics)?post.metrics:[]){const target=normalizeBufferMetricName(metric?.type||metric?.name);const value=metricValue(metric);if(!target||value===null)continue;metrics[target]=value;}
  const platform=context.platform||platformFromService(context.service);
  const text=String(post.text??'');
  return {eventId:`buffer:${post.id}:${observedAt}`,idempotencyKey:`buffer:${post.id}:${observedAt}`,tenantId:context.tenantId||'canonical',platform,externalPostId:String(post.id),postId:String(post.id),observedAt,publishedAt:post.sentAt||post.dueAt||post.createdAt||null,source:'buffer',contentHash:sha256(text),channelId:post.channelId||context.channelId||null,channelName:context.channelName||null,channelKind:context.channelKind||null,text,dataQuality:'OBSERVED',metrics};
}
function gqlString(value){return JSON.stringify(String(value));}
function gqlStringArray(values=[]){return `[${values.map(gqlString).join(',')}]`;}
export function buildBufferPostsQuery({organizationId,channelIds=[],after=null,first=100,since=null}={}){if(!organizationId)throw new TypeError('BUFFER_ORGANIZATION_ID_REQUIRED');if(!Array.isArray(channelIds)||!channelIds.length)throw new TypeError('BUFFER_CHANNEL_IDS_REQUIRED');const afterArg=after?`after: ${gqlString(after)}`:'';const sinceFilter=since?`dueAt: { start: ${gqlString(since)} }`:'';const query=`query GetPostsWithMetrics {\n  posts(\n    first: ${Number(first)||100}\n    ${afterArg}\n    input: {\n      organizationId: ${gqlString(organizationId)}\n      filter: { status: [sent], channelIds: ${gqlStringArray(channelIds)} ${sinceFilter} }\n      sort: [{ field: dueAt, direction: desc }]\n    }\n  ) {\n    edges { node { id text createdAt dueAt sentAt channelId metrics { type name value unit } metricsUpdatedAt } }\n    pageInfo { endCursor hasNextPage }\n  }\n}`;return {query,variables:{organizationId,channelIds:[...channelIds],after,first,since}};}
function buildOrganizationsQuery(){return {query:'query GetOrganizations { account { organizations { id name ownerEmail } } }'};}
function buildChannelsQuery(organizationId){return {query:`query GetChannels { channels(input: { organizationId: ${gqlString(organizationId)} }) { id name displayName service isQueuePaused } }`};}
async function callBuffer({apiKey,fetchFn=globalThis.fetch,payload}){if(!apiKey)throw new Error('BUFFER_API_KEY_REQUIRED');const response=await fetchFn(API_URL,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},body:JSON.stringify(payload)});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`BUFFER_HTTP_${response.status}`);if(Array.isArray(body?.errors)&&body.errors.length)throw new Error(`BUFFER_GRAPHQL_ERROR:${body.errors.map(e=>e?.message||'unknown').join('|')}`);return body?.data||{};}
export async function discoverBufferScope({apiKey,fetchFn=globalThis.fetch,organizationId=null,channelIds=null,targetServices=['linkedin','instagram']}={}){let orgId=organizationId;if(!orgId){const data=await callBuffer({apiKey,fetchFn,payload:buildOrganizationsQuery()});const organizations=data?.account?.organizations||[];if(!organizations.length)throw new Error('BUFFER_ORGANIZATION_NOT_FOUND');orgId=organizations[0].id;}let channels=[];if(Array.isArray(channelIds)&&channelIds.length){channels=channelIds.map(id=>({id,service:null,name:null,displayName:null}));}else{const data=await callBuffer({apiKey,fetchFn,payload:buildChannelsQuery(orgId)});const wanted=new Set(targetServices.map(x=>String(x).toLowerCase()));channels=(data?.channels||[]).filter(channel=>wanted.has(platformFromService(channel?.service)));}if(!channels.length)throw new Error('BUFFER_SOCIAL_CHANNELS_NOT_FOUND');return {organizationId:orgId,channels};}
export async function collectBufferPosts({apiKey,organizationId,channelIds,channelServices={},channelMetadata={},tenantId='canonical',fetchFn=globalThis.fetch,ingest,now=new Date(),since=null,maxPages=20}={}){if(!apiKey)throw new Error('BUFFER_API_KEY_REQUIRED');if(!organizationId)throw new Error('BUFFER_ORGANIZATION_ID_REQUIRED');if(!Array.isArray(channelIds)||!channelIds.length)throw new Error('BUFFER_CHANNEL_IDS_REQUIRED');if(typeof ingest!=='function')throw new TypeError('BUFFER_INGEST_REQUIRED');let after=null,pages=0,posts=0;do{if(pages>=maxPages)throw new Error('BUFFER_PAGINATION_LIMIT_REACHED');const payload=buildBufferPostsQuery({organizationId,channelIds,after,since});const data=await callBuffer({apiKey,fetchFn,payload});const connection=data?.posts||{};for(const edge of connection?.edges||[]){const node=edge?.node;if(!node?.id)continue;const meta=channelMetadata[node.channelId]||{};const envelope=normalizeBufferPost(node,{tenantId,service:channelServices[node.channelId],channelId:node.channelId,channelName:meta.channelName||null,channelKind:meta.channelKind||null,observedAt:now.toISOString()});await ingest(envelope);posts++;}pages++;after=connection?.pageInfo?.hasNextPage?connection?.pageInfo?.endCursor:null;}while(after);return {pages,posts};}
export { platformFromService };
