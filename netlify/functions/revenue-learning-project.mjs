import {createRevenueLearningStore} from './_revenue-learning-store.mjs';

const num=v=>v===undefined||v===null||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
const socialSubstantive=m=>[m?.comments,m?.shares,m?.saves].map(num).filter(v=>v!==null).reduce((a,b)=>a+b,0);

export function projectRevenueCandidate(candidate={}){
  const m=candidate.metrics||{};
  const social=candidate.kind==='social';
  const attributionKey=candidate.attributionRootKey?String(candidate.attributionRootKey):candidate.canonical?`canonical:${candidate.canonical}`:`content:${candidate.contentId}`;
  return {
    evidenceId:`${candidate.contentId}:${Number(candidate.windowHours||0)}`,
    contentId:String(candidate.contentId||''),channel:String(candidate.channel||'unknown'),canonical:candidate.canonical||null,
    attributionKey,dataQuality:candidate.attributionRootKey?'OBSERVED':'INFERRED',publishedAt:candidate.publishedAt||null,
    publicationDate:(candidate.publishedAt||'').slice(0,10)||null,windowHours:Number(candidate.windowHours||0),
    componentFingerprint:candidate.componentFingerprint||candidate.contentId||'unknown',
    exposures:num(social?(m.impressions??m.reach):m.pageViews),
    clicks:num(social?m.clicks:m.ctaClicks),
    substantive_interactions:social?socialSubstantive(m):num(m.substantiveInteractions),
    leads:num(social?m.leads:m.leads),qualified_leads:num(social?m.qualified_leads:m.qualifiedLeads),
    meetings:num(social?m.meetings:m.appointments),proposals:num(social?(m.offers??m.proposals):m.proposals),
    orders:num(social?m.orders:m.wonOrders),revenue_eur:num(social?(m.revenue??m.revenue_eur):m.revenueEur),
    attributes:candidate.attributes||{},sourceRefs:candidate.sourceRefs||[]
  };
}

export function createRevenueProjector({source,store,now=()=>new Date(),batchSize=100,budgetMs=12000}={}){
  return async()=>{
    const started=Date.now();
    const activeStore=store||createRevenueLearningStore();const activeSource=source||activeStore;
    const candidates=await activeSource.listProjectionCandidates(now().toISOString());let projected=0;
    const recordFailure=(candidate,error)=>activeStore.recordObligation({id:`projection:${candidate.contentId}:${candidate.windowHours}`,type:'PROJECTION_FAILED',status:'OPEN',contentId:candidate.contentId,windowHours:candidate.windowHours,error:String(error?.message||error)});
    const single=async candidate=>{
      try{await activeStore.upsertEvidence(projectRevenueCandidate(candidate));projected++;}
      catch(error){await recordFailure(candidate,error);}
    };
    // Bounded batches: one gateway call per batch instead of one per candidate, so the hourly run
    // finishes inside the scheduled-function limit. Per-item fallback keeps failure attribution.
    for(let i=0;i<candidates.length;i+=batchSize){
      if(Date.now()-started>budgetMs)break;
      const chunk=candidates.slice(i,i+batchSize);
      if(typeof activeStore.upsertEvidenceBatch==='function'){
        try{await activeStore.upsertEvidenceBatch(chunk.map(projectRevenueCandidate));projected+=chunk.length;continue;}
        catch(error){/* fall through to per-item so one bad row cannot hide the rest */}
      }
      for(const candidate of chunk){if(Date.now()-started>budgetMs)break;await single(candidate);}
    }
    return {projected,total:candidates.length,unprojected:Math.max(0,candidates.length-projected)};
  };
}

export default async()=>{await createRevenueProjector()();return new Response(null,{status:204});};
export const config={schedule:'@hourly'};
