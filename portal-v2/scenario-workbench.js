// POWERHOUSE Foresight Workbench: only tenant-scoped portal state, never global Brain/Heartbeat tables.
// Simulated changes are mathematical assumptions, not independent model forecasts or causal effects.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const arr = x => Array.isArray(x) ? x : [];
const finite = x => x === null || x === undefined || x === '' ? null : Number.isFinite(Number(x)) ? Number(x) : null;
const fmt = (x, unit='') => {
  if (x === null || !Number.isFinite(x)) return '—';
  if (unit === '€') return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x);
  return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(x) + (unit ? ' ' + unit : '');
};
export const WORKBENCH_DOMAINS = Object.freeze([
  {id:'finance',name:'Financieel',goals:['revenue_growth','profit','cash','valuation'],related:['commercial','operations']},
  {id:'commercial',name:'Klanten & commercie',goals:[],related:['finance','market']},
  {id:'operations',name:'Processen & capaciteit',goals:['automate'],related:['people','technology']},
  {id:'people',name:'Mensen & kennis',goals:[],related:['operations','resilience']},
  {id:'technology',name:'Data, systemen & AI',goals:[],related:['operations','resilience']},
  {id:'resilience',name:'Risico & continuïteit',goals:['resilience','exit'],related:['people','finance']},
  {id:'market',name:'Markt & regelgeving',goals:[],related:['commercial','resilience']},
  {id:'impact',name:'Strategie & impact',goals:[],related:['finance','operations']}
]);
const sources = [
 {id:'brain',label:'Powerhouse Brein',paths:['portal.brain.signals','portal.brain.decisions','portal.brain.outcomes','portal.intelligence.signals']},
 {id:'heartbeat',label:'Heartbeat',paths:['portal.heartbeat.observations','portal.heartbeat.metrics','portal.runtime.heartbeat','portal.brain.heartbeat']},
 {id:'signals',label:'Interne/externe signalen',paths:['portal.signals','portal.external_signals','signals']},
 {id:'execution',label:'Acties & resultaten',paths:['portal.actions','portal.outcomes','portal.roadmap.items','actions']},
 {id:'knowledge',label:'Kennis & processen',paths:['portal.knowledge.items','portal.processes.items','memories']},
 {id:'customer',label:'Klant & commercie',paths:['portal.customer.metrics','portal.sales.metrics','portal.crm.metrics']},
 {id:'models',label:'Doelen & modelhistorie',paths:['portal.business_context.goal_targets','portal.goal_history']}
];
function at(obj,path){return path.split('.').reduce((o,k)=>o && typeof o==='object' ? o[k] : undefined,obj);}
function hasEvidence(value){
  if (Array.isArray(value)) return value.length>0;
  if (!value || typeof value!=='object') return false;
  return Object.keys(value).length>0;
}
const controls = new WeakMap();
function stateFor(host){if(!controls.has(host))controls.set(host,{domain:'all',goal:'auto',scenario:'baseline',intensity:100});return controls.get(host);}
function historyFor(state,forecast) {
  const goalId=forecast.goalId, target=state?.portal?.business_context?.goal_targets?.[goalId]||{};
  const raw=[target.history,state?.portal?.goal_history?.[goalId],state?.portal?.metrics?.history?.[forecast.metric],state?.portal?.business_context?.goal_history?.[goalId]].flatMap(arr);
  const points=raw.map(x=>({date:String(x?.date||x?.observedAt||x?.observed_at||''),value:finite(x?.value)}))
    .filter(x=>x.value!==null&&Number.isFinite(Date.parse(x.date)))
    .sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  return points.filter((x,i)=>i===0||x.date!==points[i-1].date).slice(-36);
}
export function buildScenarioWorkbenchModel(state={},context={}){
  const forecasts=arr(context?.goalForecasts).filter(f=>f&&typeof f==='object');
  const scenarios=arr(context?.goalScenarios).filter(s=>s&&typeof s==='object');
  const goals=forecasts.map(f=>{
    const scenario=scenarios.find(s=>s.goalId===f.goalId)||{};
    const levers=arr(scenario.levers).filter(l=>l&&typeof l==='object').map(l=>({
      id:String(l.id||''),label:String(l.label||'Invloed'),effect:finite(l.effect),
      evidenceMode:String(l.evidenceMode||'scenario-assumption'),sourceRefs:arr(l.sourceRefs).slice(0,5),
      action:String(l.action||''),page:String(l.page||''),alignment:String(l.alignment||'')
    }));
    return {id:String(f.goalId),label:String(f.label||f.goalId),unit:String(f.unit||''),metric:String(f.metric||''),
      target:finite(f.target),current:finite(f.current),targetDate:f.targetDate||null,history:historyFor(state,f),
      expected:f.forecastStatus==='available'?finite(f.forecast?.expected):null,
      low:f.forecastStatus==='available'?finite(f.forecast?.lower):null,
      high:f.forecastStatus==='available'?finite(f.forecast?.upper):null,
      method:String(f.forecast?.method||''),forecastStatus:String(f.forecastStatus||'insufficient-evidence'),
      evidence:f.evidence||{},levers};
  });
  const coverage=sources.map(s=>({id:s.id,label:s.label,paths:s.paths.filter(p=>hasEvidence(at(state,p)))}));
  const domains=WORKBENCH_DOMAINS.map(d=>({...d,goalCount:goals.filter(g=>d.goals.includes(g.id)).length,readyCount:goals.filter(g=>d.goals.includes(g.id)&&g.expected!==null).length}));
  return {goals,domains,coverage,availableSources:coverage.filter(x=>x.paths.length).length};
}
function scenarioFactor(mode, intensity){return mode==='baseline'?0:mode==='cautious'?0.5:mode==='ambitious'?1.25:Math.max(0,Math.min(1.5,Number(intensity)||0))/1;}
export function calculateScenario(goal,mode='baseline',intensity=1){
  if(!goal)return {baseline:null,scenario:null,delta:null,sourceCount:0,factor:0};
  const factor=scenarioFactor(mode,intensity);
  const quantified=arr(goal.levers).filter(l=>l.effect!==null);
  const delta=quantified.length?quantified.reduce((s,l)=>s+l.effect,0)*factor:null;
  const baseline=goal.expected;
  return {baseline,scenario:baseline!==null&&delta!==null?baseline+delta:mode==='baseline'?baseline:null,delta,
    sourceCount:quantified.length,evidenceLinked:quantified.filter(l=>l.evidenceMode==='evidence-linked').length,factor};
}
function chart(goal,result){
  if(goal.expected===null)return '<div class="sw-empty">Geen trendgrafiek: voor dit doel ontbreken minimaal drie gedateerde metingen of een geldige doeldatum.</div>';
  const history=goal.history.slice(-18);
  const end=goal.expected, candidate=result.scenario;
  const values=[...history.map(p=>p.value),end,goal.low,goal.high,candidate,goal.target].filter(x=>x!==null&&Number.isFinite(x));
  const min=Math.min(...values),max=Math.max(...values),span=Math.max(1e-9,max-min);
  const sy=x=>156-((x-min)/span)*126;
  const px=i=>34+i*632/Math.max(1,history.length);
  const past=history.length?'<polyline fill="none" stroke="#365ecb" stroke-width="3" points="'+history.map((p,i)=>px(i)+','+sy(p.value)).join(' ')+'"/>':'';
  const origin=history.length?history.at(-1).value:end;
  const band=goal.low!==null&&goal.high!==null?
    '<line x1="666" y1="'+sy(goal.low)+'" x2="666" y2="'+sy(goal.high)+'" stroke="#9fbee9" stroke-width="13" stroke-linecap="round"/>':'';
  const baseline='<line x1="'+px(history.length-1)+'" y1="'+sy(origin)+'" x2="666" y2="'+sy(end)+'" stroke="#188b6b" stroke-width="3" stroke-dasharray="6 4"/><circle cx="666" cy="'+sy(end)+'" r="4" fill="#188b6b"/>';
  const simulation=candidate!==null&&result.factor!==0?'<line x1="'+px(history.length-1)+'" y1="'+sy(origin)+'" x2="666" y2="'+sy(candidate)+'" stroke="#9652b2" stroke-width="3" stroke-dasharray="4 4"/><circle cx="666" cy="'+sy(candidate)+'" r="5" fill="#9652b2"/>':'';
  return '<svg viewBox="0 0 710 185" role="img" aria-label="Gemeten historie, trendindicatie en geselecteerd wat-als-scenario">'+
   '<line x1="34" y1="156" x2="676" y2="156" stroke="#cbd5e1"/>'+
   past+band+baseline+simulation+
   '<text x="34" y="177" fill="#64748b" font-size="11">'+esc(history[0]?.date?.slice(0,10)||'Historie')+'</text>'+
   '<text x="676" y="177" fill="#64748b" font-size="11" text-anchor="end">'+esc(goal.targetDate?.slice(0,10)||'Doeldatum')+'</text></svg>';
}
function options(items,selected,getId,getLabel){return items.map(item=>{
 const id=getId(item);return '<option value="'+esc(id)+'"'+(selected===id?' selected':'')+'>'+esc(getLabel(item))+'</option>';
}).join('');}
function sourceCoverage(model){
 return '<details class="sw-sources"><summary>Brondekking · '+model.availableSources+' van '+model.coverage.length+' brongroepen met klantcontext</summary><div class="sw-source-grid">'+model.coverage.map(s=>
  '<div><b>'+esc(s.label)+'</b><small>'+ (s.paths.length?'Aangetroffen: '+esc(s.paths.join(', ')):'Nog geen klantgebonden gegevens aangetroffen')+'</small></div>').join('')+
 '</div><p>Alleen gegevens uit de geauthenticeerde klantcontext. Globale Brein-/Heartbeat-platformtelemetrie is geen bewijs van klantprestaties.</p></details>';
}
function render(host,model,opts){
 const domain=model.domains.find(d=>d.id===opts.domain);
 const visibleGoals=domain?model.goals.filter(g=>domain.goals.includes(g.id)):model.goals;
 const selected=visibleGoals.find(g=>g.id===opts.goal)||visibleGoals[0]||null;
 const result=calculateScenario(selected,opts.scenario,opts.intensity/100);
 const factorPercent=Math.round(result.factor*100);
 const controlRows='<div class="sw-controls"><label>Domein<select data-sw-domain>'+options([{id:'all',name:'Alle domeinen'},...model.domains],opts.domain,x=>x.id,x=>x.name)+'</select></label>'+
  '<label>Doel of KPI<select data-sw-goal>'+options(visibleGoals,selected?.id,x=>x.id,x=>x.label)+'</select></label>'+
  '<label>Scenario<select data-sw-scenario>'+options([{id:'baseline',name:'Geen ingreep'},{id:'cautious',name:'Voorzichtig (50% aannames)'},{id:'ambitious',name:'Ambitieus (125% aannames)'},{id:'custom',name:'Zelf instellen'}],opts.scenario,x=>x.id,x=>x.name)+'</select></label>'+
  (opts.scenario==='custom'?'<label>Intensiteit <input type="range" min="0" max="150" step="10" value="'+opts.intensity+'" data-sw-intensity><strong>'+opts.intensity+'%</strong></label>':'')+
  '</div>';
 const domainRows='<div class="sw-domain-grid">'+model.domains.map(d=>
  '<button type="button" data-sw-domain-button="'+esc(d.id)+'" class="'+(opts.domain===d.id?'selected':'')+'"><b>'+esc(d.name)+'</b><small>'+d.readyCount+' trendindicaties · '+d.goalCount+' doelen</small></button>').join('')+'</div>';
 let details;
 if(!selected)details='<div class="sw-empty"><b>Geen onderbouwde forecast in dit domein.</b><p>Verbind gedateerde KPI-metingen en doelen in deze klantcontext. Brein-signalen, Heartbeat en externe bronnen kunnen worden meegenomen zodra ze tenantgebonden en controleerbaar zijn; ze zijn geen automatische getalsvoorspelling.</p></div>';
 else {
  const endStatus=selected.expected===null?'ONVOLDOENDE HISTORIE':'TRENDINDICATIE — NIET ONAFHANKELIJK GEVALIDEERD';
  const levers=selected.levers.filter(l=>l.effect!==null);
  details='<div class="sw-selected"><div><span class="sw-kicker">'+esc(endStatus)+'</span><h4>'+esc(selected.label)+'</h4></div><small>Doeldatum: '+esc(selected.targetDate?.slice(0,10)||'onbekend')+' · '+selected.history.length+' beschikbare metingen</small></div>'+
  chart(selected,result)+
  '<div class="sw-legend"><span>━ Gemeten historie</span><span>┄ Trendextrapolatie</span><span>┄ Paars: scenarioaanname</span><span>▮ Indicatieve band</span></div>'+
  '<div class="sw-metrics"><article><small>Huidige waarde</small><b>'+fmt(selected.current,selected.unit)+'</b></article><article><small>Trend op doeldatum</small><b>'+fmt(result.baseline,selected.unit)+'</b></article><article><small>Wat-als bij '+factorPercent+'%</small><b>'+fmt(result.scenario,selected.unit)+'</b></article><article><small>Doel</small><b>'+fmt(selected.target,selected.unit)+'</b></article></div>'+
  '<div class="sw-detail-grid"><div><h5>Invloed op dit doel</h5>'+
  (levers.length?'<div class="sw-levers">'+levers.map(l=>'<div><span>'+esc(l.label)+'</span><b>'+fmt(l.effect*result.factor,selected.unit)+'</b><small>'+(l.evidenceMode==='evidence-linked'?'Bronverwijzing aanwezig':'Aanname, niet gevalideerd')+'</small></div>').join('')+'</div>':
  '<p>Nog geen gekwantificeerde hefbomen vastgelegd. Een scenario kan daarom niet verantwoord doorberekend worden.</p>')+'</div>'+
  '<div><h5>Vervolgstappen & samenhang</h5><p>Verbind uitkomsten aan acties, eigenaars en meetmomenten. Een scenario wordt pas een bedrijfsvoorspelling na onafhankelijke validatie en terugmeting.</p>'+
  '<div class="sw-links"><button type="button" data-sw-page="bedrijfssituatie">Doelen & context →</button><button type="button" data-sw-page="roadmap">Acties & roadmap →</button><button type="button" data-sw-page="outcomes-evidence">Uitkomsten & bewijs →</button><button type="button" data-sw-page="brain-verwerking">Powerhouse Brein →</button></div></div></div>';
 }
 host.innerHTML='<section class="sw-workbench" aria-label="Powerhouse scenario-werkbank"><header class="sw-header"><div><span class="sw-kicker">POWERHOUSE · BREIN + HEARTBEAT + FORECASTING</span><h3>Wat gebeurt er als we anders kiezen?</h3><p>Verken je bedrijf per domein, vergelijk scenario’s en herleid elke conclusie naar historische metingen, aannames en acties.</p></div><span class="sw-label">Predict → Decide → Act → Learn</span></header>'+
  domainRows+controlRows+details+sourceCoverage(model)+
  '<p class="sw-caveat">Een rekenkundig wat-als-scenario is geen bewezen causale verandering. Onbevestigde klantdata en globale platformsignalen leveren nooit automatisch een bedrijfsforecast op.</p></section>';
}
export function mountScenarioWorkbench(host,{state={},context={},openPage}={}){
 if(!host)return null;
 const model=buildScenarioWorkbenchModel(state,context),opts=stateFor(host);
 function redraw(){render(host,model,opts);}
 host.onchange=event=>{
  const t=event.target;
  if(t.matches('[data-sw-domain]')){opts.domain=t.value;opts.goal='auto';redraw();}
  if(t.matches('[data-sw-goal]')){opts.goal=t.value;redraw();}
  if(t.matches('[data-sw-scenario]')){opts.scenario=t.value;redraw();}
 };
 host.oninput=event=>{if(event.target.matches('[data-sw-intensity]')){opts.intensity=Number(event.target.value);redraw();}};
 host.onclick=event=>{
  const domain=event.target.closest('[data-sw-domain-button]');
  if(domain){opts.domain=domain.dataset.swDomainButton;opts.goal='auto';redraw();}
  const page=event.target.closest('[data-sw-page]');if(page)openPage?.(page.dataset.swPage);
 };
 redraw();return model;
}
