/**
 * Existing SEO resolver #105: source-provenance-preserving projection only.
 * NO provider request, new scheduler, DB model, experimental action or publish.
 * The original DataForSEO keyword cache remains upstream authority.
 */
const site='https://www.bedrijfsgeheugen.nl/';
const clean=v=>String(v??'').trim();
const numberOrNull=value=>value===null||value===undefined||value===''||!Number.isFinite(Number(value))?null:Number(value);
const validHttpsSite=value=>{try{const url=new URL(clean(value));return url.protocol==='https:'&&url.origin===new URL(site).origin&&url.username===''&&url.password===''?url.href:null;}catch{return null;}};
const norm=value=>clean(value).toLocaleLowerCase('nl').replace(/\s+/g,' ');

export function planOriginalSeoKeywordCacheProjection(cachedRows,{
  resolveOwner,existingRows=[],asOf,maxAgeDays=7,maxRows=80
}={}){
  if(!Array.isArray(cachedRows)||typeof resolveOwner!=='function'||!Array.isArray(existingRows))throw new TypeError('SEO_SOURCE_AND_OWNER_REQUIRED');
  const now=Date.parse(asOf||new Date().toISOString());
  if(!Number.isFinite(now)||maxAgeDays<=0||maxAgeDays>30||maxRows<1||maxRows>200)throw new TypeError('SEO_SOURCE_WINDOW_INVALID');
  const prior=new Map(existingRows.map(row=>[norm(row.keyword),Date.parse(row.observed_at||row.observedAt||'')]));
  const candidates=new Map(),rejected={source:0,timestamp:0,old:0,owner:0,volume:0,already_projected:0};
  for(const row of cachedRows){
    const keyword=clean(row.zoekwoord),key=norm(keyword),source=norm(row.bron);
    if(!keyword||!key||source!=='dataforseo'){rejected.source++;continue;}
    const timestamp=Date.parse(row.opgehaald_op||'');
    if(!Number.isFinite(timestamp)||timestamp>now){rejected.timestamp++;continue;}
    if(now-timestamp>maxAgeDays*86400000){rejected.old++;continue;}
    const owner=resolveOwner(keyword),canonical=validHttpsSite(owner?.route);
    const destination=validHttpsSite(owner?.primary_cta?.url);
    if(!canonical||owner?.match_score<0.72||!destination){rejected.owner++;continue;}
    const volume=numberOrNull(row.zoekvolume);
    if(volume===null||volume<0||!Number.isInteger(volume)){rejected.volume++;continue;}
    const current=prior.get(key);
    if(Number.isFinite(current)&&timestamp<=current){rejected.already_projected++;continue;}
    const previous=candidates.get(key);
    if(previous&&Date.parse(previous.observed_at)>=timestamp)continue;
    const paidCpc=numberOrNull(row.cpc),paidCompetition=numberOrNull(row.concurrentie);
    candidates.set(key,{
      tenant_id:'canonical',locale:'nl',market:'Netherlands',language_code:'nl',
      keyword,search_volume:volume,cpc_eur:null,competition:null,competition_index:null,
      intent_class:['support','blog-index'].includes(owner.role)?'informational':'commercial',
      canonical_owner:canonical,conversion_destination:destination,
      source:'dataforseo-original-keyword-cache',observed_at:new Date(timestamp).toISOString(),
      evidence:{
        authority:'bg_zoekwoordkansen',upstream_provider:'dataforseo',
        original_reader:'powerhouse-seo-opportunity-resolver',
        source_observed_at:new Date(timestamp).toISOString(),
        exact_provider_event_id:'NOT_PRESENT_IN_ORIGINAL_CACHE',
        cache_projection_not_new_provider_fetch:true,
        estimated_monthly_search_volume:true,paid_ad_competition:paidCompetition,
        unconverted_cpc:paidCpc,unconverted_cpc_currency:'UNKNOWN',
        paid_ads_not_organic_keyword_difficulty:true,
        canonical_intent_owner:canonical,verified_current_rank:'NOT_PROVEN',
        traffic_visits:'NOT_MEASURED',conversion_or_revenue:'NOT_MEASURED'
      }
    });
  }
  const rows=[...candidates.values()].sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at)||a.keyword.localeCompare(b.keyword)).slice(0,maxRows);
  return {contract:'SEO_ORIGINAL_SOURCE_BRIDGE_V1',rows,rejected,
    processed:cachedRows.length,accepted:rows.length,
    sourceFreshness:'CACHE_OBSERVATION_ONLY',
    noNewProviderCall:true,noNewScheduler:true,
    originalSourceTenant:'canonical',targetTenant:'canonical'};
}
