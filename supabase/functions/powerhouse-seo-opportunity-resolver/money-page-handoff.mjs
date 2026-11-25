/** Original SEO order engine consumer handoff; NOT a publication or conversion proof.
 * Only one site-canonical money owner per date; strict source freshness and
 * durable existing recommendation table prevent forecast-only silent success. */
export const SEO_MONEY_OWNER_HANDOFF='SEO_ORIGINAL_MONEY_OWNER_HANDOFF_V1';
const ORIGIN='https://www.bedrijfsgeheugen.nl';
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
export function selectOriginalSeoMoneyHandoffs(opportunities,{runDate,observedAt,max=3}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(runDate||''))||!Number.isFinite(Date.parse(observedAt||'')))throw Error('SEO_HANDOFF_CLOCK_REQUIRED');
 const clock=Date.parse(observedAt);
 const bounded=Math.min(3,Math.max(1,Math.floor(Number(max)||3)));
 const selected=[],seen=new Set();
 for(const item of [...(opportunities||[])].sort((a,b)=>Number(b.score||0)-Number(a.score||0))){
  const page=item?.owner, source=item?.row, score=Number(item?.score);
  if(item?.action!=='UPDATE_MONEY_PAGE'||page?.role!=='money'||!finite(score)||score<65||!source)continue;
  // Do not optimize a commercial integration page for an adjacent generic
  // software/product query unless its canonical keyword map owns it explicitly.
  const normalized=s=>String(s||'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  if(![page.primary_keyword,...(page.secondary_keywords||[])].some(alias=>normalized(alias)===normalized(item.keyword)))continue;
  let url,cta;
  try{url=new URL(page.route);cta=new URL(page.primary_cta?.url);}catch{continue;}
  if(url.origin!==ORIGIN||url.search||url.hash||cta.origin!==ORIGIN||!url.pathname.startsWith('/')||url.pathname==='/')continue;
  const age=clock-Date.parse(source.opgehaald_op||'');
  if(!Number.isFinite(age)||age<0||age>14*86400000)continue;
  if(seen.has(url.pathname))continue;
  seen.add(url.pathname);
  const key=url.pathname.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9/-]/gi,'-').replaceAll('/','-');
  selected.push({
    dedupe_key:'seo-owner-update:'+runDate+':'+key,
    run_date:runDate,topic_key:String(item.keyword||'').trim(),content_key:'seo-owner:'+url.pathname,
    target_channel:'website',recommendation_type:'seo_money_page_update',
    priority:score,
    reason:'Existing canonical money page undercaptures source-observed search intent: '+String(item.keyword||'').trim()+'. Inspect and implement the smallest reversible SEO/CRO improvement; no duplicate blog.',
    status:'suggested',
    evidence:{
      contract:SEO_MONEY_OWNER_HANDOFF,
      state:'ORIGINAL_SEO_EXECUTION_HANDOFF_PENDING',
      execution_owner:'existing Powerhouse SEO Order Engine via protected GitHub/Netlify delivery',
      canonical_owner:url.href,
      canonical_intent:page.primary_intent,
      canonical_cta:cta.href,
      keyword:String(item.keyword||'').trim(),
      source:'dataforseo-cache',
      source_observed_at:source.opgehaald_op,
      search_volume:finite(Number(source.zoekvolume))?Number(source.zoekvolume):null,
      cpc_eur:finite(Number(source.cpc))?Number(source.cpc):null,
      gsc:item.gsc||null,
      forecast_id:item.forecast?.forecast_id||null,
      action:'UPDATE_MONEY_PAGE',
      allowed_interventions:['title-meta','keyword-cluster-expansion','internal-link','conversion-path','faq-objection'],
      verification:['original source write','protected Required/CodeQL','exact-main Netlify production','public canonical+CTA readback','GSC/GA4 metrics+outcome attribution'],
      terminal_state:'EVIDENCE_DUE',
      no_auto_blog:true,no_unverified_execution_or_revenue:true
    }
  });
  if(selected.length>=bounded)break;
 }
 return selected;
}


/** One ORIGINAL website owner, one unresolved or source-identical obligation.
 * The daily SEO observer may run every day without creating a new money-page
 * task for the same page and still-identical evidence. Historical state is
 * read from the existing canonical recommendation table, never a new queue.
 * Returns skipped evidence for visibility; does not rewrite old decisions. */
export function reconcileOriginalSeoMoneyHandoffs(candidates,priorRows=[]){
 const history=[...(priorRows||[])].filter(x=>
  x&&x.evidence?.contract===SEO_MONEY_OWNER_HANDOFF&&
  x.recommendation_type==='seo_money_page_update'&&
  x.target_channel==='website'&&
  ['suggested','accepted','done','skipped'].includes(x.status)&&
  typeof x.evidence?.canonical_owner==='string'
 );
 const selected=[],suppressed=[];
 for(const item of candidates||[]){
  const owner=item.evidence?.canonical_owner;
  const observed=Date.parse(item.evidence?.source_observed_at||'');
  const prior=history.find(x=>{
   if(x.evidence.canonical_owner!==owner) return false;
   // Open (not consumed) work holds its canonical page, even if upstream data
   // changes. Completed/rejected work may re-open only for NEW source evidence.
   if(x.status==='suggested'||x.status==='accepted')return true;
   const earlier=Date.parse(x.evidence?.source_observed_at||'');
   return Number.isFinite(observed)&&Number.isFinite(earlier)&&observed===earlier;
  });
  if(prior) suppressed.push({
   dedupe_key:item.dedupe_key,canonical_owner:owner,
   prior_dedupe_key:prior.dedupe_key,prior_status:prior.status,
   reason:prior.status==='suggested'||prior.status==='accepted'?
      'ORIGINAL_OWNER_HANDOFF_STILL_UNCONSUMED':'ORIGINAL_OWNER_SOURCE_UNCHANGED',
   source_observed_at:item.evidence?.source_observed_at||null
  });
  else selected.push(item);
 }
 return {selected,suppressed};
}
