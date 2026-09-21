import { mapRuntimeProjection } from '../runtime-evidence.js';
import { ensureIdentityWidget } from '../portal-state.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const lower=value=>String(value??'').toLowerCase();

const PERIODS={today:1,week:7,month:30,all:0};
const TABS=[
  ['system-map','Systeemkaart'],['overview','Overzicht'],['timeline','Tijdlijn'],['errors','Errors & herstel'],['layers','Lagen & systemen'],
  ['knowledge','Documentatie & learning'],['skills','Skills'],['delivery','Delivery & bewijs'],['integrations','Koppelingen']
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

function systemMapView(systemMap,events){
  if(!systemMap)return empty('De canonieke System Map ontbreekt in de beveiligde runtimeprojectie.');
  const snapshot=systemMap.providerSnapshot||{};
  const inventories=systemMap.inventories||{};
  const liveSupabase=systemMap.supabaseInventory||{};
  const supabaseCatalog=liveSupabase.inventory||{};
  const liveTables=arr(supabaseCatalog.tables),liveViews=arr(supabaseCatalog.views),liveDbFunctions=arr(supabaseCatalog.functions),liveCron=arr(supabaseCatalog.active_cron_jobs);
  const runtimeActors=unique(events.map(e=>e.actor).filter(Boolean));
  const sourceCards=arr(systemMap.sources).map(source=>`<article class="psm-source"><b>${esc(source.label)}</b><p>${esc(source.role)}</p><span>${source.authority?'Authority':'Surface/provider'}</span></article>`).join('');
  const layers=arr(systemMap.intelligenceLayers).map((layer,index)=>`<article class="psm-layer"><span>${String(index+1).padStart(2,'0')}</span><div><b>${esc(layer.label)}</b><p>${esc(layer.purpose)}</p></div></article>`).join('');
  const flows=arr(systemMap.flow).map(edge=>`<div class="psm-edge"><b>${esc(edge.from)}</b><span>→</span><b>${esc(edge.to)}</b><small>${esc(edge.label)}</small></div>`).join('');
  const inventory=(title,items)=>`<details class="psm-inventory"><summary><b>${esc(title)}</b><span>${arr(items).length}</span></summary><div>${arr(items).map(item=>`<code>${esc(item)}</code>`).join('')}</div></details>`;
  const contract=systemMap.agentRegistrationContract||{};
  return `<section class="psm-hero"><div><span>Levende architectuur · ${esc(systemMap.version)}</span><h4>Zo werkt heel Powerhouse met elkaar</h4><p>GitHub definieert en levert, Netlify ontsluit, Supabase is de canonieke runtime, Notion projecteert de menselijke waarheid en Portal V2 maakt alles bestuurbaar. Runtime-actors worden automatisch toegevoegd zodra zij evidence met actor-identiteit leveren.</p></div><small>Snapshot ${esc(fmtTime(systemMap.observedAt))}</small></section>
  <div class="poc-kpis psm-kpis">
    ${kpi('Supabase tabellen',liveSupabase.status==='LIVE'?liveTables.length:'—',liveSupabase.status==='LIVE'?'live catalogus':'providerreadback ontbreekt')}
    ${kpi('Supabase views',liveSupabase.status==='LIVE'?liveViews.length:'—',liveSupabase.status==='LIVE'?'live catalogus':'providerreadback ontbreekt')}
    ${kpi('DB functions',liveSupabase.status==='LIVE'?liveDbFunctions.length:'—',liveSupabase.status==='LIVE'?'live catalogus':'providerreadback ontbreekt')}
    ${kpi('Actieve cron-jobs',liveSupabase.status==='LIVE'?liveCron.length:'—',liveSupabase.status==='LIVE'?'live catalogus':'providerreadback ontbreekt')}
    ${kpi('GitHub workflows',snapshot.github?.workflows??arr(inventories.githubWorkflows).length,'delivery + intelligence')}
    ${kpi('Netlify functions',snapshot.netlify?.functions??arr(inventories.netlifyFunctions).length,'API + portal boundary')}
  </div>
  <section class="poc-panel"><div class="poc-panelhead"><h4>Vier authorities + surfaces</h4><span>één Powerhouse, geen parallelle waarheid</span></div><div class="psm-sources">${sourceCards}</div></section>
  <section class="poc-panel"><div class="poc-panelhead"><h4>Intelligentielagen</h4><span>${arr(systemMap.intelligenceLayers).length} gekoppelde lagen</span></div><div class="psm-layers">${layers}</div></section>
  <div class="poc-grid2">
    <section class="poc-panel"><h4>Datastroom & samenhang</h4><div class="psm-flow">${flows}</div></section>
    <section class="poc-panel"><h4>Agents die nu in runtime zichtbaar zijn</h4><div class="psm-actors">${runtimeActors.length?runtimeActors.map(actor=>`<span>${esc(actor)}</span>`).join(''):empty('Nog geen actor-events binnen de geladen runtime-evidence.')}</div><p class="poc-note">Dit is dynamisch: een chat/agent/workflow die canonieke runtime-evidence schrijft, verschijnt hier zonder handmatige pagina-edit.</p></section>
  </div>
  <section class="poc-panel"><div class="poc-panelhead"><h4>Volledige technische inventaris</h4><span>expand/collapse</span></div>
    <div class="psm-inventories">
      ${inventory('GitHub workflows',inventories.githubWorkflows)}
      ${inventory('Netlify functions',inventories.netlifyFunctions)}
      ${inventory('Supabase Edge Functions',inventories.supabaseFunctions)}
      ${liveSupabase.status==='LIVE'?inventory('Supabase tabellen · live',liveTables):''}
      ${liveSupabase.status==='LIVE'?inventory('Supabase views · live',liveViews):''}
      ${liveSupabase.status==='LIVE'?inventory('Supabase databasefuncties · live',liveDbFunctions):''}
      ${liveSupabase.status==='LIVE'?inventory('Supabase cron-jobs · live',liveCron):`<div class="poc-empty">Supabase live inventory: ${esc(liveSupabase.reason||'UNAVAILABLE')}</div>`}
      ${inventory('Powerhouse skills',inventories.skills)}
      ${inventory('Agent fabric modules',inventories.agentFabricModules)}
    </div>
  </section>
  <section class="poc-panel psm-contract"><div><span>Agent update contract</span><h4>Iedere huidige en toekomstige agent moet zichzelf vindbaar maken</h4><p>${esc(contract.rule||'')}</p></div><div class="poc-checks">${arr(contract.onCreateOrChange).map(item=>`<span>${esc(item)}</span>`).join('')}</div><p class="poc-note"><b>Fail-closed:</b> ${esc(contract.failClosed||'')}</p></section>`;
}


async function adminIdentityToken(){
  const identity=globalThis.netlifyIdentity;
  const user=identity?.currentUser?.();
  if(!user)return '';
  try{return await user.jwt?.()||''}catch{return ''}
}

async function composioAdminRequest(fetchImpl=globalThis.fetch,{action='status',apiKey=''}={}){
  const token=await adminIdentityToken();
  if(!token)return {ok:false,error:'UNAUTHENTICATED'};
  const isStatus=action==='status';
  const response=await fetchImpl('/api/powerhouse-composio-config',{
    method:isStatus?'GET':'POST',
    credentials:'same-origin',
    headers:{accept:'application/json','content-type':'application/json',authorization:`Bearer ${token}`},
    ...(isStatus?{}:{body:JSON.stringify(action==='set_api_key'?{action,apiKey}:{action})})
  });
  const data=await response.json().catch(()=>({error:'INVALID_RESPONSE'}));
  return {...data,httpStatus:response.status};
}

function integrationsView(model={}){
  const data=model.data||{};
  const loading=model.loading===true;
  const ready=data.ready===true;
  const keyPresent=data.api_key_present===true;
  const active=Number(data.active_accounts||0);
  const stateLabel=data.state||'ONBEKEND';
  const reason=data.reason||'';
  const link=data.redirect_url||'';
  return `<div class="poc-grid2">
    <section class="poc-panel">
      <div class="poc-panelhead"><h4>Composio · Instagram</h4><span>${ready?'Verbonden':keyPresent?'Key aanwezig':'Key ontbreekt'}</span></div>
      <div class="poc-kpis compact">
        ${kpi('API-key',keyPresent?'Aanwezig':'Ontbreekt','alleen Supabase Vault')}
        ${kpi('Instagram account',active===1?'1 actief':String(active),'exact één vereist')}
        ${kpi('Setup status',stateLabel,reason||'canonieke providerstatus')}
      </div>
      ${model.error?`<p class="poc-note"><b>Fout:</b> ${esc(model.error)}</p>`:''}
      <div class="poc-checks"><span>Netlify Identity admin-only</span><span>Server-to-server service token</span><span>Provider-validatie vóór opslag</span><span>Geen browserstorage</span></div>
      <button type="button" data-composio-refresh ${loading?'disabled':''}>${loading?'Controleren…':'Status vernieuwen'}</button>
    </section>
    <section class="poc-panel">
      <h4>Eenmalige veilige onboarding</h4>
      <p class="poc-note">Kopieer in Composio via Settings → Project Settings → API Keys je project API-key. De waarde wordt uitsluitend over TLS naar de admin-API gestuurd, live gevalideerd en daarna in Supabase Vault opgeslagen. De sleutel wordt niet teruggelezen of in de browser bewaard.</p>
      <form data-composio-key-form autocomplete="off">
        <label>Composio project API-key<input type="password" name="apiKey" autocomplete="new-password" spellcheck="false" required minlength="20" placeholder="Plak API-key"></label>
        <button type="submit" ${loading?'disabled':''}>Valideren en veilig opslaan</button>
      </form>
      <hr>
      <p class="poc-note">Na een geldige key maakt Powerhouse een Composio-hosted Instagram Connect Link. Meta/Instagram OAuth-credentials blijven bij Composio.</p>
      <button type="button" data-composio-link ${loading||!keyPresent||ready?'disabled':''}>Instagram koppelen</button>
      ${link?`<p class="poc-note"><a href="${esc(link)}" target="_blank" rel="noopener noreferrer">OAuth-link opnieuw openen</a></p>`:''}
      ${ready?`<p class="poc-note"><b>Gereed:</b> exact één actieve Instagram-connection is gevalideerd. ${data.resume_attempted?(data.publisher_ok?'Publisher direct hervat.':'Publisher-resume vraagt aandacht.'):(model.polling?'Automatische hervatting wordt gestart.':'Publisher kan hervatten.')}</p>`:''}
    </section>
  </div>`;
}

async function adminRuntimeEvidence(fetchImpl=globalThis.fetch){
  const identity=globalThis.netlifyIdentity;
  const user=identity?.currentUser?.();
  if(!user)return {status:'unauthenticated',runtime:null};
  let token='';
  try{token=await user.jwt?.()||'';}catch{}
  if(!token)return {status:'unauthenticated',runtime:null};
  const response=await fetchImpl('/api/powerhouse-observability',{
    method:'GET',
    credentials:'same-origin',
    headers:{accept:'application/json',authorization:`Bearer ${token}`}
  });
  if(response.status===401)return {status:'unauthenticated',runtime:null};
  if(response.status===403)return {status:'forbidden',runtime:null};
  if(!response.ok)return {status:'error',runtime:null};
  const projection=await response.json();
  return {status:'ready',runtime:{...mapRuntimeProjection(projection),systemMap:projection.systemMap||null}};
}

async function openAdminLogin(){
  const identity=await ensureIdentityWidget();
  if(!identity?.open)throw new Error('IDENTITY_WIDGET_UNAVAILABLE');
  identity.open('login');
}

function accessState(root,status,onLogin){
  const copy=status==='forbidden'
    ?['Geen toegang','Dit onderdeel is alleen beschikbaar voor geautoriseerde Powerhouse-beheerders.']
    :status==='error'
      ?['Beveiligde data niet beschikbaar','De admin-only observability-API kon niet veilig worden gelezen. Er wordt geen fallback naar de gewone klant-API gebruikt.']
      :['Inloggen vereist','Log in met een geautoriseerd beheeraccount om het Powerhouse Control Center te openen.'];
  root.innerHTML=`<section class="poc-panel poc-access"><span>🔒 Powerhouse Control Center</span><h3>${esc(copy[0])}</h3><p>${esc(copy[1])}</p>${status==='unauthenticated'?'<button type="button" class="poc-login">Inloggen</button>':''}</section>`;
  root.querySelector('.poc-login')?.addEventListener('click',async()=>{
    const button=root.querySelector('.poc-login');
    if(button){button.disabled=true;button.textContent='Inloggen openen…';}
    try{await onLogin();}catch{
      if(button){button.disabled=false;button.textContent='Inloggen';}
      const note=document.createElement('p');note.className='poc-note';note.textContent='Inloggen kon niet worden geopend. Vernieuw de pagina en probeer opnieuw.';
      root.querySelector('.poc-access')?.appendChild(note);
    }
  });
}

export function mountPowerhouseObservability(container,{fetchImpl=globalThis.fetch}={}){
  const state={period:'week',actor:'all',layer:'all',status:'all',source:'all',q:'',tab:'system-map',composio:{loading:false,data:null,error:null,polling:false,resumed:false}};
  const root=document.createElement('section');root.className='poc';container.innerHTML='';container.appendChild(root);
  let securedRuntime=null;
  let destroyed=false;
  let composioPollTimer=null;
  let composioPollCount=0;

  function render(){
    if(!securedRuntime){accessState(root,'unauthenticated',()=>openAdminLogin());return;}
    const obs=securedRuntime.observability||{};
    const all=arr(obs.events);const events=filterEvents(all,state);
    const actors=unique(all.map(e=>e.actor)),layers=unique(all.map(e=>e.layer)),sources=unique(all.map(e=>e.source));
    root.innerHTML=`<header class="poc-head"><div><span>Powerhouse Control Center</span><h3>Alles wat AI, agents, chats en delivery doen</h3><p>Dagelijks inzicht in activiteit, fouten, learnings, skills, systemen, GitHub/delivery en terminal bewijs. Geen runtime-evidence = geen verzonnen status.</p></div><div class="poc-live"><i></i><b>Admin runtime gekoppeld</b><small>${esc(obs.updatedAt?fmtTime(obs.updatedAt):'')}</small></div></header>
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
    root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;render();if(state.tab==='integrations'&&!state.composio.data&&!state.composio.loading)loadComposio('status')}));
    const body=root.querySelector('[data-body]');
    body.innerHTML=state.tab==='system-map'?systemMapView(securedRuntime.systemMap,all):state.tab==='overview'?overview(events,obs):state.tab==='timeline'?timeline(events):state.tab==='errors'?errorView(events):state.tab==='layers'?layerView(events,obs):state.tab==='knowledge'?knowledgeView(events):state.tab==='skills'?skillsView(events):state.tab==='delivery'?deliveryView(events,obs):integrationsView(state.composio);
    if(state.tab==='integrations'){
      body.querySelector('[data-composio-refresh]')?.addEventListener('click',()=>loadComposio('status'));
      body.querySelector('[data-composio-link]')?.addEventListener('click',()=>loadComposio('create_link'));
      body.querySelector('[data-composio-key-form]')?.addEventListener('submit',event=>{
        event.preventDefault();
        const input=event.currentTarget.querySelector('input[name="apiKey"]');
        const apiKey=String(input?.value||'').trim();
        if(input)input.value='';
        loadComposio('set_api_key',apiKey);
      });
    }
  }


  function stopComposioPolling(){
    if(composioPollTimer){clearTimeout(composioPollTimer);composioPollTimer=null;}
    state.composio={...state.composio,polling:false};
  }

  function scheduleComposioPoll(){
    if(destroyed||state.composio.resumed||composioPollCount>=60){stopComposioPolling();return;}
    state.composio={...state.composio,polling:true};
    composioPollTimer=setTimeout(async()=>{
      composioPollCount+=1;
      const result=await composioAdminRequest(fetchImpl,{action:'status'});
      if(destroyed)return;
      if(result?.ok!==false&&result?.ready===true){
        stopComposioPolling();
        const resumed=await composioAdminRequest(fetchImpl,{action:'resume'});
        if(destroyed)return;
        state.composio={loading:false,data:resumed,error:resumed?.ok===false?(resumed.error||resumed.detail||'COMPOSIO_RESUME_FAILED'):null,polling:false,resumed:resumed?.ok!==false};
        render();
        return;
      }
      state.composio={...state.composio,loading:false,data:result?.ok===false?state.composio.data:result,error:result?.ok===false?(result.error||null):null,polling:true};
      render();
      scheduleComposioPoll();
    },5000);
  }

  async function loadComposio(action='status',apiKey=''){
    state.composio={...state.composio,loading:true,error:null};
    render();
    const result=await composioAdminRequest(fetchImpl,{action,apiKey});
    if(destroyed)return;
    if(result?.ok===false){
      state.composio={loading:false,data:state.composio.data,error:result.error||result.detail||'COMPOSIO_CONFIG_FAILED'};
      render();
      return;
    }
    state.composio={loading:false,data:result,error:null};
    render();
    if(action==='create_link'&&result.redirect_url){
      globalThis.open?.(result.redirect_url,'_blank','noopener,noreferrer');
      stopComposioPolling();
      composioPollCount=0;
      state.composio={...state.composio,polling:true,resumed:false};
      render();
      scheduleComposioPoll();
    }
  }

  async function refresh(){
    root.innerHTML='<div class="poc-empty">Beveiligde Powerhouse-data laden…</div>';
    const result=await adminRuntimeEvidence(fetchImpl);
    if(destroyed)return;
    if(result.status!=='ready'){securedRuntime=null;accessState(root,result.status,()=>openAdminLogin());return;}
    securedRuntime=result.runtime;render();
  }

  const onAuth=()=>refresh();
  globalThis.netlifyIdentity?.on?.('login',onAuth);
  globalThis.netlifyIdentity?.on?.('logout',onAuth);
  refresh();
  return {render:refresh,destroy:()=>{destroyed=true;stopComposioPolling();globalThis.netlifyIdentity?.off?.('login',onAuth);globalThis.netlifyIdentity?.off?.('logout',onAuth);}};
}
