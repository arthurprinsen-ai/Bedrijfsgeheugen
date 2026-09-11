import {mapRuntimeProjection} from './runtime-evidence.js';
import {buildCompanyCockpit} from './company-cockpit.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const eur=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const pct=value=>`${Math.round((Number(value)||0)*100)}%`;
const safeText=value=>esc(value||'—');
const randomKey=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function sanitizePortalEvent(input={}){
  const output={};
  for(const key of ['event','decisionId','actionId','page']) if(input[key]!=null&&String(input[key]).trim()) output[key]=String(input[key]).trim().slice(0,160);
  return output;
}

function priorityCard(item){
  const pending=item.status==='PROPOSED';
  return `<article class="company-decision-card" data-decision-id="${esc(item.id)}">
    <div class="company-decision-head"><span class="company-bucket">${esc(item.portfolioBucket||'')}</span><strong>${safeText(item.title)}</strong><span>#${esc(item.rank??'—')}</span></div>
    <p>${safeText((item.reasons||[]).join(' · ')||item.nextAction)}</p>
    <div class="company-decision-grid">
      <span><small>Eigenaar</small><b>${safeText(item.owner)}</b></span>
      <span><small>Vertrouwen</small><b>${pct(item.confidence)}</b></span>
      <span><small>Investering</small><b>${eur(item.investment)}</b></span>
      <span><small>Verwachte waarde</small><b>${eur(item.expectedValue)}</b></span>
      <span><small>Gerealiseerd</small><b>${eur(item.realizedValue)}</b></span>
    </div>
    <div class="company-decision-actions">
      ${pending?`<button type="button" data-company-command="APPROVE" data-decision-id="${esc(item.id)}" data-expected-status="${esc(item.status)}">Goedkeuren</button><button type="button" data-company-command="REJECT" data-decision-id="${esc(item.id)}" data-expected-status="${esc(item.status)}">Afwijzen</button>`:''}
      <button type="button" data-company-command="START" data-decision-id="${esc(item.id)}" data-expected-status="${esc(item.status)}">Starten</button>
    </div>
  </article>`;
}

export function renderCompanyCockpitHtml(runtime={}){
  const cockpit=buildCompanyCockpit(runtime);
  const priorities=cockpit.sections.find(x=>x.key==='priorities')?.items||[];
  const approvals=cockpit.sections.find(x=>x.key==='approvals')?.items||[];
  const economics=cockpit.sections.find(x=>x.key==='economics')?.data||{};
  const blocked=cockpit.sections.find(x=>x.key==='blocked')?.items||[];
  const audit=cockpit.sections.find(x=>x.key==='audit')?.items||[];
  return `<div class="company-cockpit-head"><div><h2>Wat moet eerst</h2><p>Één prioriteitenlijst uit Brein & Powerhouse — met bewijs, goedkeuring, kosten en gerealiseerde waarde.</p></div><span class="company-live">Brain runtime</span></div>
    <div class="company-economics">
      <span><small>Verwachte waarde</small><b>${eur(economics.expectedValue)}</b></span>
      <span><small>Werkelijke kosten</small><b>${eur(economics.actualCost)}</b></span>
      <span><small>Gerealiseerde waarde</small><b>${eur(economics.realizedValue)}</b></span>
      <span><small>Gerealiseerde winst</small><b>${eur(economics.realizedProfit)}</b></span>
    </div>
    <div class="company-priorities">${priorities.length?priorities.map(priorityCard).join(''):'<p class="company-empty">Nog geen bewezen bedrijfsprioriteiten. Vul bedrijfsdata aan of wacht op Brain-evidence.</p>'}</div>
    <details class="company-details"><summary>Goedkeuring nodig (${approvals.length})</summary>${approvals.length?approvals.map(a=>`<p><b>${safeText(a.decisionId)}</b> · ${safeText(a.approval?.state||a.status)} · ${safeText(a.actor)}</p>`).join(''):'<p>Geen open goedkeuringen.</p>'}</details>
    <details class="company-details"><summary>Geblokkeerd (${blocked.length})</summary>${blocked.length?blocked.map(b=>`<p><b>${safeText(b.title)}</b> · ${safeText(b.blockedBy||b.dependencyState)}</p>`).join(''):'<p>Geen geblokkeerde prioriteiten.</p>'}</details>
    <details class="company-details"><summary>Wie deed wat (${audit.length})</summary>${audit.length?audit.slice(0,12).map(e=>`<p><b>${safeText(e.actor)}</b> · ${safeText(e.type||e.status)} · ${safeText(e.owner)} · <time>${safeText(e.occurredAt)}</time></p>`).join(''):'<p>Nog geen audit-events.</p>'}</details>`;
}

export function createDecisionCommandClient({fetchImpl=globalThis.fetch,authHeadersProvider=async()=>({})}={}){
  async function headers(json=false){const auth=await authHeadersProvider();return {...auth,accept:'application/json',...(json?{'content-type':'application/json'}:{})};}
  async function loadProjection(){
    const response=await fetchImpl('/api/brain-operating-loop',{headers:await headers(),credentials:'same-origin'});
    if(!response.ok) throw new Error(`BRAIN_OPERATING_LOOP_${response.status}`);
    return response.json();
  }
  async function command(input){
    const response=await fetchImpl('/api/company-decision',{method:'POST',headers:await headers(true),credentials:'same-origin',body:JSON.stringify({...input,idempotencyKey:input.idempotencyKey||randomKey()})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(body.error||`COMPANY_DECISION_${response.status}`);
    return {result:body,projection:await loadProjection()};
  }
  return Object.freeze({command,loadProjection});
}

export async function sendPortalDecisionEvidence(event,{fetchImpl=globalThis.fetch,authHeadersProvider=async()=>({})}={}){
  const safe=sanitizePortalEvent(event);
  if(!safe.event||!safe.decisionId) return null;
  const token=randomKey();
  const headers=await authHeadersProvider();
  const body={
    type:'Evidence',id:`portal-interaction:${safe.decisionId}:${token}`,subjectId:`decision:${safe.decisionId}`,
    idempotencyKey:`portal-interaction:${safe.decisionId}:${token}`,owner:'portal-v2',actor:'portal-v2',actorType:'system',
    status:'OBSERVED',observedAt:new Date().toISOString(),source:'portal-v2',evidenceIds:[],payload:safe
  };
  const response=await fetchImpl('/api/brain-operating-loop',{method:'POST',headers:{...headers,accept:'application/json','content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)});
  return response.ok?response.json().catch(()=>null):null;
}

export function mountCompanyCockpit({documentRef=globalThis.document,stateClient,fetchImpl=globalThis.fetch}={}){
  if(!documentRef) return null;
  let host=documentRef.getElementById('companyDecisionCockpit');
  if(!host){
    host=documentRef.createElement('section');host.id='companyDecisionCockpit';host.className='card company-cockpit';host.dataset.bgComponent='company-decision-cockpit';
    const anchor=documentRef.querySelector('.lower')||documentRef.querySelector('.activities');
    if(anchor?.parentNode) anchor.parentNode.insertBefore(host,anchor); else documentRef.querySelector('.main')?.appendChild(host);
  }
  const authHeadersProvider=()=>stateClient?.authHeaders?.()||Promise.resolve({});
  const client=createDecisionCommandClient({fetchImpl,authHeadersProvider});
  let projection=null;
  async function refresh(){
    try{projection=await client.loadProjection();host.innerHTML=renderCompanyCockpitHtml(mapRuntimeProjection(projection));host.dataset.status='ready';}
    catch(error){host.innerHTML='<div class="company-cockpit-head"><div><h2>Wat moet eerst</h2><p>De Brain-runtime is nu niet beschikbaar. Er worden geen cijfers gegokt.</p></div></div>';host.dataset.status='error';host.dataset.error=String(error?.message||error);}
    return projection;
  }
  host.addEventListener('click',async event=>{
    const button=event.target?.closest?.('[data-company-command]');if(!button)return;
    button.disabled=true;
    const command=button.dataset.companyCommand,decisionId=button.dataset.decisionId,expectedStatus=button.dataset.expectedStatus||undefined;
    try{
      const result=await client.command({command,decisionId,expectedStatus});projection=result.projection;host.innerHTML=renderCompanyCockpitHtml(mapRuntimeProjection(projection));
      sendPortalDecisionEvidence({event:command.toLowerCase(),decisionId,page:'overzicht'},{fetchImpl,authHeadersProvider}).catch(()=>null);
    }catch(error){button.disabled=false;host.dataset.error=String(error?.message||error);}
  });
  refresh();
  return Object.freeze({host,refresh,getProjection:()=>projection});
}
