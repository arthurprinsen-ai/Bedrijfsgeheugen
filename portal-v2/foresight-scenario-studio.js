import { buildGoalForecast, GOAL_METRICS } from '../brain/context/goal-forecast-engine.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const valueOf=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
const paths={
  revenue_growth:{domain:'Commercie',page:'branche-markt',related:['Klanten','Sales','Capaciteit']},
  profit:{domain:'Financiën',page:'cijfers-maatstaven',related:['Inkoop','Productiviteit','Liquiditeit']},
  cash:{domain:'Financiën',page:'waarde-financiering',related:['Debiteuren','Continuïteit','Investeringen']},
  automate:{domain:'Operatie',page:'actieve-acties',related:['Processen','Medewerkers','Kosten']},
  valuation:{domain:'Bedrijfswaarde',page:'waarde-financiering',related:['Overdraagbaarheid','Risico','Groei']},
  exit:{domain:'Kennis & organisatie',page:'due-diligence',related:['Documentatie','Afhankelijkheden','Compliance']},
  resilience:{domain:'Risico & compliance',page:'compliance-governance',related:['Continuïteit','Systemen','Beveiliging']}
};
const arr=x=>Array.isArray(x)?x:[];
function observations(state,goal,metric){
  const target=state?.portal?.business_context?.goal_targets?.[goal]||{};
  const sets=[target.history,state?.portal?.goal_history?.[goal],state?.portal?.metrics?.history?.[metric],state?.portal?.business_context?.goal_history?.[goal]];
  const map=new Map();
  for(const raw of sets.flatMap(arr)){
    const date=Date.parse(raw?.date||raw?.observedAt||raw?.observed_at||'');
    const value=valueOf(raw?.value);
    if(!Number.isFinite(date)||value===null)continue;
    const key=new Date(date).toISOString().slice(0,10);
    if(!map.has(key))map.set(key,{date:key,time:date,value,source:String(raw?.source||'Klantinvoer'),evidenceRef:String(raw?.evidenceRef||raw?.evidence_ref||'')});
  }
  return [...map.values()].sort((a,b)=>a.time-b.time).slice(-120);
}
function trend(points,days,asOf=Date.now()){
  if(points.length<3||points.at(-1).time-points[0].time<14*86400000)return null;
  if(!Number.isFinite(asOf)||points.at(-1).time>asOf+86400000||asOf-points.at(-1).time>90*86400000)return null;
  const first=points[0].time,xx=points.map(p=>(p.time-first)/86400000),yy=points.map(p=>p.value);
  const n=xx.length,mx=xx.reduce((a,b)=>a+b,0)/n,my=yy.reduce((a,b)=>a+b,0)/n;
  const denominator=xx.reduce((s,x)=>s+(x-mx)**2,0);
  if(denominator===0)return null;
  const slope=xx.reduce((s,x,i)=>s+(x-mx)*(yy[i]-my),0)/denominator;
  const intercept=my-slope*mx;
  const targetTime=Math.max(asOf,points.at(-1).time)+days*86400000;
  const targetX=(targetTime-first)/86400000;
  const expected=intercept+slope*targetX;
  const rmse=Math.sqrt(yy.reduce((s,y,i)=>s+(y-(intercept+slope*xx[i]))**2,0)/Math.max(1,n-2));
  const daysFromLast=targetX-xx.at(-1);
  const width=1.96*rmse*(1+Math.min(2,daysFromLast/Math.max(30,xx.at(-1)-xx[0])));
  return {expected,lower:expected-width,upper:expected+width,rmse,slope,method:'linear-trend',historyCount:n,forecastFor:new Date(targetTime).toISOString().slice(0,10),notBacktested:true};
}
export function buildForesightStudioModel(state={},options={}){
  const days=[30,90,180,365].includes(Number(options.days))?Number(options.days):90;
  const asOf=Number.isFinite(Date.parse(options.asOf||''))?Date.parse(options.asOf):Date.now();
  const goalIds=Object.keys(GOAL_METRICS);
  const metrics=goalIds.map(id=>{
    const def=GOAL_METRICS[id],metadata=paths[id];
    const baseline=buildGoalForecast(state,id);
    const history=observations(state,id,def.metric);
    const prediction=trend(history,days,asOf);
    const current=history.length?history.at(-1).value:null; // never synthesize a latest observation from an implicit zero
    const evidenceCount=history.filter(p=>p.evidenceRef).length;
    return {
      id,domain:metadata.domain,page:metadata.page,related:metadata.related,
      label:def.label,unit:def.unit,direction:def.direction,current,target:valueOf(baseline?.target),
      history,forecast:prediction,
      evidenceCount,quality:prediction?(history.length>=6&&evidenceCount>=3?'HISTORICAL_TREND_WITH_REFS':'EXPLORATORY_TREND'):'INSUFFICIENT_HISTORY',
      source:'Klantgebonden historie in bestaande portaalcontext',
      note:prediction?'Statistische extrapolatie vanaf de peildatum; niet onafhankelijk gevalideerd.':'Minimaal 3 meetdagen over 14 dagen en een meting uit de laatste 90 dagen nodig.'
    };
  });
  const active=metrics.find(x=>x.id===options.metric)||metrics.find(x=>x.forecast)||metrics[0];
  const sensitivity=Math.max(-30,Math.min(30,Number.isFinite(Number(options.sensitivity))?Number(options.sensitivity):0));
  const scenario=active.forecast?{
    baseline:active.forecast.expected,
    simulated:active.forecast.expected*(1+sensitivity/100),
    delta:active.forecast.expected*sensitivity/100,
    lower:active.forecast.lower,upper:active.forecast.upper,
    sensitivity,kind:'WHAT_IF_NOT_PREDICTION'
  }:null;
  const count=metrics.filter(x=>x.forecast).length;
  // The authenticated brain-operating-loop projects operational observations per tenant.
  // Never turn these events into a forecast, outcome or global Powerhouse health claim.
  const runtime=state?.portal?.runtime;
  const obs=runtime?.observability;
  const age=Date.now()-Date.parse(obs?.updatedAt||'');
  const hasTenantRuntime=obs?.source==='brain-operating-loop'&&Number.isFinite(age)&&age>=0&&age<86400000;
  const eventCount=hasTenantRuntime?arr(obs?.events).length:0;
  const actionCount=hasTenantRuntime?arr(runtime?.actions?.items).length:0;
  const sourceCount=hasTenantRuntime?arr(runtime?.sources?.items).length:0;
  return {days,metrics,active,scenario,available:count,
    intelligence:{brain:hasTenantRuntime?'Brein: '+eventCount+' recente runtime-observaties, '+actionCount+' geregistreerde acties':'Klantgebonden doelen en tijdreeksen',powerhouse:'Platformbrede Powerhouse-forecasts zijn niet automatisch tenantdata',heartbeat:hasTenantRuntime?'Brongezondheid: '+sourceCount+' onderdelen in geauthenticeerde Brein-projectie; geen garantie voor actuele Heartbeat-SLA':'Tenantgebonden Heartbeat nog niet geverifieerd'},
    truth:'No global Powerhouse/admin data, demo fixtures or synthetic KPIs are used.'};
}
const fmt=(value,unit)=>value===null||!Number.isFinite(Number(value))?'—':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(value)+(unit?' '+unit:'');
function chart(metric,scenario){
  const points=metric.history.slice(-12);
  if(!metric.forecast||!points.length)return '<div class="pfs-empty-chart">Nog geen historische tijdreeks voor een verantwoorde grafiek.</div>';
  const future=[metric.forecast.lower,metric.forecast.expected,metric.forecast.upper,...(scenario?[scenario.simulated]:[])];
  const values=[...points.map(x=>x.value),...future];
  const min=Math.min(...values),max=Math.max(...values),span=Math.max(.000001,max-min);
  const x=i=>46+(i/(points.length))*630;
  const y=v=>187-((v-min)/span)*147;
  const last=points.at(-1),end=points.length;
  const coords=points.map((p,i)=>x(i)+','+y(p.value)).join(' ');
  const segment=(val)=>x(points.length-1)+','+y(last.value)+' '+x(end)+','+y(val);
  const area=x(points.length-1)+','+y(last.value)+' '+x(end)+','+y(metric.forecast.upper)+' '+x(end)+','+y(metric.forecast.lower);
  return '<svg viewBox="0 0 720 210" role="img" aria-label="Historische metingen, lineaire trend en gekozen scenario">'+
    '<line x1="46" y1="187" x2="676" y2="187" stroke="#c7d1e3"/>'+
    '<polygon points="'+area+'" fill="#cde0ff" opacity=".8"/>'+
    '<polyline points="'+coords+'" fill="none" stroke="#215ddd" stroke-width="3"/>'+
    '<polyline points="'+segment(metric.forecast.expected)+'" fill="none" stroke="#15876c" stroke-dasharray="6 4" stroke-width="3"/>'+
    (scenario&&scenario.sensitivity!==0?'<polyline points="'+segment(scenario.simulated)+'" fill="none" stroke="#ae4bd5" stroke-dasharray="4 4" stroke-width="3"/>':'')+
    '<text x="46" y="204" font-size="12" fill="#67748d">'+esc(points[0].date)+'</text>'+
    '<text x="676" y="204" text-anchor="end" font-size="12" fill="#67748d">'+esc(metric.forecast.forecastFor)+'</text>'+
    '<text x="46" y="20" font-size="11" fill="#67748d">'+esc(fmt(max,metric.unit))+'</text>'+
    '<text x="46" y="180" font-size="11" fill="#67748d">'+esc(fmt(min,metric.unit))+'</text></svg>';
}
function markup(model){
  const m=model.active,s=model.scenario;
  const choose=model.metrics.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===m.id?' selected':'')+'>'+esc(x.domain+' · '+x.label)+(x.forecast?'':' · bron ontbreekt')+'</option>').join('');
  const forecast=s?'<div class="pfs-stat-grid"><div><small>Laatste meting</small><strong>'+esc(fmt(m.current,m.unit))+'</strong></div><div><small>Trend op horizon</small><strong>'+esc(fmt(s.baseline,m.unit))+'</strong></div><div><small>Wat-als-variant</small><strong>'+esc(fmt(s.simulated,m.unit))+'</strong></div><div><small>Statistische band</small><strong>'+esc(fmt(s.lower,m.unit))+' – '+esc(fmt(s.upper,m.unit))+'</strong></div></div>':'<div class="pfs-gap">Voor '+esc(m.label)+' is nog geen onderbouwde tijdreeks beschikbaar. Scenarioresultaten blijven uit totdat minimaal drie chronologische metingen beschikbaar zijn.</div>';
  const variants=[['-10','Tegenvaller'],['0','Basispad'],['10','Meewind']].map(([pct,title])=>'<button type="button" data-pfs-preset="'+pct+'"'+(model.scenario?.sensitivity===Number(pct)?' aria-pressed="true"':' aria-pressed="false"')+'>'+title+'</button>').join('');
  return '<section class="pfs-studio" data-pfs-studio="true" aria-label="Powerhouse interactieve scenariostudio">'+
    '<div class="pfs-head"><div><span class="pfs-eyebrow">POWERHOUSE · BREIN · FORESIGHT</span><h3>Wat gebeurt er als je niets verandert — of juist ingrijpt?</h3>'+
    '<p>Verken financiële én niet-financiële doelen. De grafiek gebruikt uitsluitend beschikbare klantmetingen; de gevoeligheidsaanpassing is een simulatie.</p></div><span class="pfs-count">'+model.available+' / '+model.metrics.length+' trends beschikbaar</span></div>'+
    '<div class="pfs-controls"><label>Bedrijfsonderdeel<select data-pfs-metric>'+choose+'</select></label>'+
    '<label>Vooruitkijken<select data-pfs-days>'+[30,90,180,365].map(d=>'<option value="'+d+'"'+(model.days===d?' selected':'')+'>'+d+' dagen</option>').join('')+'</select></label></div>'+
    '<div class="pfs-scenarios" aria-label="Scenariokeuzes">'+variants+'</div>'+
    '<label class="pfs-slider">Veronderstelde afwijking ten opzichte van de trend: <b>'+esc((s?.sensitivity||0)+'%')+'</b><input type="range" min="-30" max="30" step="5" value="'+(s?.sensitivity||0)+'" data-pfs-sensitivity></label>'+
    '<div class="pfs-chart">'+chart(m,s)+'</div><p class="pfs-legend">━ Historische metingen &nbsp; ┄ Statistische trend &nbsp; ▨ Indicatieve bandbreedte &nbsp; ┄ Paars: wat-als-scenario</p>'+
    forecast+'<div class="pfs-bottom"><div><h4>Doorwerking in je bedrijf</h4><p>Relevante afhankelijkheden: '+m.related.map(esc).join(' · ')+'. Niet automatisch als geldelijk effect of causaal resultaat berekend.</p>'+
    '<button type="button" data-pfs-page="'+esc(m.page)+'">Bekijk bron en bijbehorende acties →</button></div>'+
    '<div><h4>Betrouwbaarheid en herkomst</h4><p>'+m.history.length+' historische meetpunten; '+m.evidenceCount+' bronverwijzingen. Status: '+esc(m.quality)+'.</p><p>'+esc(m.note)+'</p></div></div>'+
    '<details class="pfs-sources"><summary>Brein, Powerhouse en Heartbeat: aansluitstatus</summary><p>'+esc(model.intelligence.brain)+' · '+esc(model.intelligence.powerhouse)+' · '+esc(model.intelligence.heartbeat)+'.</p><p>Een platformbrede voorspelling is geen automatisch gevalideerde klantprognose. Eerst authenticatie, tenant-scope, versheid en modelkwaliteit controleren.</p></details>'+
    '</section>';
}
export function mountForesightScenarioStudio(host,{state={},pageId='overzicht',openPage}={}){
  if(!host?.appendChild)return null;
  host.querySelector?.('[data-pfs-studio]')?.remove();
  const selected={metric:'',days:90,sensitivity:0,asOf:new Date().toISOString().slice(0,10)+'T00:00:00Z'};
  const section=(host.ownerDocument||document).createElement('div');
  const draw=()=>{
    const model=buildForesightStudioModel(state,selected);
    section.innerHTML=markup(model);
    section.querySelector('[data-pfs-metric]')?.addEventListener('change',event=>{selected.metric=event.target.value;selected.sensitivity=0;draw();});
    section.querySelector('[data-pfs-days]')?.addEventListener('change',event=>{selected.days=Number(event.target.value);draw();});
    section.querySelector('[data-pfs-sensitivity]')?.addEventListener('input',event=>{selected.sensitivity=Number(event.target.value);draw();});
    section.querySelectorAll('[data-pfs-preset]').forEach(button=>button.addEventListener('click',()=>{selected.sensitivity=Number(button.dataset.pfsPreset);draw();}));
    section.querySelector('[data-pfs-page]')?.addEventListener('click',event=>openPage?.(event.currentTarget.dataset.pfsPage));
  };
  draw();host.appendChild(section);
  return section;
}
