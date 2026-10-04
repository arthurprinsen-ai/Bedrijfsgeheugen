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
function confidence(metric){
  let score=35;
  if(Number.isFinite(metric.value))score+=30;
  if(Number.isFinite(metric.delta))score+=20;
  if(globalThis.document?.querySelector?.('[data-company-context],.company-intelligence-context'))score+=10;
  if(globalThis.document?.querySelector?.('[data-evidence-id],[data-source]'))score+=5;
  return clamp(score,0,95);
}
function project(metric,horizon,scenario){
  if(!Number.isFinite(metric.value))return null;
  const monthly=Number.isFinite(metric.delta)?metric.delta:0;
  const factor=scenario==='opportunity'?(monthly>=0?1.25:0.55):scenario==='stress'?(monthly>=0?0.55:1.25):1;
  const projected=clamp(metric.value+monthly*horizon*factor,0,100);
  return {projected,change:projected-metric.value,monthly,factor};
}
function forecastSvg(metric,horizon,scenario){
  const p=project(metric,horizon,scenario); if(!p)return '<div class="ng-empty">Nog onvoldoende meetdata voor een numerieke projectie.</div>';
  const w=520,h=180,pad=28,points=Array.from({length:horizon+1},(_,i)=>clamp(metric.value+p.monthly*i*p.factor,0,100));
  const x=i=>pad+(w-pad*2)*i/horizon,y=v=>h-pad-(h-pad*2)*v/100;
  const d=points.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const band=Math.max(3,(100-confidence(metric))/8);
  const upper=points.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(clamp(v+band,0,100)).toFixed(1)}`).join(' ');
  const lower=[...points].reverse().map((v,ri)=>{const i=points.length-1-ri;return `L${x(i).toFixed(1)} ${y(clamp(v-band,0,100)).toFixed(1)}`;}).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Indicatieve projectie voor ${esc(metric.label)}"><line x1="${pad}" y1="${y(50)}" x2="${w-pad}" y2="${y(50)}" class="ng-grid"/><path d="${upper} ${lower} Z" class="ng-band"/><path d="${d}" class="ng-line"/><circle cx="${x(0)}" cy="${y(points[0])}" r="4" class="ng-dot"/><circle cx="${x(horizon)}" cy="${y(points.at(-1))}" r="5" class="ng-dot ng-dot-end"/><text x="${pad}" y="${h-7}" class="ng-axis">Nu</text><text x="${w-pad}" y="${h-7}" text-anchor="end" class="ng-axis">${horizon} mnd</text></svg>`;
}
function buildLens(){
  const section=document.createElement('section');
  section.className='card ng-lens';
  section.setAttribute('aria-label','Toekomstlens');
  section.innerHTML=`<div class="ng-lens-head"><div><span class="ng-eyebrow">POWERHOUSE FUTURE LENS</span><h2>Wat gebeurt er als je niets verandert — en wat als je nu handelt?</h2><p>Interactieve scenarioverkenning op basis van de meetwaarden die al in het portaal staan. Geen schijnzekerheid: aannames en betrouwbaarheid blijven zichtbaar.</p></div><span class="ng-trust">verklaarbaar · contextbewust · actiegericht</span></div>
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
    story.innerHTML=`<div class="ng-readout"><span>Indicatie over ${h} maanden</span><strong>${p?pct(p.projected):'—'}${p?'/100':''}</strong><em class="${p&&p.change<0?'down':''}">${p?(p.change>=0?'+':'')+pct(p.change):'—'} punten</em></div>
      <div class="ng-confidence"><span>Betrouwbaarheid</span><b>${conf}%</b><i style="--confidence:${conf}%"></i></div>
      <p><b>Wat dit betekent:</b> het huidige patroon is <strong>${direction}</strong>. Dit is een rule-based projectie van de zichtbare trend, geen voorspelling met verborgen data.</p>
      <p><b>Aanname:</b> het maandtempo blijft gelijk; scenario “${scenario==='stress'?'Tegenvallend':scenario==='opportunity'?'Versnellen':'Basispad'}” past alleen de gevoeligheid aan.</p>
      <div class="ng-actions"><button type="button" data-ng-action="explain">Waarom?</button><button type="button" data-ng-action="plan">Maak er een actie van →</button></div>`;
    currentLensDetail={metric:metric.label,label:metric.label,horizon:h,scenario,confidence:conf,sourceType:'future_lens'};
    emit('portal:future-lens-change',{...currentLensDetail,projection:p});
  };
  select.addEventListener('change',render); horizon.addEventListener('change',render);
  host.querySelectorAll('[data-scenario]').forEach(btn=>btn.addEventListener('click',()=>{scenario=btn.dataset.scenario;host.querySelectorAll('[data-scenario]').forEach(x=>x.classList.toggle('active',x===btn));render();}));
  host.addEventListener('click',e=>{const a=e.target.closest('[data-ng-action]');if(!a)return;if(a.dataset.ngAction==='plan'){emit('portal:action-intent',{...(currentLensDetail||{}),action:'create_action'});document.querySelector('[data-open-page="actieve-acties"],[data-open-page="roadmap"]')?.click();}else openInspector(cards[Number(select.value)||0]?.node);});
  render();
}
function inspectorHtml(node){
  const m=parseMetric(node),conf=confidence(m);
  return `<div class="ng-inspector-head"><div><span class="ng-eyebrow">CONTEXT INSPECTOR</span><h2>${esc(m.label)}</h2></div><button type="button" data-ng-close aria-label="Sluiten">×</button></div>
  <div class="ng-inspector-grid"><section><h3>Begrijp</h3><p>Huidige waarde <b>${Number.isFinite(m.value)?pct(m.value):'niet beschikbaar'}</b>. Zichtbare verandering <b>${Number.isFinite(m.delta)?(m.delta>=0?'+':'')+pct(m.delta):'niet beschikbaar'}</b>.</p></section>
  <section><h3>Vertrouw</h3><p>Betrouwbaarheid <b>${conf}%</b>. De score stijgt alleen wanneer actuele waarde, trend, bedrijfscontext en bron/evidence aantoonbaar aanwezig zijn.</p></section>
  <section><h3>Kijk vooruit</h3><p>Gebruik de Future Lens om 3, 6 of 12 maanden te verkennen. Scenario’s veranderen aannames, niet de historische brondata.</p></section>
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
