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


const financeCases=['no_action','downside','base','upside'];
function financialForecast(action){
 const f=action?.financial_forecast,empty=Object.freeze({status:'EVIDENCE_DUE',scenarios:[],models:[],assumptions:[],frictions:[]});
 if(!verifiedEvidence(f)||clean(f.unit).toUpperCase()!=='EUR'||!clean(f.model_version)
  ||!clean(f.metric_id)||!clean(f.baseline_id)||!clean(f.period_id)
  ||(clean(action.baseline_id||action.baseline_ref)&&clean(f.baseline_id)!==clean(action.baseline_id||action.baseline_ref)))return empty;
 const models=(Array.isArray(f.models)?f.models:[]).filter(m=>clean(m?.name)&&clean(m?.version)&&refs(m).length).slice(0,8)
  .map(m=>Object.freeze({name:clean(m.name),version:clean(m.version)}));
 const assumptions=(Array.isArray(f.assumptions)?f.assumptions:[]).filter(a=>clean(a?.name)&&clean(a?.value)&&refs(a).length).slice(0,8)
  .map(a=>Object.freeze({name:clean(a.name),value:clean(a.value),unit:clean(a.unit)}));
 if(!models.length||!assumptions.length)return empty;
 const all=Array.isArray(f.scenarios)?f.scenarios:[];
 const scenarios=[];
 for(const id of financeCases){
  const matching=all.filter(a=>clean(a?.case).toLowerCase()===id);
  if(matching.length!==1||!refs(matching[0]).length)return empty;
  const value=number(matching[0].net_value_eur);
  if(value===null)return empty;
  scenarios.push(Object.freeze({id,amount:value,sourceRefs:Object.freeze(refs(matching[0]))}));
 }
 const frictions=(Array.isArray(f.frictions)?f.frictions:[]).filter(a=>clean(a?.name)&&refs(a).length).slice(0,8)
  .map(a=>Object.freeze({name:clean(a.name),cost:number(a.cost_eur),sourceRefs:Object.freeze(refs(a))}));
 return Object.freeze({status:'MODELLED_NOT_REALIZED',modelVersion:clean(f.model_version),metric:clean(f.metric_id),
  baseline:clean(f.baseline_id),period:clean(f.period_id),scenarios:Object.freeze(scenarios),
  models:Object.freeze(models),assumptions:Object.freeze(assumptions),frictions:Object.freeze(frictions),
  sourceRefs:Object.freeze(refs(f))});
}
function verifiedExecution(action){
 const x=action?.execution_proof||{},tenant=clean(action?.tenant_id||action?.tenantId);
 return Boolean(clean(action?.id)&&clean(x.action_id)===clean(action.id)
  &&clean(x.status).toUpperCase()==='INDEPENDENTLY_VERIFIED'
  &&x.independent_readback===true&&clean(x.provider_receipt_id)&&refs(x).length
  &&(!tenant||clean(x.tenant_id)===tenant)
  &&(!clean(action.baseline_id||action.baseline_ref)||clean(x.baseline_id)===clean(action.baseline_id||action.baseline_ref)));
}
function verifiedSavings(outcome,realized){
 const f=outcome?.financial_measurement||{};
 if(realized.unit!=='EUR'||clean(realized.metric).toUpperCase()!=='NET_SAVINGS_EUR'
  ||clean(f.comparator).toUpperCase()!=='NO_ACTION'||!clean(f.method_version)||!refs(f).length
  ||clean(f.action_id)!==clean(outcome.action_id||outcome.source_action_id)
  ||clean(f.baseline_id)!==realized.baseline||clean(f.period_id)!==realized.period)return null;
 const gross=number(f.gross_savings_eur),investment=number(f.implementation_cost_eur),ongoing=number(f.operating_cost_eur);
 if([gross,investment,ongoing].some(v=>v===null||v<0))return null;
 const net=Number((gross-investment-ongoing).toFixed(2));
 if(Math.abs(net-realized.amount)>0.01)return null;
 return Object.freeze({gross,investment,ongoing,net,method:clean(f.method_version),
  causality:f.causal_attribution_verified===true&&clean(f.counterfactual_evidence_ref)?'INCREMENTAL_VERIFIED':'ATTRIBUTION_UNVERIFIED',
  sourceRefs:Object.freeze(refs(f))});
}
export function buildFinancialDecisionDossier(action={},result=null){
 const forecast=financialForecast(action),executionVerified=verifiedExecution(action);
 const savings=executionVerified&&result?.savings?result.savings:null;
 const central=forecast.scenarios.find(a=>a.id==='base');
 const comparable=Boolean(central&&savings&&forecast.metric==='NET_SAVINGS_EUR'
  &&forecast.metric===result.metric&&result.unit==='EUR'
  &&forecast.baseline===result.baseline&&forecast.period===result.period);
 return Object.freeze({forecast,executionStatus:executionVerified?'INDEPENDENTLY_VERIFIED':'NOT_VERIFIED',
  savings,forecastVsActual:comparable?Number((savings.net-central.amount).toFixed(2)):null,
  comparable,closingEligible:Boolean(executionVerified&&savings&&result?.learningProven),
  closureAuthority:'ORIGINAL_ONE_BRAIN_ONLY'});
}
// Read-only original authenticated executive projection: no independent model
// engine, new scheduler, action writer, or fabricated financial result.

function resultFor(action,outcomes){
 if(!clean(action?.id))return null;
 const actionTenant=clean(action.tenant_id||action.tenantId);
 const actionBaseline=clean(action.baseline_id||action.baseline_ref);
 for(const outcome of Array.isArray(outcomes)?outcomes:[]){
  if(clean(outcome?.action_id||outcome?.source_action_id)!==clean(action.id))continue;
  // The authenticated tenant projection is authoritative; reject any explicit cross-tenant evidence.
  const outcomeTenant=clean(outcome?.tenant_id||outcome?.tenantId);
  if(actionTenant&&outcomeTenant&&actionTenant!==outcomeTenant)continue;
  if(!terminal.has(clean(outcome?.verification_status||outcome?.status).toUpperCase()) || !verifiedEvidence(outcome))continue;
  const result=outcome.realized||{};
  const amount=number(result.amount??outcome.realized_amount);
  const unit=clean(result.unit||outcome.realized_unit).toUpperCase();
  const metric=clean(result.metric_id||outcome.realized_metric_id||outcome.metric_id);
  const baseline=clean(result.baseline_id||outcome.realized_baseline_id||outcome.baseline_id);
  const period=clean(result.period_id||outcome.realized_period_id||outcome.measurement_period);
  // A provider ACK, untyped euro amount or missing baseline is NOT customer value.
  if(amount===null||!units.has(unit)||!metric||!baseline||!period)continue;
  // Do not display a measured result against the wrong original baseline.
  if(actionBaseline&&baseline!==actionBaseline)continue;
  return Object.freeze({amount,unit,metric,baseline,period,sourceRefs:Object.freeze(refs(outcome)),
   savings:verifiedSavings(outcome,{amount,unit,metric,baseline,period}),
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
 const realized=resultFor(next,model.outcomes);
 return Object.freeze({available:true,id:clean(next.id),title:clean(next.title||next.label)||'Controleer dit verbeterpunt',
  problem:clean(problem?.title||next.problem_statement)||'Oorzaak nog te bevestigen',
  nextAction:clean(next.next_action||next.recommended_action)||'Beoordeel de onderbouwing en bepaal de eerste veilige stap.',
  metric:metric||null,baseline:baseline||null,expected,expectedKind:expected?expectedKind:null,
  approvalRequired:Boolean(next.requires_approval||next.approval_required||next.decision_required),
  sourceRefs:Object.freeze(refs(next)),result:realized,finance:buildFinancialDecisionDossier(next,realized)});
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

 const finance=briefing.finance,forecast=finance.forecast;
 const labels={no_action:'Niets doen',downside:'Tegenvaller',base:'Verwacht',upside:'Meevaller'};
 const scenarioHtml=forecast.status==='MODELLED_NOT_REALIZED'
  ?'<div data-financial-scenarios="source-backed"><p><b>Scenarioforecast · '+escapeHtml(forecast.period)+'</b> · model '+escapeHtml(forecast.modelVersion)+' · '+escapeHtml(forecast.metric)+'</p>'+
   '<ul>'+forecast.scenarios.map(c=>'<li>'+escapeHtml(labels[c.id])+': '+escapeHtml(formatValue(c.amount,'EUR'))+' (scenario, geen realisatie)</li>').join('')+'</ul>'+
   '<details><summary>Modellen, aannames en financiële fricties</summary><p>Modellen: '+forecast.models.map(m=>escapeHtml(m.name+' v'+m.version)).join(' · ')+'</p>'+
   '<p>Aannames: '+forecast.assumptions.map(a=>escapeHtml(a.name+': '+a.value+(a.unit?' '+a.unit:''))).join(' · ')+'</p>'+
   '<p>Fricties: '+(forecast.frictions.length?forecast.frictions.map(a=>escapeHtml(a.name)+(a.cost===null?' (bedrag niet bewezen)':' ('+escapeHtml(formatValue(a.cost,'EUR'))+')')).join(' · '):'nog niet afzonderlijk onderbouwd')+'</p>'+
   '<p>Bronnen: '+forecast.sourceRefs.map(escapeHtml).join(' · ')+'</p></details></div>'
  :'<p data-financial-scenarios="evidence-due"><b>Scenarioforecast:</b> brongebonden nulmeting, modelversie, aannames en complete scenario’s ontbreken. Geen fictieve prognoses.</p>';
 const realizedHtml=finance.savings
  ?'<p data-financial-savings="verified"><b>Werkelijk netto bespaard:</b> '+escapeHtml(formatValue(finance.savings.net,'EUR'))+
   ' (bruto '+escapeHtml(formatValue(finance.savings.gross,'EUR'))+
   ' − implementatie '+escapeHtml(formatValue(finance.savings.investment,'EUR'))+
   ' − terugkerende kosten '+escapeHtml(formatValue(finance.savings.ongoing,'EUR'))+
   '). Methode: '+escapeHtml(finance.savings.method)+'. '+(finance.savings.causality==='INCREMENTAL_VERIFIED'?'Tegenfeitelijke onderbouwing gekoppeld.':'Causale toerekening niet onafhankelijk bewezen.')+'</p>'
  :'<p data-financial-savings="evidence-due"><b>Werkelijk netto bespaard:</b> nog niet bewezen; onbekend is niet € 0. Afgerond of verzonden is geen besparingsbewijs.</p>';
 const comparison=finance.comparable
  ?'<p><b>Forecast versus werkelijk:</b> '+escapeHtml(formatValue(finance.forecastVsActual,'EUR'))+' verschil bij identieke meetlat, nulmeting en periode; geen automatische causale claim.</p>'
  :'<p><b>Forecast versus werkelijk:</b> niet vergelijkbaar zonder gelijke meetlat, periode, nulmeting, uitvoering en kostenbewijs.</p>';
 const closure='<p data-financial-closure="'+(finance.closingEligible?'review-ready':'evidence-due')+'"><b>Actie afsluiten:</b> '+
  (finance.closingEligible?'bewijs beschikbaar ter beoordeling; sluit uitsluitend via de bestaande ONE BRAIN-actieautoriteit.':
  'nog niet verantwoord; onafhankelijk uitvoeringsbewijs, gemeten netto-effect en leerevidence vereist.')+'</p>';
 const financialHtml='<section aria-label="Financieel beslis- en resultaatdossier">'+scenarioHtml+realizedHtml+comparison+closure+'</section>';

 return '<section class="os-strategy-advisor" data-customer-value="action-evidence" aria-label="Bedrijfsverbetering">'+intro+
 '<article class="os-strategy-card"><h4>'+escapeHtml(briefing.title)+'</h4><p><b>Waarom:</b> '+escapeHtml(briefing.problem)+'</p>'+
 '<p><b>Wat nu:</b> '+escapeHtml(briefing.nextAction)+'</p>'+
 '<p><b>Meetlat:</b> '+escapeHtml(briefing.metric||'nog vast te leggen')+' · <b>Nulmeting:</b> '+escapeHtml(briefing.baseline||'ontbreekt')+'</p>'+
 '<p><b>Verwachte waarde:</b> '+(briefing.expected?escapeHtml(briefing.expected)+' ('+escapeHtml(briefing.expectedKind)+', geen realisatie)':'nog niet betrouwbaar te kwantificeren')+'</p>'+
 proof+financialHtml+'<p>'+(briefing.approvalRequired?'Jouw toestemming of bevoegd besluit is vereist vóór uitvoering.':'Uitvoering uitsluitend via de bestaande goedgekeurde Powerhouse-policy.')+'</p>'+
 '<details><summary>Waarop is dit gebaseerd?</summary><p>'+briefing.sourceRefs.map(escapeHtml).join(' · ')+'</p></details>'+
 '<button type="button" data-os-page="next-best-actions" aria-pressed="false">Beoordeel deze verbeteractie →</button></article></section>';
}
