// Canonical, bounded research -> ORIGINAL commercial composer handoff.
// A research record is not a send authorization. All normal quality, recipient,
// consent, suppression, duplicate and Gmail provider readback gates remain active.
const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function publicHttps(v){
  try{
    const u=new URL(clean(v));
    if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')
      ||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname))return null;
    return u.toString();
  }catch{return null}
}
function recent(value,nowMs,maxAgeMs){
  const ms=Date.parse(clean(value));
  return Number.isFinite(ms)&&ms<=nowMs+300_000&&ms>=nowMs-maxAgeMs;
}
export function sourceVerifiedComposerHandoff(action,research,news,nowIso){
  const original=clean(action?.action_id),evidence=research?.evidence||{};
  const recorded=evidence?.public_research_execution||{};
  const nowMs=Date.parse(clean(nowIso));
  if(!UUID.test(original)||!Number.isFinite(nowMs)||research?.status!=='done'
    ||clean(evidence?.original_outreach_action_id)!==original
    ||clean(action?.evidence?.execution_gate?.reason)!=='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
    ||!clean(action?.person_key)||clean(action.person_key)!==clean(research.person_key)
    ||!clean(action?.company_key)||clean(action.company_key)!==clean(research.company_key)
    ||!norm(action?.company_name)||norm(action.company_name)!==norm(news?.bedrijf)
    ||news?.over_dit_bedrijf!==true||clean(news?.afgewezen_reden)!==''
    ||!recent(research?.executed_at,nowMs,14*86_400_000)
    ||!recent(news?.gepubliceerd_op||news?.opgehaald_op,nowMs,120*86_400_000)
    ||!recent(news?.opgehaald_op,nowMs,30*86_400_000)
    ||Number(news?.zekerheid)<70
    ||clean(recorded?.contract)!=='powerhouse-relationship-research-auto-enrichment-v1')return null;
  const url=publicHttps(news?.url);
  if(!url||url!==publicHttps(recorded?.source_url)||url!==publicHttps(research?.source_url))return null;
  const headline=clean(news?.titel),summary=clean(news?.haak);
  if(headline.length<24||summary.length<24||!norm(headline+' '+summary).includes(norm(news.bedrijf)))return null;
  const sourceEvidence={
    event_type:'relationship_public_research_evidence',
    source:'bg_bedrijfsnieuws',
    occurred_at:news.opgehaald_op,
    evidence:{headline,summary,source_url:url,published_at:news.gepubliceerd_op,
      verified_company:news.bedrijf,source_quality_score:Number(news.zekerheid)},
    context:{research_action_id:research.action_id,original_outreach_action_id:original}
  };
  return {
    ...action,
    source_url:url,
    message_plan:{...(action.message_plan||{}),human_readable_context:true,source_trigger_relevance:true},
    evidence:{...(action.evidence||{}),headline,summary,public_source_evidence:sourceEvidence,
      verified_research_composer_handoff:{
        contract:'POWERHOUSE_VERIFIED_RESEARCH_COMPOSER_HANDOFF_V1',
        original_outreach_action_id:original,research_action_id:research.action_id,
        source_authority:'bg_bedrijfsnieuws',source_url:url,
        source_published_at:news.gepubliceerd_op,source_fetched_at:news.opgehaald_op,
        reconciled_at:nowIso,
        quality_approved:false,recipient_authorized_by_handoff:false,
        provider_send_executed:false,external_delivery_proven:false
      }}
  };
}
