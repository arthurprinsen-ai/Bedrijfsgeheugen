const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labelScope=v=>String(v||'').replaceAll('_',' ');
const modeLabel={TRANSPARENT_GLOBAL:'Volledig transparant · wereldwijde routes toegestaan',EU_STORAGE:'Data-opslag binnen EU',EU_ONLY:'EU-only · verwerking en opslag binnen EU',CUSTOM:'Aangepast beleid'};
const statusLabel=s=>s?.policySatisfied?'Binnen gekozen beleid':'Afwijking / blokkade';
function rows(items=[]){return items.map(p=>`<tr><td><b>${esc(p.name)}</b><small>${esc(p.serviceKind)}</small></td><td>${esc(p.customerDataExposure)}</td><td>${esc(labelScope(p.processingScope))}<small>${esc(p.primaryRegion||'regio niet vastgelegd')}</small></td><td>${esc(labelScope(p.storageScope))}</td><td>${esc(labelScope(p.crossBorderTransfer))}</td><td><span class="dsp-badge dsp-${String(p.evidenceStatus||'unknown').toLowerCase()}">${esc(p.evidenceStatus)}</span></td></tr>`).join('')}
function aiRows(items=[]){return items.map(r=>`<tr><td><b>${esc(r.name)}</b><small>${esc(r.useCaseId)}</small></td><td>${esc(r.provider)}<small>${esc(r.modelId)}</small></td><td>${esc(labelScope(r.processingScope||'UNKNOWN'))}</td><td>${esc(labelScope(r.crossBorderTransfer||'UNKNOWN'))}</td><td>${esc(r.trainingUse||'UNKNOWN')}</td></tr>`).join('')}
class DataSovereigntyPanel extends HTMLElement{
 constructor(){super();this.scope='customer';this.snapshot=null}
 connectedCallback(){this.load()}
 async load(){
  this.innerHTML='<section class="dsp-shell"><p class="dsp-loading">Data-soevereiniteit wordt gecontroleerd…</p></section>';
  try{
   const suffix=this.scope==='bedrijfsgeheugen'?'?scope=bedrijfsgeheugen':'';
   const r=await fetch('/api/data-sovereignty'+suffix,{credentials:'same-origin',headers:{accept:'application/json'}});
   const data=await r.json(); if(!r.ok)throw new Error(data.error||'read_failed');
   this.snapshot=data.snapshot||data; this.render();
  }catch{this.innerHTML='<section class="dsp-shell"><p>Data-soevereiniteit kon niet veilig worden geladen.</p></section>'}
 }
 render(){
  const s=this.snapshot||{},p=s.policy||{},sum=s.summary||{},viol=s.violations||[],self=this.scope==='bedrijfsgeheugen';
  this.innerHTML=`<section class="dsp-shell" data-sovereignty-scope="${esc(this.scope)}">
   <header class="dsp-head"><div><span class="dsp-kicker">DATA SOVEREIGNTY CONTROL PLANE</span><h2>Waar gaat data heen?</h2><p>Live overzicht van opslag, verwerking, AI-routes, doorgifte en bewijs. Onbekend blijft onbekend.</p></div>
   <div class="dsp-scope"><button data-scope="bedrijfsgeheugen" class="${self?'is-active':''}">Bedrijfsgeheugen</button><button data-scope="customer" class="${!self?'is-active':''}">Mijn organisatie</button></div></header>
   <div class="dsp-pulse"><article><small>Actief beleid</small><b>${esc(modeLabel[p.mode]||p.mode||'—')}</b></article><article><small>Status</small><b class="${sum.policySatisfied?'ok':'bad'}">${esc(statusLabel(sum))}</b></article><article><small>AI-routes</small><b>${esc(sum.activeAiRoutes??0)}</b><small>${esc(sum.globalOrUnknownAiRoutes??0)} globaal/onbekend</small></article><article><small>Laatste herijking</small><b>${esc(s.generatedAt?new Date(s.generatedAt).toLocaleString('nl-NL'):'—')}</b></article></div>
   ${!self?`<form class="dsp-policy"><label>Databeleid<select name="mode"><option value="TRANSPARENT_GLOBAL" ${p.mode==='TRANSPARENT_GLOBAL'?'selected':''}>Transparant wereldwijd</option><option value="EU_STORAGE" ${p.mode==='EU_STORAGE'?'selected':''}>Opslag EU</option><option value="EU_ONLY" ${p.mode==='EU_ONLY'?'selected':''}>EU-only · blokkeren buiten EU</option></select></label><label>Gewenste AI-route<select name="preferredAiProvider"><option value="">Huidige route</option><option value="openai_eu" ${p.preferred_ai_provider==='openai_eu'?'selected':''}>OpenAI EU (alleen na runtime-evidence)</option><option value="anthropic" ${p.preferred_ai_provider==='anthropic'?'selected':''}>Anthropic huidig</option></select></label><button type="submit">Beleid opslaan</button><small>EU-only is fail-closed: niet-bewezen AI-routes worden geblokkeerd; er wordt nooit stil naar een andere provider geschakeld.</small></form>`:''}
   ${viol.length?`<section class="dsp-alert"><h3>${viol.length} afwijking(en)</h3>${viol.map(v=>`<p><b>${esc(v.name||v.key)}</b> — ${esc(v.reason)}</p>`).join('')}</section>`:''}
   <section class="dsp-card"><h3>Providers & datalocaties</h3><div class="dsp-tablewrap"><table><thead><tr><th>Provider</th><th>Klantdata</th><th>Verwerking</th><th>Opslag</th><th>Doorgifte</th><th>Bewijs</th></tr></thead><tbody>${rows(s.providers)}</tbody></table></div></section>
   <section class="dsp-card"><h3>AI-routes die data kunnen verwerken</h3><div class="dsp-tablewrap"><table><thead><tr><th>Use-case</th><th>Provider/model</th><th>Verwerking</th><th>Doorgifte</th><th>Training</th></tr></thead><tbody>${aiRows(s.aiRoutes)}</tbody></table></div></section>
   <footer class="dsp-foot">Automatisch herijkt via de Powerhouse-heartbeat. Truth policy: measured_or_evidence_backed_else_unknown.</footer>
  </section>`;
  this.querySelectorAll('[data-scope]').forEach(b=>b.addEventListener('click',()=>{this.scope=b.dataset.scope;this.load()}));
  const form=this.querySelector('.dsp-policy'); if(form)form.addEventListener('submit',e=>this.save(e));
 }
 async save(e){
  e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;
  const fd=new FormData(form);
  try{
   const r=await fetch('/api/data-sovereignty',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({mode:fd.get('mode'),preferredAiProvider:fd.get('preferredAiProvider')})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'write_failed');this.snapshot=data.snapshot||data;this.render();
  }catch{button.disabled=false;button.textContent='Opslaan mislukt — opnieuw';}
 }
}
if(!customElements.get('bg-data-sovereignty-panel'))customElements.define('bg-data-sovereignty-panel',DataSovereigntyPanel);
