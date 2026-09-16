import {buildExecutiveProjection} from './executive-projection.js';
import {mountOperatingSystemPage,OPERATING_SYSTEM_PAGES} from './operating-system-ui.js';
import {ensureOperatingSystemStyles} from './styles.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pct=value=>value==null?'—':`${Math.round(value)}%`;
const list=(title,items)=>`<section class="os-card"><h3>${esc(title)}</h3>${items.length?`<ol>${items.map(item=>`<li><strong>${esc(item.title||item.label||item.id)}</strong><small>${esc(item.explanation||item.summary||'')}</small><span class="os-evidence">${esc(item.evidence_health?.status||'unavailable')} · ${Math.round((item.evidence_health?.confidence||0)*100)}%</span></li>`).join('')}</ol>`:'<p class="os-empty">Nog geen bewezen gegevens.</p>'}</section>`;
const LABELS=Object.freeze({'impact-engine':'€ Impact','scenario-simulator':'Scenario’s','next-best-actions':'Besluiten & acties','monitoring-learning':'Monitoring & leren','evidence-health':'Data & bewijs','capability-graph':'Capability graph'});

export function executiveCockpitMarkup(model){
 if(!model.available)return '<section class="os-executive" data-os-status="unavailable"><div class="os-head"><div><small>Powerhouse</small><h2>Executive Cockpit</h2></div><span>Geen bewezen live projectie</span></div><p>Er is nog geen tenant-scoped executive projection beschikbaar. Het portaal toont daarom geen afgeleide claims.</p></section>';
 const tabs=OPERATING_SYSTEM_PAGES.map(page=>`<button type="button" data-os-page="${page}" aria-pressed="false">${esc(LABELS[page]||page)}</button>`).join('');
 return `<section class="os-executive" data-os-status="live"><div class="os-head"><div><small>Powerhouse · ${esc(model.role)}</small><h2>Executive Cockpit</h2></div><span>${model.evidence_health.healthy}/${model.evidence_health.total} bronnen gezond</span></div><div class="os-metrics"><article><small>Bedrijfsgezondheid</small><b>${pct(model.health_score)}</b></article><article><small>Strategievoortgang</small><b>${pct(model.strategy_progress)}</b></article><article><small>Open risico's</small><b>${model.risks.length}</b></article><article><small>Topacties</small><b>${model.next_best_actions.length}</b></article></div><div class="os-grid">${list('Wat veranderde?',model.changes)}${list('Toprisico’s',model.risks)}${list('Kansen',model.opportunities)}${list('Next Best Actions',model.next_best_actions)}${list('Vooruitblik',model.forecasts)}${list('Gerealiseerde outcomes',model.outcomes)}</div><section class="os-health"><h3>Data & bewijs</h3><p>${model.evidence_health.stale} verouderd · ${model.evidence_health.low_confidence} lage confidence · ${model.evidence_health.unavailable} onvolledig</p></section><nav class="os-module-tabs" aria-label="Powerhouse modules">${tabs}</nav><div class="os-module-detail" aria-live="polite"></div></section>`;
}

export function mountExecutiveCockpit(root,state,{tenantId=state?.tenant_id||state?.powerhouse?.tenant_id,role=state?.portal?.role||'directie',now=Date.now()}={}){
 const main=root?.querySelector?.('.main');if(!main||!tenantId)return false;
 ensureOperatingSystemStyles(root.ownerDocument||document);
 const model=buildExecutiveProjection(state,{tenantId,role,now});
 let host=main.querySelector('.os-executive-host');
 if(!host){host=(root.ownerDocument||document).createElement('div');host.className='os-executive-host';main.insertBefore(host,main.firstChild);}
 host.innerHTML=executiveCockpitMarkup(model);
 const detail=host.querySelector('.os-module-detail'),domainState=globalThis.__BG_PORTAL_DOMAIN_STATE__;
 host.querySelectorAll('[data-os-page]').forEach(btn=>btn.addEventListener('click',()=>{
  host.querySelectorAll('[data-os-page]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));
  mountOperatingSystemPage(detail,{pageId:btn.dataset.osPage,domainState});
 }));
 return true;
}
