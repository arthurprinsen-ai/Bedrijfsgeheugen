import {buildExecutiveProjection} from './executive-projection.js';
import {mountOperatingSystemPage,OPERATING_SYSTEM_PAGES} from './operating-system-ui.js';
import {ensureOperatingSystemStyles} from './styles.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const pct=value=>value==null?'—':`${Math.round(value)}%`;
const list=(title,items)=>`<section class="os-card"><h3>${esc(title)}</h3>${items.length?`<ol>${items.map(item=>`<li><strong>${esc(item.title||item.label||item.id)}</strong><small>${esc(item.explanation||item.summary||item.next_action||'')}</small><span class="os-evidence">${esc(item.evidence_health?.status||'unavailable')} · ${Math.round((item.evidence_health?.confidence||0)*100)}%</span></li>`).join('')}</ol>`:'<p class="os-empty">Nog geen bewezen gegevens.</p>'}</section>`;
const LABELS=Object.freeze({'impact-engine':'€ Impact','scenario-simulator':'Scenario’s','next-best-actions':'Besluiten & acties','monitoring-learning':'Monitoring & leren','evidence-health':'Data & bewijs','capability-graph':'Capability graph'});
const attentionCard=item=>`<article class="os-attention-card"><div class="os-attention-top"><span>${esc(item.attention_reason||'Aandacht')}</span><span>${esc(item.owner||item.accountable_owner||'')}</span></div><h3>${esc(item.title||item.label||item.id||'Aandachtspunt')}</h3><p>${esc(item.explanation||item.summary||item.reason||item.next_action||'')}</p>${item.deadline||item.due_at?`<small>Uiterlijk: ${esc(item.deadline||item.due_at)}</small>`:''}</article>`;
const problemCard=item=>`<article class="os-attention-card os-problem-card" data-problem-id="${esc(item.problem_id)}">
 <div class="os-attention-top"><span>${esc(item.problem_id)}</span><span>${esc(item.impact_label)}</span></div>
 <h3>${esc(item.title||item.problem_id)}</h3>
 <p>${esc(item.explanation||item.summary||item.description||'')}</p>
 <p><strong>Impact:</strong> ${item.impact_value==null?'nog te valideren':esc(item.impact_value)}</p>
 <p><strong>Eerst doen:</strong> ${esc(item.actions?.[0]||item.next_action||'bewijs verzamelen en valideren')}</p>
 <details class="os-evidence-drawer"><summary>Waarom zegt Powerhouse dit?</summary>
  <p><strong>Bewijsstatus:</strong> ${esc(item.evidence_health?.status||'unavailable')} · ${Math.round((item.confidence||item.evidence_health?.confidence||0)*100)}%</p>
  <p><strong>Bronnen:</strong> ${item.source_refs?.length?item.source_refs.map(esc).join(' · '):'nog geen bronreferenties beschikbaar'}</p>
  <p><strong>Root causes:</strong> ${item.root_causes?.length?item.root_causes.map(esc).join(' · '):'nog te valideren'}</p>
  <p><strong>Capability:</strong> ${item.capabilities?.length?item.capabilities.map(esc).join(' · '):'nog niet gekoppeld'}</p>
  <p><strong>Outcome:</strong> ${item.outcome_metrics?.length?item.outcome_metrics.map(esc).join(' · '):'nog geen meetlat gekoppeld'}</p>
 </details>
</article>`;

export function executiveCockpitMarkup(model){
 if(!model.available)return `<section class="os-executive os-executive-unavailable" data-os-status="unavailable">
  <div class="os-head"><div><small>Bedrijfsgeheugen · ${esc(model.role_label||model.role||'Directie')}</small><h2>Wat moet ik vandaag weten, beslissen en doen?</h2><p class="os-subtitle">De cockpit blijft de startpagina. Cijfers en adviezen verschijnen pas zodra ze tenant-scoped en bewezen zijn.</p></div><span>Data wordt geladen</span></div>
  <div class="os-mobile-decision-flow" aria-label="Executive dagstart">
    <article><small>1 · Weten</small><strong>Belangrijkste afwijkingen</strong><span>Nog geen bewezen aandachtspunten beschikbaar.</span></article>
    <article><small>2 · Beslissen</small><strong>Besluiten die vandaag nodig zijn</strong><span>Nog geen bewezen besluitvraag beschikbaar.</span></article>
    <article><small>3 · Doen</small><strong>Eerstvolgende actie</strong><span>Nog geen bewezen actie beschikbaar.</span></article>
  </div>
 </section>`;
 const tabs=OPERATING_SYSTEM_PAGES.map(page=>`<button type="button" data-os-page="${page}" aria-pressed="false">${esc(LABELS[page]||page)}</button>`).join('');
 const attention=model.attention||[];
 const problems=model.problems||[];
 return `<section class="os-executive" data-os-status="live">
  <div class="os-head"><div><small>Bedrijfsgeheugen · ${esc(model.role_label||model.role)}</small><h2>Waar moet de directie vandaag op sturen?</h2><p class="os-subtitle">Alleen de belangrijkste afwijkingen, besluiten en kansen — afgeleid uit de canonieke bedrijfsdata.</p></div><span>${model.evidence_health.healthy}/${model.evidence_health.total} bronnen gezond</span></div>
  <div class="os-mobile-decision-flow" aria-label="Executive dagstart">
    <article><small>1 · Weten</small><strong>${attention[0]?.title?esc(attention[0].title):'Geen urgente afwijking'}</strong><span>${attention[0]?esc(attention[0].explanation||attention[0].summary||attention[0].reason||''):'Geen bewezen aandachtspunt dat nu actie vraagt.'}</span></article>
    <article><small>2 · Beslissen</small><strong>${model.decision_queue[0]?.title?esc(model.decision_queue[0].title):'Geen besluit nodig'}</strong><span>${model.decision_queue[0]?esc(model.decision_queue[0].next_action||model.decision_queue[0].explanation||model.decision_queue[0].summary||''):'Geen bewezen besluitvraag voor vandaag.'}</span></article>
    <article><small>3 · Doen</small><strong>${model.next_best_actions[0]?.title?esc(model.next_best_actions[0].title):'Geen actie met bewijs'}</strong><span>${model.next_best_actions[0]?esc(model.next_best_actions[0].next_action||model.next_best_actions[0].explanation||model.next_best_actions[0].summary||''):'Zodra bewijs beschikbaar is verschijnt hier de eerstvolgende actie.'}</span></article>
  </div>
  <section class="os-attention" aria-label="Wat vraagt vandaag aandacht?">
  <div class="os-section-heading"><h3>Wat vraagt vandaag aandacht?</h3><p>Maximaal vijf geprioriteerde problemen uit dezelfde PH-Pxxx waarheid die ook Problem Radar, content en capabilities gebruiken.</p></div>
  ${problems.length?problems.map(problemCard).join(''):(attention.length?attention.map(attentionCard).join(''):'<article class="os-attention-empty"><strong>Geen gevalideerde problemen</strong><span>Externe signalen blijven hypotheses totdat intern bewijs beschikbaar is.</span></article>')}
 </section>
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
 const main=root?.querySelector?.('.main');if(!main)return false;
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
