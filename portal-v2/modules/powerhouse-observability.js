const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const lower=value=>String(value??'').toLowerCase();

const PERIODS={today:1,week:7,month:30,all:0};
const TABS=[
  ['overview','Overzicht'],['timeline','Tijdlijn'],['errors','Errors & herstel'],['layers','Lagen & systemen'],
  ['knowledge','Documentatie & learning'],['skills','Skills'],['delivery','Delivery & bewijs']
];

function timeMs(value){const n=Date.parse(value||'');return Number.isFinite(n)?n:0}
function unique(values){return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'nl'))}
function withinPeriod(event,period){
  const days=PERIODS[period]??7;if(!days)return true;
  const at=timeMs(event.occurredAt);if(!at)return true;
  return at>=Date.now()-days*86400000;
}
function tone(status,severity){
  const s=lower(status),v=lower(severity);
  if(v.includes('critical')||v.includes('error')||s.includes('fail')||s.includes('block')||s.includes('drift'))return'bad';
  if(v.includes('warn')||s.includes('pending')||s.includes('stale')||s.includes('open')||s.includes('queue'))return'warn';
  if(s.includes('success')||s.includes('green')||s.includes('verified')||s.includes('live')||s.includes('proven')||s.includes('fulfilled'))return'good';
  return'neutral';
}
function isError(event){return tone(event.status,event.severity)==='bad'||lower(event.category).includes('error')||lower(event.rawType).includes('error')}
function isKnowledge(event){const s=[event.category,event.layer,event.rawType,event.title].map(lower).join(' ');return /learning|document|ledger|memory|knowledge|writeback/.test(s)}
function isSkill(event){const s=[event.category,event.layer,event.rawType,event.title,event.subjectId].map(lower).join(' ');return /skill|projection/.test(s)}
function isDelivery(event){const s=[event.category,event.layer,event.rawType,event.title,event.status].map(lower).join(' ');return /delivery|github|deploy|merge|release|production|readback|ci|workflow|pull request|pr /.test(s)}
function fmtTime(value){if(!value)return'—';try{return new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))}catch{return value}}
function fmtMoney(value,currency='EUR'){const n=Number(value)||0;return new Intl.NumberFormat('nl-NL',{style:'currency',currency,maximumFractionDigits:0}).format(n)}

function summary(events,observability){
  const errors=events.filter(isError);
  const open=events.filter(e=>['bad','warn'].includes(tone(e.status,e.severity)));
  const proven=events.filter(e=>tone(e.status,e.severity)==='good');
  return {
    events:events.length, errors:errors.length, open:open.length, proven:proven.length,
    agents:unique(events.map(e=>e.actor)).length,
    sources:unique(events.map(e=>e.source)).length,
    layers:unique(events.map(e=>e.layer)).length,
    skills:events.filter(isSkill).length,
    docs:events.filter(isKnowledge).length,
    loops:arr(observability.loops).length
  };
}

function filterEvents(events,state){
  const q=lower(state.q);
  return events.filter(event=>{
    if(!withinPeriod(event,state.period))return false;
    if(state.actor!=='all'&&event.actor!==state.actor)return false;
    if(state.layer!=='all'&&event.layer!==state.layer)return false;
    if(state.status!=='all'&&tone(event.status,event.severity)!==state.status)return false;
    if(state.source!=='all'&&event.source!==state.source)return false;
    if(q&&!lower([event.title,event.detail,event.subjectId,event.rawType,event.actor,event.source,event.layer,event.status].join(' ')).includes(q))return false;
    return true;
  });
}

function kpi(label,value,sub=''){return `<article class="poc-kpi"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(sub)}</span></article>`}
function statusBadge(event){const t=tone(event.status,event.severity);return `<span class="poc-badge ${t}">${esc(event.status||event.severity||'onbekend')}</span>`}
function empty(copy){return `<div class="poc-empty">${esc(copy)}</div>`}

function timeline(events){
  if(!events.length)return empty('Geen events binnen deze filters.');
  return `<div class="poc-tablewrap"><table class="poc-table"><thead><tr><th>Tijd</th><th>Gebeurtenis</th><th>Actor</th><th>Laag</th><th>Bron</th><th>Status</th></tr></thead><tbody>${events.slice().sort((a,b)=>timeMs(b.occurredAt)-timeMs(a.occurredAt)).slice(0,300).map(e=>`<tr data-event-id="${esc(e.id)}"><td>${esc(fmtTime(e.occurredAt))}</td><td><b>${esc(e.title||e.rawType||e.subjectId||'Event')}</b><small>${esc(e.detail||e.subjectId||'')}</small></td><td>${esc(e.actor||'—')}</td><td>${esc(e.layer||'—')}</td><td>${esc(e.source||'—')}</td><td>${statusBadge(e)}</td></tr>`).join('')}</tbody></table></div>`;
}
function bars(groups,total){
  const max=Math.max(1,...groups.map(([,n])=>n));
  return `<div class="poc-bars">${groups.map(([label,n])=>`<div class="poc-bar"><div><b>${esc(label)}</b><span>${n}</span></div><i><em style="width:${Math.round(n/max*100)}%"></em></i><small>${total?Math.round(n/total*100):0}% van selectie</small></div>`).join('')}</div>`;
}
function groupCount(events,key){
  const map=new Map();
  for(const e of events){const value=e[key]||'Onbekend';map.set(value,(map.get(value)||0)+1)}
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}
function errorView(events){
  const errors=events.filter(isError);
  if(!errors.length)return empty('Geen fouten of geblokkeerde events binnen deze filters.');
  const byFingerprint=new Map();
  for(const e of errors){const key=e.fingerprint||e.rawType||e.title||'zonder fingerprint';if(!byFingerprint.has(key))byFingerprint.set(key,[]);byFingerprint.get(key).push(e)}
  return `<div class="poc-grid2"><section class="poc-panel"><h4>Foutclusters</h4>${bars([...byFingerprint.entries()].map(([k,v])=>[k,v.length]).slice(0,12),errors.length)}</section><section class="poc-panel"><h4>Laatste errors</h4>${errors.slice().sort((a,b)=>timeMs(b.occurredAt)-timeMs(a.occurredAt)).slice(0,20).map(e=>`<article class="poc-error"><div>${statusBadge(e)}<b>${esc(e.title||e.rawType)}</b></div><p>${esc(e.detail||e.subjectId||'')}</p><small>${esc(fmtTime(e.occurredAt))} · ${esc(e.actor||'—')} · ${esc(e.layer||'—')}</small></article>`).join('')}</section></div>`;
}
function layerView(events,observability){
  const components=arr(observability.components);
  return `<div class="poc-grid2"><section class="poc-panel"><h4>Activiteit per laag</h4>${bars(groupCount(events,'layer').slice(0,16),events.length)}</section><section class="poc-panel"><h4>Platform- en componentstatus</h4>${components.length?components.map(c=>`<article class="poc-component"><div><b>${esc(c.name||c.component||c.platform||'Component')}</b><small>${esc(c.kind||c.layer||'')}</small></div><span class="poc-dot ${c.healthy===false?'bad':'good'}"></span></article>`).join(''):empty('Nog geen componentstatus in de runtimeprojectie.')}</section></div>`;
}
function knowledgeView(events){
  const knowledge=events.filter(isKnowledge);
  return `<div class="poc-grid2"><section class="poc-panel"><h4>Learning & documentatie</h4>${knowledge.length?timeline(knowledge):empty('Geen learning/documentatie-events binnen deze filters.')}</section><section class="poc-panel"><h4>Wat wordt vastgelegd</h4><div class="poc-checks"><span>Brain learning</span><span>Development ledger</span><span>Menselijke documentatie</span><span>Root cause</span><span>Prevention rule</span><span>Outcome/evidence</span></div></section></div>`;
}
function skillsView(events){
  const skills=events.filter(isSkill);
  return `<section class="poc-panel"><h4>Skill projection & wijzigingen</h4>${skills.length?timeline(skills):empty('Geen expliciete skill-events in de gekozen periode. Skill-projectie blijft alleen groen met runtime-evidence.')}</section>`;
}
function deliveryView(events,observability){
  const delivery=events.filter(isDelivery);
  const economics=observability.economics||{};
  return `<div class="poc-grid2"><section class="poc-panel"><h4>Delivery-events</h4>${delivery.length?timeline(delivery):empty('Geen delivery-events binnen deze filters.')}</section><section class="poc-panel"><h4>Waarde & kosten</h4><div class="poc-kpis compact">${kpi('Expected value',fmtMoney(economics.expectedValue,economics.currency))}${kpi('Actual cost',fmtMoney(economics.actualCost,economics.currency))}${kpi('Realized value',fmtMoney(economics.realizedValue,economics.currency))}${kpi('Realized profit',fmtMoney(economics.realizedProfit,economics.currency))}</div><p class="poc-note">Delivery is pas terminal wanneer protected delivery, productie/provider-readback, learning/writeback en skill-projectie aantoonbaar gesloten zijn.</p></section></div>`;
}
function overview(events,observability){
  const s=summary(events,observability);
  const errors=events.filter(isError).sort((a,b)=>timeMs(b.occurredAt)-timeMs(a.occurredAt));
  return `<div class="poc-kpis">${kpi('Events',s.events,'binnen selectie')}${kpi('Errors',s.errors,'fail/blocked/drift')}${kpi('Open aandacht',s.open,'warning + errors')}${kpi('Bewezen groen',s.proven,'verified/live/proven')}${kpi('Actors',s.agents,'agents/chats/workers')}${kpi('Skills',s.skills,'skill/projection events')}</div>
  <div class="poc-grid3"><section class="poc-panel"><h4>Activiteit per laag</h4>${bars(groupCount(events,'layer').slice(0,10),events.length)}</section><section class="poc-panel"><h4>Activiteit per actor</h4>${bars(groupCount(events,'actor').slice(0,10),events.length)}</section><section class="poc-panel"><h4>Laatste afwijkingen</h4>${errors.length?errors.slice(0,8).map(e=>`<article class="poc-mini"><div>${statusBadge(e)}<b>${esc(e.title||e.rawType)}</b></div><small>${esc(fmtTime(e.occurredAt))} · ${esc(e.layer||'—')}</small></article>`).join(''):empty('Geen afwijkingen binnen deze filters.')}</section></div>
  <section class="poc-panel"><div class="poc-panelhead"><h4>Dagelijkse activiteit</h4><span>${s.events} events · ${s.sources} bronnen · ${s.layers} lagen</span></div>${timeline(events.slice(0,80))}</section>`;
}

export function mountPowerhouseObservability(container,{domainState}={}){
  const getRuntime=()=>domainState?.get?.()?.portal?.runtime||globalThis.__BG_PORTAL_DOMAIN_STATE__?.get?.()?.portal?.runtime||{};
  const state={period:'week',actor:'all',layer:'all',status:'all',source:'all',q:'',tab:'overview'};
  const root=document.createElement('section');root.className='poc';container.innerHTML='';container.appendChild(root);

  function render(){
    const runtime=getRuntime();const obs=runtime.observability||{};
    const all=arr(obs.events);const events=filterEvents(all,state);
    const actors=unique(all.map(e=>e.actor)),layers=unique(all.map(e=>e.layer)),sources=unique(all.map(e=>e.source));
    root.innerHTML=`<header class="poc-head"><div><span>Powerhouse Control Center</span><h3>Alles wat AI, agents, chats en delivery doen</h3><p>Dagelijks inzicht in activiteit, fouten, learnings, skills, systemen, GitHub/delivery en terminal bewijs. Geen runtime-evidence = geen verzonnen status.</p></div><div class="poc-live"><i></i><b>${all.length?'Runtime gekoppeld':'Geen runtimebewijs'}</b><small>${esc(obs.updatedAt?fmtTime(obs.updatedAt):'')}</small></div></header>
      <section class="poc-filters">
        <label>Periode<select data-filter="period"><option value="today">Vandaag</option><option value="week">7 dagen</option><option value="month">30 dagen</option><option value="all">Alles</option></select></label>
        <label>Actor<select data-filter="actor"><option value="all">Alle actors</option>${actors.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>
        <label>Laag<select data-filter="layer"><option value="all">Alle lagen</option>${layers.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>
        <label>Status<select data-filter="status"><option value="all">Alle statussen</option><option value="bad">Errors/blokkades</option><option value="warn">Aandacht/pending</option><option value="good">Groen/bewezen</option><option value="neutral">Overig</option></select></label>
        <label>Bron<select data-filter="source"><option value="all">Alle bronnen</option>${sources.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>
        <label class="poc-search">Zoeken<input data-filter="q" value="${esc(state.q)}" placeholder="error, agent, PR, skill, Supabase..."></label>
      </section>
      <nav class="poc-tabs">${TABS.map(([id,label])=>`<button type="button" data-tab="${id}" class="${state.tab===id?'active':''}">${label}</button>`).join('')}</nav>
      <div class="poc-body" data-body></div>`;
    root.querySelector('[data-filter="period"]').value=state.period;
    root.querySelector('[data-filter="actor"]').value=state.actor;
    root.querySelector('[data-filter="layer"]').value=state.layer;
    root.querySelector('[data-filter="status"]').value=state.status;
    root.querySelector('[data-filter="source"]').value=state.source;
    root.querySelectorAll('[data-filter]').forEach(control=>control.addEventListener(control.tagName==='INPUT'?'input':'change',()=>{state[control.dataset.filter]=control.value;render()}));
    root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;render()}));
    const body=root.querySelector('[data-body]');
    body.innerHTML=state.tab==='overview'?overview(events,obs):state.tab==='timeline'?timeline(events):state.tab==='errors'?errorView(events):state.tab==='layers'?layerView(events,obs):state.tab==='knowledge'?knowledgeView(events):state.tab==='skills'?skillsView(events):deliveryView(events,obs);
  }
  render();
  const handler=()=>render();document.addEventListener('bg:runtime-evidence',handler);
  return {render,destroy:()=>document.removeEventListener('bg:runtime-evidence',handler)};
}
