// Read-only guidance over the existing authenticated tenant-scoped Portal V2 response.
// Never fetch tenant data, invoke providers, infer realized revenue, or change actions here.
const items=value=>Array.isArray(value)?value:[];
const txt=value=>String(value??'').trim();
const finite=value=>value==null||value===''?null:Number.isFinite(Number(value))?Number(value):null;
const secureUrl=value=>{
  try { const u=new URL(txt(value)); return u.protocol==='https:'&&u.hostname&&!u.username&&!u.password?u.href:null; }
  catch {return null;}
};

export function explainExternalSignal(signal={},candidates=[],now=Date.now()){
  const impacts=items(signal.company_impacts)
    .filter(i=>i?.status==='SCORED'&&finite(i.impact_score)!==null)
    .sort((a,b)=>(finite(b.impact_score)??0)-(finite(a.impact_score)??0));
  const impact=impacts[0]||null;
  const eligible=items(candidates).filter(a=>a?.signal_key&&a.signal_key===signal.signal_key);
  const ordered=rows=>rows.sort((a,b)=>(finite(b.priority_score)??0)-(finite(a.priority_score)??0));
  const specific=ordered(eligible.filter(a=>a.tenant_specific===true&&['CANDIDATE','READY','MATERIALIZED','DONE'].includes(a.status)));
  const generic=ordered(eligible.filter(a=>a.tenant_specific===false&&['CANDIDATE','READY','MATERIALIZED'].includes(a.status)));
  const action=specific[0]||generic[0]||null;
  const tenantAction=action?.tenant_specific===true;
  const reason=impact?txt(impact.rationale)||'Er is een bedrijfsspecifieke impactscore; controleer de onderbouwing.':
    'De impact op jouw onderneming is nog niet vastgesteld. Een signaal is geen bewezen risico of kans.';
  const nextStep=tenantAction&&action.status==='DONE'
    ?'Controleer uitvoeringsbewijs, meet het echte resultaat en sluit pas daarna de leerlus.'
    :tenantAction
      ?txt(action.rationale||action.title||'Controleer dit signaal en leg een volgende stap vast.')
      :'Toets of dit signaal jouw onderneming raakt, controleer de oorspronkelijke bron en wijs een eigenaar aan.';
  const sourceUrl=secureUrl(signal.external_url);
  const t=Date.parse(txt(signal.published_at||signal.observed_at));
  const validDate=Number.isFinite(t)&&t<=now+3600000;
  const age=validDate?Math.max(0,now-t):null;
  const sourceState=!sourceUrl?'BRON_URL_ONTBREEKT':!validDate?'BRONDATUM_NIET_BEVESTIGD':age>14*86400000?'BRON_OUDER_DAN_14_DAGEN':'RECENTE_BRON';
  return Object.freeze({
    reason,nextStep,affected:impact?txt(impact.target_label||impact.target_node_key):null,
    tenantImpactConfirmed:Boolean(impact),
    scope:tenantAction?'KLANTSPECIFIEK':action?'ALGEMEEN_VOORSTEL':'NOG_GEEN_ACTIE',
    actionStatus:tenantAction?txt(action.status):'REVIEW_REQUIRED',
    owner:tenantAction?txt(action.owner_hint):null,
    canOpenAction:Boolean(tenantAction&&txt(action.canonical_action_ref)&&action.status!=='DONE'),
    sourceUrl,sourceState,outcomeVerified:false
  });
}
