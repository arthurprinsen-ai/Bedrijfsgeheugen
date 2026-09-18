import {buildExecutiveProjection} from './executive-projection.js';
import {mountOperatingSystemPage,OPERATING_SYSTEM_PAGES} from './operating-system-ui.js';
import {ensureOperatingSystemStyles} from './styles.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pct=value=>value==null?'—':`${Math.round(value)}%`;
const list=(title,items)=>`<section class="os-card"><h3>${esc(title)}</h3>${items.length?`<ol>${items.map(item=>`<li><strong>${esc(item.title||item.label||item.id)}</strong><small>${esc(item.explanation||item.summary||item.next_action||'')}</small><span class="os-evidence">${esc(item.evidence_health?.status||'unavailable')} · ${Math.round((item.evidence_health?.confidence||0)*100)}%</span></li>`).join('')}</ol>`:'<p class="os-empty">Nog geen bewezen gegevens.</p>'}</section>`;
const LABELS=Object.freeze({'impact-engine':'€ Impact','scenario-simulator':'Scenario’s','next-best-actions':'Besluiten & acties','monitoring-learning':'Monitoring & leren','evidence-health':'Data & bewijs','capability-graph':'Capability graph'});
const attentionCard=item=>`<article class="os-attention-card"><div class="os-attention-top"><span>${esc(item.attention_reason||'Aandacht')}</span><span>${esc(item.owner||item.accountable_owner||'')}</span></div><h3>${esc(item.title||item.label||item.id||'Aandachtspunt')}</h3><p>${esc(item.explanation||item.summary||item.reason||item.next_action||'')}</p>${item.deadline||item.due_at?`<small>Uiterlijk: ${esc(item.deadline||item.due_at)}</small>`:''}</article>`;

export function executiveCockpitMarkup(model){
 if(!model.available)return '<section class="os-executive" data-os-status="unavailable"><div class="os-head"><div><small>Powerhouse</small><h2>Executive Cockpit</h2></div><span>Geen bewezen live projectie</span></div><p>Er is nog geen tenant-scoped executive projection beschikbaar. Het portaal toont daarom geen afgeleide claims.</p></section>';
 const tabs=OPERATING_SYSTEM_PAGES.map(page=>`<button type="button" data-os-page="${page}" aria-pressed="false">${esc(LABELS[page]||page)}</button>`).join('');
 const attention=model.attention||[];
 return `<section class="os-executive" data-os-status="live">
  <div class="os-head"><div><small>Bedrijfsgeheugen · ${esc(model.role_label||model.role)}</small><h2>Waar moet de directie vandaag op sturen?</h2><p class="os-subtitle">Alleen de belangrijkste afwijkingen, besluiten en kansen — afgeleid uit de canonieke bedrijfsdata.</p></div><span>${model.evidence_health.healthy}/${model.evidence_health.total} bronnen gezond</span></div>
  <section class="os-attention" aria-label="Belangrijkste aandachtspunten">${attention.length?attention.map(attentionCard).join(''):'<article class="os-attention-empty"><strong>Geen urgente bewezen aandachtspunten</strong><span>Detail blijft beschikbaar in risico’s, kansen en monitoring.</span></article>'}</section>
  <div class="os-metrics"><article><small>Bedrijfsgezondheid</small><b>${pct(model.health_score)}</b></article><article><small>Strategievoortgang</small><b>${pct(model.strategy_progress)}</b></article><article><small>Besluiten nodig</small><b>${model.decision_queue.length}</b></article><article><small>Open toprisico’s</small><b>${model.risks.length}</b></article></div>
  <div class="os-executive-scan"><section><h3>Nu beslissen / uitvoeren</h3>${model.next_best_actions.length?`<ol>${model.next_best_actions.map(item=>`<li><strong>${esc(item.title||item.label||item.id)}</strong><small>${esc(item.next_action||item.explanation||item.summary||'')}</small></li>`).join('')}</ol>`:'<p class="os-empty">Geen bewezen acties.</p>'}</section><section><h3>Vooruitkijken</h3>${model.forecasts.length?`<ol>${model.forecasts.slice(0,4).map(item=>`<li><strong>${esc(item.title||item.label||item.id)}</strong><small>${esc(item.explanation||item.summary||'')}</small></li>`).join('')}</ol>`:'<p class="os-empty">Geen bewezen forecasts.</p>'}</section></div>
  <details class="os-detail"><summary>Verdieping: risico’s, kansen, veranderingen en outcomes</summary><div class="os-grid">${list('Toprisico’s',model.risks)}${list('Kansen',model.opportunities)}${list('Wat veranderde?',model.changes)}${list('Gerealiseerde outcomes',model.outcomes)}</div></details>
  <section class="os-health"><h3>Data & bewijs</h3><p>${model.evidence_health.stale} verouderd · ${model.evidence_health.low_confidence} lage confidence · ${model.evidence_health.unavailable} onvolledig</p></section>
  <nav class="os-module-tabs" aria-label="Powerhouse modules">${tabs}</nav><div class="os-module-detail" aria-live="polite"></div>
 </section>`;
}

function openModule(host,pageId,domainState){
 if(!OPERATING_SYSTEM_PAGES.includes(pageId))return false;
 const detail=host?.querySelector?.('.os-module-detail');if(!detail)return false;
 host.querySelectorAll('[data-os-page]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.osPage===pageId)));
 mountOperatingSystemPage(detail,{pageId,domainState});
 detail.scrollIntoView?.({block:'nearest'});
 return true;
}

export function mountExecutiveCockpit(root,state,{tenantId=state?.tenant_id||state?.powerhouse?.tenant_id,role=state?.portal?.role||state?.portal?.executiveRole||'directie',now=Date.now()}={}){
 const main=root?.querySelector?.('.main');if(!main||!tenantId)return false;
 const doc=root.ownerDocument||document;ensureOperatingSystemStyles(doc);
 const model=buildExecutiveProjection(state,{tenantId,role,now});
 let host=main.querySelector('.os-executive-host');
 if(!host){host=doc.createElement('div');host.className='os-executive-host';main.insertBefore(host,main.firstChild);}
 host.innerHTML=executiveCockpitMarkup(model);
 const domainState=globalThis.__BG_PORTAL_DOMAIN_STATE__;
 host.querySelectorAll('[data-os-page]').forEach(btn=>btn.addEventListener('click',()=>openModule(host,btn.dataset.osPage,domainState)));
 if(!doc.__bgOsRouteBound){
  doc.__bgOsRouteBound=true;
  doc.addEventListener('bg:open-os-page',event=>{
   const currentHost=doc.querySelector('.os-executive-host');
   openModule(currentHost,event.detail?.pageId,globalThis.__BG_PORTAL_DOMAIN_STATE__);
  });
 }
 return true;
}
