const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(v);
const emit=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail,bubbles:true}));
const parseMetric=node=>{
  const raw=node?.querySelector?.('.num,strong')?.textContent||'';
  const match=raw.replace(',','.').match(/-?\d+(?:\.\d+)?/);
  const deltaRaw=node?.querySelector?.('.delta,em')?.textContent||'';
  const dm=deltaRaw.replace(',','.').match(/[-+]?\s*\d+(?:\.\d+)?/);
  return {value:match?Number(match[0]):null,delta:dm?Number(dm[0].replace(/\s/g,'')):null,label:(node?.querySelector?.('.kpihead,strong')?.textContent||'Inzicht').trim()};
};
// Visible KPI text is never a source of forecast confidence or a month-by-month trend.
// Only independently verified, tenant-bound canonical forecasts may be displayed.
function verifiedForecast(metric){
  const f=metric?.canonicalForecast;
  if(!f || f.status!=='VERIFIED' || f.origin!=='authenticated_portal_forecast')return null;
  if(!metric?.tenantId || !metric?.metricKey || !f.tenantId || !f.metricKey ||
     f.tenantId!==metric.tenantId || f.metricKey!==metric.metricKey)return null;
  if(!f.modelVersion || !Array.isArray(f.sourceRefs) || !f.sourceRefs.length ||
     f.sourceRefs.some(x=>typeof x!=='string'||!x.trim()))return null;
  if(f.backtest?.status!=='PASS' || f.independentReview?.approved!==true ||
     !['expected','lower','upper','currentValue'].every(k=>typeof f[k]==='number' && Number.isFinite(f[k])))return null;
  if(f.lower>f.expected || f.expected>f.upper)return null;
  const verifiedAt=Date.parse(f.verifiedAt||''),sourceAt=Date.parse(f.sourceUpdatedAt||'');
  if(![verifiedAt,sourceAt].every(t=>Number.isFinite(t)&&t<=Date.now()&&Date.now()-t<=30*86400000))return null;
  return f;
}
function confidence(metric){
  const f=verifiedForecast(metric);
  if(!f || typeof f.calibratedConfidence!=='number' || !Number.isFinite(f.calibratedConfidence))return null;
  return f.calibratedConfidence>=0&&f.calibratedConfidence<=100?f.calibratedConfidence:null;
}
function project(metric,horizon,scenario){
  const f=verifiedForecast(metric);
  if(!f || scenario!=='base' || Number(f.horizonMonths)!==Number(horizon) ||
     confidence(metric)===null)return null;
  return {current:f.currentValue,projected:f.expected,change:f.expected-f.currentValue,
    lower:f.lower,upper:f.upper,sourceRefs:f.sourceRefs};
}
function forecastSvg(metric,horizon,scenario){
  const p=project(metric,horizon,scenario);
  if(!p)return '<div class="ng-empty">Geen geverifieerde prognose voor deze schermindicator. Raadpleeg de brongebonden Powerhouse-scenariostudio; zichtbare KPI-tekst is geen voorspelling.</div>';
  const values=[p.current,p.projected,p.lower,p.upper],min=Math.min(...values),max=Math.max(...values);
  const range=Math.max(0.001,max-min),y=v=>150-(v-min)/range*110;
  return `<svg viewBox="0 0 520 180" role="img" aria-label="Geverifieerde prognose voor ${esc(metric.label)}">
    <line x1="32" y1="${y(p.current)}" x2="488" y2="${y(p.projected)}" class="ng-line"/>
    <line x1="488" y1="${y(p.lower)}" x2="488" y2="${y(p.upper)}" class="ng-band"/>
    <circle cx="32" cy="${y(metric.value)}" r="4" class="ng-dot"/><circle cx="488" cy="${y(p.projected)}" r="5" class="ng-dot ng-dot-end"/>
    <text x="32" y="173" class="ng-axis">Nu</text><text x="488" y="173" text-anchor="end" class="ng-axis">${horizon} mnd</text></svg>`;
}
function buildLens(){
  const section=document.createElement('section');
  section.className='card ng-lens';
  section.setAttribute('aria-label','Toekomstlens');
  section.innerHTML=`<div class="ng-lens-head"><div><span class="ng-eyebrow">POWERHOUSE FUTURE LENS</span><h2>Wat gebeurt er als je niets verandert — en wat als je nu handelt?</h2><p>Brongebonden prognoses zijn alleen zichtbaar na onafhankelijke verificatie en backtesting. Gebruik de scenariostudio voor niet-gevalideerde aannames.</p></div><span class="ng-trust">verklaarbaar · contextbewust · actiegericht</span></div>
  <div class="ng-controls">
    <label>Signaal<select id="ngMetric"></select></label>
    <label>Horizon<select id="ngHorizon"><option value="3">3 maanden</option><option value="6" selected>6 maanden</option><option value="12">12 maanden</option></select></label>
    <div class="ng-segments" role="group" aria-label="Scenario"><button type="button" data-scenario="stress">Tegenvallend</button><button type="button" data-scenario="base" class="active">Basispad</button><button type="button" data-scenario="opportunity">Versnellen</button></div>
  </div>
  <div class="ng-stage"><div class="ng-chart" id="ngChart"></div><aside class="ng-story" id="ngStory" aria-live="polite"></aside></div>`;
  const anchor=document.querySelector('.kpis')||document.querySelector('.dashboard');
  anchor?.after(section);
  return section;
}
function initLens(){
  const cards=[...document.querySelectorAll('.kpi')].map((node,index)=>({node,index,metric:parseMetric(node)})).filter(x=>Number.isFinite(x.metric.value));
  if(!cards.length)return;
  const host=buildLens(),select=host.querySelector('#ngMetric'),chart=host.querySelector('#ngChart'),story=host.querySelector('#ngStory'),horizon=host.querySelector('#ngHorizon');
  cards.forEach(({metric,index})=>select.insertAdjacentHTML('beforeend',`<option value="${index}">${esc(metric.label)}</option>`));
  let scenario='base';
  let currentLensDetail=null;
  const render=()=>{
    const metric=cards[Number(select.value)||0]?.metric||cards[0].metric,h=Number(horizon.value)||6,p=project(metric,h,scenario),conf=confidence(metric);
    chart.innerHTML=forecastSvg(metric,h,scenario);
    const direction=!p?'onbekend':p.change>1?'stijgend':p.change<-1?'dalend':'stabiel';
    story.innerHTML=`<div class="ng-readout"><span>Gevalideerde verwachting over ${h} maanden</span><strong>${p?pct(p.projected):'—'}</strong><em class="${p&&p.change<0?'down':''}">${p?(p.change>=0?'+':'')+pct(p.change):'Niet vastgesteld'}</em></div>
      <div class="ng-confidence"><span>Gemeten modelbetrouwbaarheid</span><b>${conf===null?'Niet vastgesteld':pct(conf)+'%'}</b></div>
      <p><b>Betekenis:</b> ${p?'De uitkomst is afkomstig uit een geverifieerde klantgebonden prognose.':'Deze schermindicator bevat geen onafhankelijk geverifieerde prognose. Een getal of percentage op een kaart bewijst geen toekomstige ontwikkeling.'}</p>
      <p><b>Bronstatus:</b> ${p?'Bronnen en backtest zijn gekoppeld aan de canonieke prognose.':'Brongebonden historie, modelkwaliteit of onafhankelijke validatie ontbreken. Scenario-aannames worden niet als voorspelling gepresenteerd.'}</p>
      <div class="ng-actions"><button type="button" data-ng-action="explain">Waarom?</button><button type="button" data-ng-action="plan">${p?'Bekijk acties':'Bekijk bronnen en prognoses'} →</button></div>`;
    currentLensDetail={metric:metric.label,label:metric.label,horizon:h,scenario,confidence:conf,sourceType:'future_lens'};
    if(p)emit('portal:future-lens-change',{...currentLensDetail,projection:p});
  };
  select.addEventListener('change',render); horizon.addEventListener('change',render);
  host.querySelectorAll('[data-scenario]').forEach(btn=>btn.addEventListener('click',()=>{scenario=btn.dataset.scenario;host.querySelectorAll('[data-scenario]').forEach(x=>x.classList.toggle('active',x===btn));render();}));
  host.addEventListener('click',e=>{const a=e.target.closest('[data-ng-action]');if(!a)return;if(a.dataset.ngAction==='plan'){const metric=cards[Number(select.value)||0]?.metric;const proven=project(metric,Number(horizon.value)||6,scenario);if(proven)emit('portal:action-intent',{...(currentLensDetail||{}),action:'review_action'});document.querySelector(proven?'[data-open-page="actieve-acties"],[data-open-page="roadmap"]':'[data-open-page="cijfers-maatstaven"],[data-open-page="businesscase"]')?.click();}else openInspector(cards[Number(select.value)||0]?.node);});
  render();
}
function inspectorHtml(node){
  const m=parseMetric(node),conf=confidence(m);
  return `<div class="ng-inspector-head"><div><span class="ng-eyebrow">CONTEXT INSPECTOR</span><h2>${esc(m.label)}</h2></div><button type="button" data-ng-close aria-label="Sluiten">×</button></div>
  <div class="ng-inspector-grid"><section><h3>Begrijp</h3><p>Huidige waarde <b>${Number.isFinite(m.value)?pct(m.value):'niet beschikbaar'}</b>. Zichtbare verandering <b>${Number.isFinite(m.delta)?(m.delta>=0?'+':'')+pct(m.delta):'niet beschikbaar'}</b>.</p></section>
  <section><h3>Vertrouw</h3><p>${conf===null?'Betrouwbaarheid onbekend: de schermtekst is geen brongevalideerde meting.':'Gekalibreerde modelbetrouwbaarheid <b>'+pct(conf)+'%</b>; bronbewijs en backtest zijn verplicht.'}</p></section>
  <section><h3>Kijk vooruit</h3><p>Gebruik de brongebonden Powerhouse-scenariostudio. Zonder geverifieerde tijdreeks worden geen toekomstwaarden berekend.</p></section>
  <section><h3>Handel</h3><p>Van elk inzicht moet de gebruiker naar een actie, roadmap-item of besluit kunnen gaan zonder de context kwijt te raken.</p></section></div>`;
}
function openInspector(node){
  let dialog=document.getElementById('ngInspector');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='ngInspector';dialog.className='ng-inspector';document.body.appendChild(dialog);dialog.addEventListener('click',e=>{if(e.target.matches('[data-ng-close]'))dialog.close();});}
  dialog.innerHTML=inspectorHtml(node);dialog.showModal();
  emit('portal:nextgen-insight',{label:parseMetric(node).label});
}

function semanticLabel({title='',aria='',text=''}={}){
  return String(title||aria||text||'Datapunt').replace(/\s+/g,' ').trim().slice(0,180)||'Datapunt';
}
function bindSemanticVisual(node){
  if(!node?.querySelector||node.dataset.ngSemanticBound)return;
  const svg=node.querySelector('svg');if(!svg)return;
  const marks=[...svg.querySelectorAll('[tabindex],[role="button"],circle,rect,path')].filter(mark=>mark.querySelector?.('title')||mark.getAttribute?.('aria-label')||mark.hasAttribute?.('tabindex'));
  if(!marks.length)return;
  node.dataset.ngSemanticBound='true';
  marks.forEach(mark=>{
    const label=semanticLabel({title:mark.querySelector?.('title')?.textContent,aria:mark.getAttribute?.('aria-label'),text:mark.textContent});
    mark.classList?.add('ng-semantic-point');
    if(!mark.hasAttribute?.('tabindex'))mark.setAttribute?.('tabindex','0');
    if(!mark.getAttribute?.('role'))mark.setAttribute?.('role','button');
    if(!mark.getAttribute?.('aria-label'))mark.setAttribute?.('aria-label',label);
  });
  const select=mark=>{
    marks.forEach(item=>item.classList?.toggle('ng-semantic-selected',item===mark));
    const label=semanticLabel({title:mark.querySelector?.('title')?.textContent,aria:mark.getAttribute?.('aria-label'),text:mark.textContent});
    let dock=node.querySelector('.ng-point-dock');
    if(!dock){dock=document.createElement('div');dock.className='ng-point-dock';dock.setAttribute('aria-live','polite');node.appendChild(dock);}
    dock.innerHTML=`<div><span>Geselecteerd</span><strong>${esc(label)}</strong></div><div class="ng-point-actions"><button type="button" data-ng-point-context>Context</button><button type="button" data-ng-point-action>Actie →</button></div>`;
    emit('portal:semantic-point-select',{label,visual:node.querySelector('figcaption')?.textContent||node.getAttribute('aria-label')||'visual'});
  };
  svg.addEventListener('click',event=>{const mark=event.target?.closest?.('.ng-semantic-point');if(mark&&svg.contains(mark))select(mark);});
  svg.addEventListener('keydown',event=>{const mark=event.target?.closest?.('.ng-semantic-point');if(mark&&(event.key==='Enter'||event.key===' ')){event.preventDefault();select(mark);}});
  node.addEventListener('click',event=>{
    if(event.target.closest('[data-ng-point-context]'))openInspector(node);
    if(event.target.closest('[data-ng-point-action]')){const selected=marks.find(item=>item.classList?.contains('ng-semantic-selected'));const label=selected?semanticLabel({title:selected.querySelector?.('title')?.textContent,aria:selected.getAttribute?.('aria-label'),text:selected.textContent}):'Datapunt';emit('portal:action-intent',{label,visual:node.querySelector('figcaption')?.textContent||node.getAttribute('aria-label')||'visual',sourceType:'semantic_visual',action:'create_action'});document.querySelector('[data-open-page="actieve-acties"],[data-open-page="roadmap"]')?.click();}
  });
}

function enhanceSurfaces(){
  const selector='.kpi,.glance-card,.v2visual,[data-portal-visual],.company-decision-card,.legacy-insight-card';
  const apply=root=>root.querySelectorAll?.(selector).forEach(node=>{if(node.dataset.ngEnhanced)return;node.dataset.ngEnhanced='true';node.classList.add('ng-interactive');if(!node.querySelector('[data-ng-inspect]')){const b=document.createElement('button');b.type='button';b.className='ng-inspect';b.dataset.ngInspect='';b.textContent='Inzicht';b.setAttribute('aria-label','Open context en verklaring');node.appendChild(b);}bindSemanticVisual(node);});
  apply(document);
  document.addEventListener('click',e=>{const b=e.target.closest('[data-ng-inspect]');if(b){e.preventDefault();e.stopPropagation();openInspector(b.closest(selector));}});
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>n.nodeType===1&&apply(n)))).observe(document.body,{childList:true,subtree:true});
}
function markReady(){document.documentElement.dataset.nextgenIntelligence='ready';}
function init(){if(document.querySelector('.ng-lens'))return;enhanceSurfaces();initLens();markReady();}
if(globalThis.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
export {parseMetric,confidence,project,semanticLabel};
