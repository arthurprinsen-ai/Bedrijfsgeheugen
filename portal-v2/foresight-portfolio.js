// Tenant-only cross-domain scenario comparison and operational evidence context.
// This module never treats a common percentage assumption as a causal model.
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const list=x=>Array.isArray(x)?x:[];
const format=(n,u)=>n===null?'—':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(n)+(u?' '+String(u):'');
function horizonDirection(goal){
  return goal.direction==='down'?-1:1;
}
export function buildForesightPortfolio(model={},runtime=null,{now=Date.now()}={}){
  const inputs=list(model?.metrics);
  // Compare *independent* sensitivities. Do not imply correlations or sum
  // heterogeneous units, scores, working hours, cash and percentages.
  const sensitivity=Math.max(5,Math.min(30,Math.abs(Number(model?.scenario?.sensitivity)||10)));
  const rows=inputs.map(goal=>{
    const base=finite(goal?.forecast?.expected);
    const target=finite(goal?.target);
    const current=finite(goal?.current);
    const forecasted=base!==null&&goal?.forecast&&typeof goal?.id==='string';
    const effect=forecasted?Math.abs(base)*sensitivity/100*horizonDirection(goal):null;
    const favorable=forecasted?base+effect:null;
    const unfavorable=forecasted?base-effect:null;
    const goalReached=forecasted&&target!==null?
      (goal.direction==='down'?base<=target:base>=target):null;
    const observed=list(goal?.history).filter(p=>Number.isFinite(Number(p?.time))&&finite(p?.value)!==null);
    const last=observed.at(-1);
    return {
      id:String(goal?.id||'').slice(0,100),label:String(goal?.label||'Doel'),domain:String(goal?.domain||'Bedrijf'),
      unit:String(goal?.unit||''),page:String(goal?.page||'bedrijfssituatie'),
      current,base,optimistic:favorable,pessimistic:unfavorable,target,
      goalReached,hasTrend:Boolean(forecasted),historyCount:observed.length,
      lastObserved:last?.date||null,sourceRefs:Number(goal?.evidenceCount)||0,
      quality:String(goal?.quality||'INSUFFICIENT_HISTORY'),
      horizonDate:goal?.forecast?.forecastFor||null,
      missing:forecasted?[]:[
        ...(observed.length<3?['minstens 3 verschillende metingen']:[]),
        ...(!last?['laatste peildatum']:[]),
        ...(last&&Number.isFinite(now)&&now-Number(last.time)>90*86400000?['recente meting']:[])
      ]
    };
  });
  const forecasts=rows.filter(r=>r.hasTrend);
  const nowTime=Number(now),updated=Date.parse(runtime?.observability?.updatedAt||'');
  const elapsed=nowTime-updated;
  // Only show observed runtime if it was inserted by authenticated Brain API
  // and is recent. It is *not* the independent Heartbeat SLA time series.
  const runtimeVerified=runtime?.observability?.source==='brain-operating-loop'&&
    Number.isFinite(elapsed)&&elapsed>=0&&elapsed<=24*3600*1000;
  const sources=runtimeVerified?list(runtime?.sources?.items):[];
  const actions=runtimeVerified?list(runtime?.actions?.items):[];
  const events=runtimeVerified?list(runtime?.observability?.events):[];
  const explicitAttention=sources.filter(s=>s?.status==='aandacht').length;
  return {
    sensitivity,rows,available:forecasts.length,missing:rows.length-forecasts.length,
    prioritized:forecasts.filter(x=>x.goalReached===false).map(x=>x.id),
    runtime:{
      state:runtimeVerified?'OBSERVED_RECENT':'NOT_EVIDENCED',
      updatedAt:runtimeVerified?runtime.observability.updatedAt:null,
      sources:sources.length,actions:actions.length,events:events.length,explicitAttention,
      label:runtimeVerified?'Brein-observaties (geen voorspelling)':'Heartbeat en Brein-observaties niet aantoonbaar actueel'
    },
    caveat:'De drie scenario-kolommen zijn rekenkundige gevoeligheden per doel, geen doorgerekende onderlinge beïnvloeding, winstbelofte of modelvalidatie.'
  };
}
export function renderForesightPortfolio(portfolio,{open=false}={}){
  if(!portfolio)return '';
  const percent=portfolio.sensitivity;
  const rowMarkup=portfolio.rows.map(row=>{
    const issue=row.hasTrend&&row.goalReached===false?
      'Trend haalt doel niet':row.hasTrend&&row.goalReached===true?'Doel volgens trend haalbaar':'Onvoldoende historie';
    const labels=row.hasTrend?
      ['<td>'+escapeHtml(format(row.pessimistic,row.unit))+'</td>',
      '<td>'+escapeHtml(format(row.base,row.unit))+'</td>',
      '<td>'+escapeHtml(format(row.optimistic,row.unit))+'</td>'].join(''):
      '<td colspan="3">Geen getalsmatige verwachting</td>';
    return '<tr class="'+(row.hasTrend?'pfs-portfolio-available':'pfs-portfolio-missing')+'">'+
      '<th scope="row"><button type="button" data-pfs-compare-metric="'+escapeHtml(row.id)+'">'+escapeHtml(row.label)+' ↗</button><small>'+escapeHtml(row.domain)+'</small></th>'+
      labels+'<td><span>'+escapeHtml(issue)+'</span><small>'+row.historyCount+' metingen · '+row.sourceRefs+' bronref. · '+escapeHtml(row.lastObserved||'geen datum')+'</small></td></tr>';
  }).join('');
  const missing=portfolio.rows.filter(x=>!x.hasTrend);
  return '<details class="pfs-portfolio"'+(open?' open':'')+' data-pfs-portfolio>'+
    '<summary>Vergelijk alle bedrijfsgebieden · '+portfolio.available+'/'+portfolio.rows.length+' met trend <span>Toon scenariovergelijking</span></summary>'+
    '<p>Dezelfde gevoeligheid (±'+percent+'%) wordt per bedrijfsgebied afzonderlijk toegepast. Bij risico en handmatig werk betekent minder juist een gunstig scenario. Er is geen oorzakelijke koppeling tussen de regels.</p>'+
    '<div class="pfs-portfolio-scroll"><table><thead><tr><th>Bedrijfsdoel</th><th>Tegenvaller</th><th>Basistrend</th><th>Meewind</th><th>Herkomst en doel</th></tr></thead><tbody>'+rowMarkup+'</tbody></table></div>'+
    (missing.length?'<div class="pfs-portfolio-needs"><h4>Ontbrekende historische informatie</h4><p>'+missing.map(x=>escapeHtml(x.label)+': '+escapeHtml(x.missing.join(', ')||'historie niet geldig')).join(' · ')+'</p>'+
       '<button type="button" data-pfs-open-page="bedrijfssituatie">Vul bedrijfsdoelen en meetreeksen aan →</button></div>':'')+
    '<div class="pfs-portfolio-operational"><div><h4>Brein & operationele pols</h4><p>'+escapeHtml(portfolio.runtime.label)+'</p>'+
    (portfolio.runtime.state==='OBSERVED_RECENT'?
      '<p>Laatste waarneming '+escapeHtml(portfolio.runtime.updatedAt)+' · '+portfolio.runtime.events+' gebeurtenissen · '+portfolio.runtime.actions+' actieregistraties · '+portfolio.runtime.sources+' broncomponenten ('+portfolio.runtime.explicitAttention+' expliciet aandacht).</p>':
      '<p>Geen tenantgebonden operationele waarneming die aan de versheidsgrens voldoet. Er wordt geen Heartbeat-SLA of numerieke voorspelling afgeleid.</p>')+
    '<button type="button" data-pfs-open-page="powerhouse-control-center">Open Powerhouse Control Center →</button></div></div>'+
    '<small>'+escapeHtml(portfolio.caveat)+'</small>'+
    '</details>';
}
