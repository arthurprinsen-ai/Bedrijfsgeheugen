const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const num=value=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:0}).format(Number(value)||0);
const pct=value=>value==null?'—':`${Number(value).toFixed(1)}%`;
const sec=value=>{
  const n=Number(value); if(!Number.isFinite(n)||n<0)return '—';
  if(n<60)return `${Math.round(n)}s`;
  if(n<3600)return `${Math.round(n/60)}m`;
  if(n<86400)return `${(n/3600).toFixed(1)}u`;
  return `${(n/86400).toFixed(1)}d`;
};
const stateClass=value=>{
  const v=String(value||'').toUpperCase();
  if(v==='FULFILLED')return 'ok';
  if(['BREACHED','FAILED','CANCELLED'].includes(v))return 'bad';
  return 'active';
};

export function controlPlaneCockpitMarkup(data={}){
  const obligations=Array.isArray(data.obligations)?data.obligations:[];
  const metrics=data.metrics||{};
  const rows=obligations.slice(0,20).map(item=>`<article class="cp-obligation" data-state="${esc(stateClass(item.current_state))}">
    <div class="cp-obligation-head"><div><small>${esc(item.obligation_key||item.obligation_id)}</small><h4>${esc(item.requested_goal||item.obligation_key||'Obligation')}</h4></div><span>${esc(item.current_state||'UNKNOWN')}</span></div>
    <dl>
      <div><dt>Bewijs</dt><dd>${num(item.evidence_count)} groen/records · ${num(item.red_evidence_count)} rood</dd></div>
      <div><dt>Blokkade</dt><dd>${esc(item.blocker||'Geen')}</dd></div>
      <div><dt>Volgende actie</dt><dd>${esc(item.next_action||'—')}</dd></div>
      <div><dt>Resultaat</dt><dd>${esc(item.actual_result||'Nog niet bewezen')}</dd></div>
    </dl>
    <footer><span>Retries ${num(item.retry_count)}</span><span>Reconciliations ${num(item.reconciliation_jobs)}</span><span>${item.outcome_verified?'Outcome bewezen':'Outcome open'}</span><span>${item.migration_readback_verified?'DB readback ✓':'DB readback —'}</span></footer>
  </article>`).join('');

  return `<section class="cp-admin-cockpit" data-bg-component="powerhouse-control-plane-cockpit">
    <div class="cp-head"><div><small>Intern · Powerhouse control plane</small><h2>Obligations</h2><p>Één read-only projectie van de canonical Brain-state, bewijs, recovery en outcome.</p></div><span>${esc(data.generatedAt||'')}</span></div>
    <div class="cp-metrics">
      <article><small>Fulfilled</small><b>${num(metrics.obligations_fulfilled)}</b><span>van ${num(metrics.obligations_total)}</span></article>
      <article><small>First time right</small><b>${pct(metrics.first_time_right_pct)}</b><span>${num(metrics.first_time_right_count)} obligations</span></article>
      <article><small>Retries</small><b>${num(metrics.retries_total)}</b><span>${num(metrics.escalations_total)} escalaties</span></article>
      <article><small>False-success risk</small><b>${num(metrics.false_success_risk_count)}</b><span>${num(metrics.human_intervention_count)} human interventions</span></article>
      <article><small>Mediaan naar terminal</small><b>${sec(metrics.median_time_to_terminal_seconds)}</b><span>P90 ${sec(metrics.p90_time_to_terminal_seconds)}</span></article>
    </div>
    <div class="cp-obligations">${rows||'<p class="cp-empty">Nog geen obligations in de canonical cockpit.</p>'}</div>
  </section>`;
}

export async function mountControlPlaneCockpit(root=document,{fetchImpl=globalThis.fetch}={}){
  if(!root?.querySelector||typeof fetchImpl!=='function')return null;
  const main=root.querySelector('.main'); if(!main)return null;
  const response=await fetchImpl('/api/powerhouse-control-plane',{credentials:'same-origin',headers:{accept:'application/json'}});
  if(response.status===401||response.status===403||response.status===404)return null;
  if(!response.ok)throw new Error(`CONTROL_PLANE_COCKPIT_${response.status}`);
  const data=await response.json();
  let host=main.querySelector('[data-bg-component="powerhouse-control-plane-cockpit"]');
  if(!host){host=(root.ownerDocument||document).createElement('div');host.dataset.bgControlPlaneHost='true';main.appendChild(host);}
  host.innerHTML=controlPlaneCockpitMarkup(data);
  return Object.freeze({host,data});
}
