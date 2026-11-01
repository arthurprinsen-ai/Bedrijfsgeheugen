// Customer value briefing from the ORIGINAL authenticated Executive Projection.
// Read-only: never create a customer action, settle an outcome, or claim paid revenue.
const escapeHtml = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = v => typeof v==='string'?v.trim():'';
const refs = x => Array.isArray(x?.source_refs)?[...new Set(x.source_refs.map(clean).filter(Boolean))]:[];
const verifiedEvidence = x => x?.evidence_health?.status==='healthy' && refs(x).length>0;
const terminal = new Set(['VERIFIED','OUTCOME_VERIFIED','REALIZED_VERIFIED']);
const excluded = new Set(['BLOCKED','FAILED','CANCELLED','REJECTED','DEFERRED','DONE','COMPLETED','EXECUTING','QUEUED','READBACK_PENDING','OUTCOME_PENDING']);
const number = v => v===null||v===undefined||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))?null:Number(v);
const units = new Set(['EUR','HOURS','COUNT','PERCENT']);
const formatValue = (v,unit) => unit==='EUR'
 ?new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(v)
 :new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(v)+(unit==='HOURS'?' uur':unit==='PERCENT'?'%':'');

function resultFor(action,outcomes){
 if(!clean(action?.id))return null;
 for(const outcome of Array.isArray(outcomes)?outcomes:[]){
  if(clean(outcome?.action_id||outcome?.source_action_id)!==clean(action.id))continue;
  if(!terminal.has(clean(outcome?.verification_status||outcome?.status).toUpperCase()) || !verifiedEvidence(outcome))continue;
  const result=outcome.realized||{};
  const amount=number(result.amount??outcome.realized_amount);
  const unit=clean(result.unit||outcome.realized_unit).toUpperCase();
  const metric=clean(result.metric_id||outcome.realized_metric_id||outcome.metric_id);
  const baseline=clean(result.baseline_id||outcome.realized_baseline_id||outcome.baseline_id);
  const period=clean(result.period_id||outcome.realized_period_id||outcome.measurement_period);
  // A provider ACK, untyped euro amount or missing baseline is NOT customer value.
  if(amount===null||!units.has(unit)||!metric||!baseline||!period)continue;
  return Object.freeze({amount,unit,metric,baseline,period,sourceRefs:Object.freeze(refs(outcome)),
   learningProven:outcome.learning_verified===true&&Array.isArray(outcome.learning_evidence_refs)&&outcome.learning_evidence_refs.some(v=>clean(v))&&Boolean(clean(outcome.next_decision_id||outcome.next_decision))});
 }
 return null;
}

export function buildCustomerValueBriefing(model={}){
 if(model?.available!==true)return Object.freeze({available:false,reason:'tenant-evidence-unavailable'});
 const actions=Array.isArray(model.next_best_actions)?model.next_best_actions:[];
 const next=actions.find(a=>verifiedEvidence(a)&&clean(a?.id)&&!excluded.has(clean(a?.status).toUpperCase()));
 if(!next)return Object.freeze({available:false,reason:'eligible-action-evidence-due'});
 const problem=(Array.isArray(model.problems)?model.problems:[]).find(p=>verifiedEvidence(p)&&clean(p.problem_id)&&p.problem_id===next.problem_id);
 const metric=clean(typeof next.success_metric==='string'?next.success_metric:next.success_metric?.label||next.success_metric?.name||next.target_metric);
 const baseline=clean(next.baseline_id||next.baseline_ref);
 const impact=next.expected_impact||next.expectedImpact||{};
 const expectedAmount=number(impact.amount);
 const expectedUnit=clean(impact.unit).toUpperCase();
 const expectedKind=clean(impact.kind).toLowerCase();
 const expected=['forecast','estimated','assumption','derived'].includes(expectedKind)&&units.has(expectedUnit)&&expectedAmount!==null
  ?formatValue(expectedAmount,expectedUnit):null;
 return Object.freeze({available:true,id:clean(next.id),title:clean(next.title||next.label)||'Controleer dit verbeterpunt',
  problem:clean(problem?.title||next.problem_statement)||'Oorzaak nog te bevestigen',
  nextAction:clean(next.next_action||next.recommended_action)||'Beoordeel de onderbouwing en bepaal de eerste veilige stap.',
  metric:metric||null,baseline:baseline||null,expected,expectedKind:expected?expectedKind:null,
  approvalRequired:Boolean(next.requires_approval||next.approval_required||next.decision_required),
  sourceRefs:Object.freeze(refs(next)),result:resultFor(next,model.outcomes)});
}

export function customerValueBriefingMarkup(model={}){
 const briefing=buildCustomerValueBriefing(model);
 const intro='<header><small>Jouw bedrijf beter maken · Powerhouse</small><h3>Welke verbetering pakken we vandaag aan?</h3><p>Van bedrijfsprobleem naar besluit, uitvoering, gemeten effect en leren. Alleen bewijs telt als gerealiseerde waarde.</p></header>';
 if(!briefing.available)return '<section class="os-strategy-advisor" data-customer-value="evidence-due" aria-label="Bedrijfsverbetering">'+intro+
 '<p>Er is nog geen actuele, onderbouwde en uitvoerbare verbeteractie. Begin met een betrouwbare nulmeting en controleer de gekoppelde bedrijfsgegevens. Geen verzonnen omzet- of ROI-claims.</p>'+
 '<button type="button" data-os-page="evidence-health" aria-pressed="false">Controleer bedrijfsgegevens →</button></section>';
 const proof=briefing.result
  ?'<p><b>Werkelijk gemeten:</b> '+escapeHtml(formatValue(briefing.result.amount,briefing.result.unit))+' · '+escapeHtml(briefing.result.metric)+' · periode '+escapeHtml(briefing.result.period)+'. Geverifieerd meetresultaat, niet automatisch door deze actie veroorzaakte winst of betaalde omzet.</p>'+
   '<p><b>Leereffect:</b> '+(briefing.result.learningProven?'geverifieerde volgende beslissing gekoppeld.':'nog niet onafhankelijk bewezen.')+'</p>'
  :'<p><b>Werkelijk resultaat:</b> nog niet aangetoond. Een actie, publicatie of providerbevestiging is geen omzetbewijs.</p>';
 return '<section class="os-strategy-advisor" data-customer-value="action-evidence" aria-label="Bedrijfsverbetering">'+intro+
 '<article class="os-strategy-card"><h4>'+escapeHtml(briefing.title)+'</h4><p><b>Waarom:</b> '+escapeHtml(briefing.problem)+'</p>'+
 '<p><b>Wat nu:</b> '+escapeHtml(briefing.nextAction)+'</p>'+
 '<p><b>Meetlat:</b> '+escapeHtml(briefing.metric||'nog vast te leggen')+' · <b>Nulmeting:</b> '+escapeHtml(briefing.baseline||'ontbreekt')+'</p>'+
 '<p><b>Verwachte waarde:</b> '+(briefing.expected?escapeHtml(briefing.expected)+' ('+escapeHtml(briefing.expectedKind)+', geen realisatie)':'nog niet betrouwbaar te kwantificeren')+'</p>'+
 proof+'<p>'+(briefing.approvalRequired?'Jouw toestemming of bevoegd besluit is vereist vóór uitvoering.':'Uitvoering uitsluitend via de bestaande goedgekeurde Powerhouse-policy.')+'</p>'+
 '<details><summary>Waarop is dit gebaseerd?</summary><p>'+briefing.sourceRefs.map(escapeHtml).join(' · ')+'</p></details>'+
 '<button type="button" data-os-page="next-best-actions" aria-pressed="false">Beoordeel deze verbeteractie →</button></article></section>';
}
