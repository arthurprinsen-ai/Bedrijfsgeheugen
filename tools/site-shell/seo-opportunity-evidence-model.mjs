/**
 * Evidence-first opportunity prioritization inside ORIGINAL Powerhouse SEO Order Engine.
 * Pure model only: no API, no scheduler, no DB writes, no automatic publishing.
 * Scores are decision priorities, never predictions of traffic, rank or revenue.
 */
export const SEO_OPPORTUNITY_WEIGHTS=Object.freeze({
  commercialFit:30,organicFeasibility:20,demand:15,ownSearchGap:15,
  verifiedMarketMovement:10,technicalAndExternal:10
});
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const numeric=v=>(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))?null:Number(v);
const dateValue=v=>{const d=Date.parse(v||'');return Number.isFinite(d)?d:null;};
const get=(obj,...names)=>{for(const name of names){if(obj?.[name]!==undefined&&obj[name]!==null)return obj[name];}return null;};
const norm=v=>String(v??'').trim().toLowerCase();
const round=n=>Math.round(n*100)/100;
const minDate=Date.parse('2020-01-01T00:00:00Z');

function externalSignals(items,now){
 const valid=[];
 const hosts=new Set();
 for(const signal of Array.isArray(items)?items:[]){
  let parsed;
  try{parsed=new URL(signal?.url||'');}catch{continue;}
  if(parsed.protocol!=='https:'||!parsed.hostname||hosts.has(parsed.hostname))continue;
  const seen=dateValue(signal?.observedAt);
  if(!seen||seen<minDate||seen>now||(now-seen)/86400000>90||signal.independent!==true)continue;
  hosts.add(parsed.hostname);
  valid.push({url:parsed.toString(),observedAt:signal.observedAt,kind:norm(signal.kind)||'market_event'});
 }
 return valid.slice(0,5);
}

/**
 * Separate rank difficulty from ad competition and advertising CPC.
 * Consumer receipts, Search Console and provider attribution are external proof,
 * not facts fabricated by this scorer.
 */
export function scoreSeoOpportunityEvidence(item,{canonicalOwner=null,asOf='2026-11-12T00:00:00Z'}={}){
 if(!item||typeof item!=='object')throw new TypeError('SEO_OPPORTUNITY_SOURCE_REQUIRED');
 const now=dateValue(asOf);
 if(!now)throw new TypeError('SEO_AS_OF_INVALID');
 const fields=get(item,'searchVolume','volume');
 const volume=numeric(fields);
 const fit=clamp(numeric(item.businessFit)??0);
 const rawIntent=norm(get(item,'searchIntent','intent')??item.search_intent_info?.main_intent);
 const intent=rawIntent||'not_measured';
 const organicDifficulty=numeric(get(item,'organicDifficulty','keywordDifficulty')??item.keyword_properties?.keyword_difficulty);
 const adsCompetition=numeric(get(item,'adsCompetition','paidCompetition')??item.keyword_info?.competition);
 const cpc=numeric(get(item,'cpcUsd','cpc')??item.keyword_info?.cpc);
 const pos=numeric(get(item,'gscPosition','organicPosition'));
 const impressions=numeric(item.gscImpressions);
 const clicks=numeric(item.gscClicks);
 const gscObserved=impressions!==null&&impressions>=0&&clicks!==null&&clicks>=0&&clicks<=impressions;
 const yearlyTrend=numeric(get(item,'yearlySearchTrendPercent')??item.search_volume_trend?.yearly);
 const tech=numeric(get(item,'technicalErrorCount','siteHealthErrorCount'));
 const external=externalSignals(item.externalSignals,now);
 const missing=[];
 if(!rawIntent)missing.push('SEARCH_INTENT_NOT_MEASURED');
 if(organicDifficulty===null||organicDifficulty<0||organicDifficulty>100)missing.push('ORGANIC_KEYWORD_DIFFICULTY_NOT_MEASURED');
 if(!gscObserved)missing.push('GSC_QUERY_PAGE_NOT_MEASURED');
 if(pos===null)missing.push('GSC_POSITION_NOT_MEASURED');
 if(yearlyTrend===null)missing.push('SEARCH_TREND_NOT_MEASURED');
 if(tech===null)missing.push('TECHNICAL_HEALTH_NOT_LINKED');
 if(!item.fitEvidence)missing.push('BUSINESS_FIT_RATIONALE_MISSING');
 if(!external.length)missing.push('INDEPENDENT_EXTERNAL_EVENT_NOT_MEASURED');
 const intentCoefficient={
  transactional:1,commercial:1,local:0.9,informational:0.67,navigational:0.55
 }[intent]??0.7;
 // CPC is at most a minor *paid buyer signal*. It is never organic difficulty or realized revenue.
 const paidBuyerSignal=cpc===null?0.45:clamp(cpc/20);
 const commercialFit=30*fit*(0.88*intentCoefficient+0.12*paidBuyerSignal);
 // Low difficulty is feasible; an already proven rank outside top 30 requires relevance first.
 const organicBase=organicDifficulty===null?0.42:clamp(1-organicDifficulty/100);
 const rankAdjustment=pos!==null&&pos>40?0.7:1;
 const organicFeasibility=20*organicBase*rankAdjustment;
 const demand=15*clamp(Math.log10(1+Math.max(0,volume??0))/Math.log10(1001));
 let ownSearchGap=2.25;
 if(gscObserved&&impressions>0){
  const observedGap=clamp(Math.log10(1+impressions)/Math.log10(201));
  if(pos!==null&&pos>30)ownSearchGap=15*observedGap*0.8; // Ranking gap, never a claimed CTR opportunity.
  else if(pos!==null&&pos>=4&&pos<=30)ownSearchGap=15*observedGap*0.9;
  else ownSearchGap=15*observedGap*0.45;
 }
 const movement=yearlyTrend===null?0.25:clamp((yearlyTrend+30)/180);
 const verifiedMarketMovement=10*(0.6*movement+0.4*clamp(external.length/2));
 const technicalReadiness=tech===null?0.4:tech>0?0.85:0.5; // Repairable defects outrank cosmetic work.
 const technicalAndExternal=10*(0.75*technicalReadiness+0.25*clamp(external.length/2));
 const components={commercialFit,organicFeasibility,demand,ownSearchGap,verifiedMarketMovement,technicalAndExternal};
 const score=round(clamp(Object.values(components).reduce((sum,n)=>sum+n,0),0,100));
 const hasRankingGap=pos!==null&&pos>30&&gscObserved&&impressions>0;
 const action=tech!==null&&tech>0?'REPAIR_TECHNICAL_SOURCE_FIRST'
  :hasRankingGap?'IMPROVE_EXISTING_CANONICAL_RELEVANCE_AND_INTERNAL_LINKS'
  :!gscObserved?'RECONCILE_GSC_QUERY_PAGE_AND_INTENT_FIRST'
  :pos!==null&&pos>=4&&pos<=30?'REVIEW_SERP_SNIPPET_AND_CONTENT_INTENT'
  :'VALIDATE_COMPETITOR_SERP_BEFORE_CONTENT_CHANGE';
 const verifiedCount=[Boolean(rawIntent),organicDifficulty!==null,gscObserved,pos!==null,
  yearlyTrend!==null,tech!==null,Boolean(item.fitEvidence),external.length>0].filter(Boolean).length;
 const confidence=verifiedCount>=7?'HIGH':verifiedCount>=4?'MEDIUM':'LOW';
 return {
  score,scoreVersion:'SEO_REVENUE_EVIDENCE_V2',components:Object.fromEntries(Object.entries(components).map(([k,v])=>[k,round(v)])),
  weights:SEO_OPPORTUNITY_WEIGHTS,
  action,confidence,sourceCompleteness:round(verifiedCount/8),
  missingEvidence:missing,
  diagnostics:{canonicalOwner,searchIntent:intent,searchVolumeEstimate:volume,
   paidCpcUsd:cpc,paidAdsCompetition:adsCompetition,organicDifficulty,
   gscImpressions:gscObserved?impressions:null,gscClicks:gscObserved?clicks:null,
   gscPosition:pos,searchTrendYearlyPercent:yearlyTrend,
   verifiedIndependentEvents:external,technicalErrorCount:tech,
   monetization:'REAL_LEADS_AND_ORDERS_NOT_MEASURED_BY_MODEL',
   aiVisibility:'REQUIRES_PROVIDER_CITATION_OR_HUMAN_REFERRER_EVIDENCE'},
  boundaries:['No automatic page creation from score','Paid ads competition is not organic ranking difficulty',
   'AI estimated searches are not ChatGPT or Claude referrals','Score is not forecast revenue or actual traffic']
 };
}
