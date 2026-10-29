import { ensureIdentityWidget } from '../portal-state.js';

// Owner-only client for the existing canonical website/CRO authorities.
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=(value,fallback='—')=>value===null||value===undefined?fallback:new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(value);
const date=value=>{if(!value)return '—';const t=Date.parse(value);return Number.isFinite(t)?new Intl.DateTimeFormat('nl-NL',{dateStyle:'short'}).format(new Date(t)):'—';};
const money=value=>value===null||value===undefined?'—':new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
const css='.cro-od{font:inherit;color:#18233e}.cro-od h3{margin:.15rem 0 .65rem}.cro-od p{line-height:1.5}.cro-od .od-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin:1rem 0}.cro-od .od-card{border:1px solid #dae3f1;background:#fff;padding:1rem;border-radius:13px}.cro-od .od-card small{display:block;color:#536278}.cro-od .od-card strong{font-size:1.6rem;display:block;margin:.35rem 0}.cro-od .od-note{background:#edf3ff;padding:.85rem 1rem;border-radius:10px}.cro-od .od-warn{border-left:4px solid #bd7114;background:#fff7e6;padding:.8rem;margin:.75rem 0}.cro-od .od-controls{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.cro-od input,.cro-od select{font:inherit;border:1px solid #b6c7df;border-radius:8px;padding:.6rem;max-width:100%;background:white;color:#18233e}.cro-od table{width:100%;border-collapse:collapse;font-size:.9rem}.cro-od th,.cro-od td{text-align:left;border-bottom:1px solid #dce5ef;vertical-align:top;padding:.65rem .45rem}.cro-od th{white-space:nowrap}.cro-od .od-scroll{overflow-x:auto}.cro-od details{max-width:440px}.cro-od summary{cursor:pointer}.cro-od code{white-space:pre-wrap;overflow-wrap:anywhere}.cro-od .od-actions{display:flex;gap:.5rem;flex-wrap:wrap}.cro-od button{cursor:pointer;border:1px solid #8eaad0;border-radius:8px;padding:.55rem .8rem;color:#153f7a;background:#eef5ff}.cro-od .od-status{font-size:.8rem;font-weight:700}.cro-od .od-foot{font-size:.85rem;color:#56657c}';
function badge(value){
  const v=String(value||'UNKNOWN');
  return '<span class="od-status">'+esc(v.replace(/_/g,' '))+'</span>';
}
function field(label,val){return '<article class="od-card"><small>'+esc(label)+'</small><strong>'+esc(val)+'</strong></article>';}
function rawDetails(label,data){
  if(data===undefined||data===null)return '';
  const formatted=JSON.stringify(data,null,2).slice(0,1800);
  return '<details><summary>'+esc(label)+'</summary><code>'+esc(formatted)+'</code></details>';
}
function experimentRows(rows){
  return rows.map(r=>'<tr>'+
    '<td><strong>'+esc(r.id||'—')+'</strong><br><small>'+esc(r.pagina||r.onderdeel||'Pagina onbekend')+'</small></td>'+
    '<td>'+esc(r.hypothesis||'Geen hypothese vastgelegd')+'<br><small>Controle: '+esc(r.controle||'—')+' · Variant: '+esc(r.variant||'—')+'</small>'+
    rawDetails('Basislijn',r.baseline)+rawDetails('Resultaat',r.result)+'</td>'+
    '<td>'+badge(r.status)+'<br><small>Vanaf '+esc(date(r.start))+'</small></td>'+
    '<td>'+esc(r.metric||'—')+'<br><small>Treatment '+esc(fmt(r.treatment))+' / holdout '+esc(fmt(r.holdout))+' · minimaal '+esc(fmt(r.minSample))+'</small></td>'+
    '<td>'+badge(r.causalStatus||'NIET BEOORDEELD')+'<br><small>'+esc(r.readinessReason||'')+'</small></td>'+
    '<td>'+esc(r.advice||r.decision||'Nog geen gecontroleerd besluit')+'<br><small>Omzetbewijs: '+esc(money(r.realizedRevenue))+'</small></td>'+
    '</tr>').join('');
}
function render(container,data){
  const source=data?.sources||{};
  const website=data?.website;
  const experiments=Array.isArray(data?.experiments)?data.experiments:null;
  const flags=Array.isArray(data?.quality?.flags)?data.quality.flags:[];
  const cardData=website
    ? field('Geregistreerde paginabezoeken (30 dagen)',fmt(website.pageViews))+
      field('Geregistreerde CTA-klikken (30 dagen)',fmt(website.ctaClicks))+
      field('Gekwalificeerde leads met bewijs',fmt(website.qualifiedLeads))+
      field('Gerealiseerde orders met bewijs',fmt(website.wonOrders))+
      field('Toegerekende omzet met bewijs',money(website.revenueEur))
    :field('Website-meetgegevens','Bron niet beschikbaar');
  container.innerHTML='<section class="cro-od" aria-labelledby="croOtherDataTitle">'+
    '<style>'+css+'</style>'+
    '<div class="od-actions"><button type="button" data-cro-reload>Bronnen vernieuwen</button><a href="https://www.bedrijfsgeheugen.nl/portal-v2/?page=powerhouse-control-center" data-open-page="powerhouse-control-center">Powerhouse Control Center</a></div>'+
    '<h3 id="croOtherDataTitle">Websitegegevens & CRO-experimenten</h3>'+
    '<p class="od-note">Eén beveiligde, alleen-lezen projectie van de bestaande Powerhouse- en Supabase-bronnen. Websitegedrag, experimenten, hypotheses, steekproeven, resultaten en besluiten blijven van elkaar onderscheiden. Geen verzonnen uplift of conversie.</p>'+
    '<p class="od-foot">Bronstatus website: '+badge(source.website?.status)+' · experimenten: '+badge(source.experiments?.status)+' · beleid: '+badge(source.policies?.status)+' · laatste website-update '+esc(date(source.website?.lastObservedAt))+' · laatst gecontroleerd '+esc(date(data.generatedAt))+'</p>'+
    '<div class="od-grid">'+cardData+'</div>'+
    (flags.length?'<div class="od-warn" role="status"><strong>Meetkwaliteit nog niet volledig bewezen</strong><p>'+esc(flags.join(' · '))+'</p><small>'+esc(data.quality?.message||'')+'</small></div>':'')+
    '<section class="od-card"><h3>CRO-experimentregister</h3>'+
    (experiments?'<p>'+fmt(experiments.length)+' experimenten uit de canonieke Powerhouse-bron. Ook geplande, onvolledige en afgekeurde proeven blijven zichtbaar.</p>':'<p>De experimentbron is niet beschikbaar; conclusies blijven open.</p>')+
    '<div class="od-controls"><label>Zoek experiment <input data-cro-search type="search" placeholder="Hypothese, pagina, experiment-ID"></label><label>Status <select data-cro-status><option value="">Alle statussen</option>'+
    (experiments?[...new Set(experiments.map(x=>x.status).filter(Boolean))].sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join(''):'')+
    '</select></label></div>'+
    '<div class="od-scroll"><table><thead><tr><th>Experiment / pagina</th><th>Hypothese en varianten</th><th>Status</th><th>Meetpunt / steekproef</th><th>Causaal bewijs</th><th>Besluit / effect</th></tr></thead><tbody data-cro-rows>'+
    (experiments?experimentRows(experiments):'<tr><td colspan="6">Geen verifieerbare brondata.</td></tr>')+
    '</tbody></table></div></section>'+
    '<p class="od-foot">Beperkingen: bots, toestemming, meetdekking en definitieve orderattributie vereisen onafhankelijke controles. Waarden uit website-events zijn niet automatisch echte bezoekers, leads of omzet. Alleen gemachtigde beheerders krijgen dit globale websiteoverzicht.</p>'+
    '</section>';
  const search=container.querySelector('[data-cro-search]'),status=container.querySelector('[data-cro-status]'),body=container.querySelector('[data-cro-rows]');
  const filter=()=>{
    if(!experiments)return;
    const q=String(search.value||'').trim().toLocaleLowerCase('nl');
    const s=String(status.value||'');
    const filtered=experiments.filter(r=>(!s||r.status===s)&&(!q||[r.id,r.hypothesis,r.pagina,r.onderdeel,r.metric].join(' ').toLocaleLowerCase('nl').includes(q)));
    body.innerHTML=filtered.length?experimentRows(filtered):'<tr><td colspan="6">Geen experimenten voor deze filters.</td></tr>';
  };
  search?.addEventListener('input',filter);status?.addEventListener('change',filter);
}

export function mountOtherData(container,{fetchImpl=globalThis.fetch}={}){
  let cancelled=false;
  async function load(){
    container.innerHTML='<section class="cro-od"><p>Beveiligde website- en CRO-data worden gecontroleerd…</p></section>';
    let user=globalThis.netlifyIdentity?.currentUser?.()||null;
    if(!user){
      const identity=await ensureIdentityWidget();
      user=identity?.currentUser?.()||null;
    }
    if(!user){
      container.innerHTML='<section class="cro-od"><h3>Andere data · toegang vereist</h3><p>Log in als Powerhouse-beheerder om de website- en CRO-gegevens te bekijken.</p><button type="button" data-cro-login>Inloggen</button></section>';
      container.querySelector('[data-cro-login]')?.addEventListener('click',async()=>{const identity=await ensureIdentityWidget();identity?.open?.('login');});
      return;
    }
    let token='';try{token=await user.jwt?.()||'';}catch{}
    if(!token){container.textContent='Identiteitsbewijs niet beschikbaar.';return;}
    try{
      const response=await fetchImpl('/api/powerhouse-cro-other-data',{
        headers:{accept:'application/json',authorization:'Bearer '+token},
        credentials:'same-origin',cache:'no-store'
      });
      if(!cancelled&&!container.isConnected)return;
      if(response.status===403){container.textContent='Alleen de Powerhouse-beheerder heeft toegang tot de globale website- en experimentgegevens.';return;}
      if(response.status===401){container.textContent='De beheerderssessie is verlopen. Log opnieuw in.';return;}
      if(!response.ok){container.textContent='De gecontroleerde readback is niet beschikbaar (HTTP '+response.status+'). Er worden geen statistieken verzonnen.';return;}
      const data=await response.json();
      if(!cancelled){render(container,data);container.querySelector('[data-cro-reload]')?.addEventListener('click',load);}
    }catch{
      if(!cancelled)container.textContent='De broncontrole kon niet worden afgerond. Meetresultaten blijven onbewezen.';
    }
  }
  void load();
  return {destroy(){cancelled=true;},refresh:load};
}
