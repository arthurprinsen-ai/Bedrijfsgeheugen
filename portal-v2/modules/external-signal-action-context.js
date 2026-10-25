// Evidence-only projection over the authenticated portal response.
// Never fetch, infer financial outcomes, or dispatch commercial actions here.
const rows=value=>Array.isArray(value)?value:[];
const str=value=>String(value??'').trim();
const finite=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
const sourceUrl=value=>{
  try {const u=new URL(str(value));return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.href:null}
  catch{return null}
};

export function explainExternalSignal(signal={},actionCandidates=[],now=Date.now()){
  const impacts=rows(signal.company_impacts).filter(x=>x&&x.status==='SCORED'&&finite(x.impact_score)!==null)
    .sort((a,b)=>(finite(b.impact_score)??0)-(finite(a.impact_score)??0));
  const impact=impacts[0]||null;
  const exact=rows(actionCandidates).filter(x=>x&&x.signal_key&&x.signal_key===signal.signal_key);
  const tenant=exact.filter(x=>x.tenant_specific===true&&['CANDIDATE','READY','MATERIALIZED','DONE'].includes(x.status))
    .sort((a,b)=>(finite(b.priority_score)??0)-(finite(a.priority_score)??0));
  const general=exact.filter(x=>x.tenant_specific===false&&['CANDIDATE','READY','MATERIALIZED'].includes(x.status))
    .sort((a,b)=>(finite(b.priority_score)??0)-(finite(a.priority_score)??0));
  const action=tenant[0]||general[0]||null;
  const isTenant=action?.tenant_specific===true;
  const nextStep=isTenant&&action.status==='DONE'
    ?'Controleer bewijs van uitvoering, meet het daadwerkelijke resultaat en sluit pas daarna de leerlus.'
    :isTenant
      ?str(action.rationale||action.title||'Toets de impact en leg de vervolgstap vast.')
      :'Toets of dit signaal jouw bedrijf raakt, controleer de oorspronkelijke bron en wijs een eigenaar aan.';
  const date=str(signal.published_at||signal.observed_at);
  const timestamp=Date.parse(date);
  const dateValid=Number.isFinite(timestamp)&&timestamp<=now+3600000;
  const age=dateValid?Math.max(0,now-timestamp):null;
  const url=sourceUrl(signal.external_url);
  return Object.freeze({
    reason:impact?str(impact.rationale)||'Er is bedrijfsspecifieke impact gescoord; controleer de onderbouwing.'
      :'De impact op jouw bedrijf is nog niet vastgesteld. Dit is geen bewezen risico of commerciële kans.',
    nextStep,
    affected:impact?str(impact.target_label||impact.target_node_key):null,
    tenantImpactConfirmed:Boolean(impact),
    scope:isTenant?'KLANTSPECIFIEK':action?'ALGEMEEN_VOORSTEL':'NOG_GEEN_ACTIE',
    actionStatus:isTenant?str(action.status):'REVIEW_REQUIRED',
    owner:isTenant?str(action.owner_hint):null,
    canOpenAction:Boolean(isTenant&&str(action.canonical_action_ref)&&action.status!=='DONE'),
    sourceUrl:url,
    sourceState:!url?'BRON_URL_ONTBREEKT':!dateValid?'BRONDATUM_NIET_BEVESTIGD':age>14*86400000?'BRON_OUDER_DAN_14_DAGEN':'RECENTE_BRON',
    outcomeVerified:false
  });
}
