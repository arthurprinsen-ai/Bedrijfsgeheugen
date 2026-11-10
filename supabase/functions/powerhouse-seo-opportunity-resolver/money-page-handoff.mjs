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
