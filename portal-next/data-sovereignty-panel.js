const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labelScope=v=>String(v||'').replaceAll('_',' ');
const modeLabel={TRANSPARENT_GLOBAL:'Volledig transparant · wereldwijde routes toegestaan',EU_STORAGE:'Data-opslag binnen EU',EU_ONLY:'EU-only · verwerking en opslag binnen EU',CUSTOM:'Aangepast beleid'};
const statusLabel=s=>s?.policySatisfied?'Binnen gekozen beleid':'Afwijking / blokkade';
const AI_DEPLOYMENT_DEFAULTS={deploymentMode:'MANAGED_CLOUD',provider:'ANTHROPIC',modelFamily:'CURRENT',computeRegion:'AUTO',storageRegion:'AUTO',ragRegion:'SAME_AS_STORAGE',networkMode:'STANDARD',trainingUse:'PROHIBITED',allowExternalFallback:false,modelId:''};
const options=(choices,selected)=>choices.map(([value,label])=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`).join('');

const evidenceLinks=(urls=[])=>Array.isArray(urls)&&urls.length?urls.map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">bron ${i+1}</a>`).join(' · '):'<span>geen bron gekoppeld</span>';
const list=v=>Array.isArray(v)&&v.length?v.join(', '):'—';

function providerRows(items=[]){return items.map(p=>`<tr>
 <td><b>${esc(p.name)}</b><small>${esc(p.serviceKind)}</small></td>
 <td>${esc(p.customerDataExposure)}</td>
 <td>${esc(labelScope(p.processingScope))}<small>${esc(p.primaryRegion||'regio niet vastgelegd')}</small></td>
 <td>${esc(labelScope(p.storageScope))}</td>
 <td>${esc(labelScope(p.crossBorderTransfer))}</td>
 <td>${esc(p.trainingUse||'UNKNOWN')}</td>
 <td><span class="dsp-badge dsp-${String(p.evidenceStatus||'unknown').toLowerCase()}">${esc(p.evidenceStatus)}</span><small>${evidenceLinks(p.evidenceUrls)}</small></td>
 <td><small>${esc(p.retention||'—')}</small><small>${esc(p.notes||'')}</small></td>
 </tr>`).join('')}

function aiRows(items=[]){return items.map(r=>`<tr>
 <td><b>${esc(r.name)}</b><small>${esc(r.useCaseId)}</small></td>
 <td>${esc(r.provider)}<small>${esc(r.modelId)}</small></td>
 <td>${esc(labelScope(r.processingScope||'UNKNOWN'))}</td>
 <td>${esc(labelScope(r.crossBorderTransfer||'UNKNOWN'))}</td>
 <td>${esc(r.trainingUse||'UNKNOWN')}</td>
 <td><small>${esc(list(r.dataCategories))}</small></td>
 <td><small>${esc(r.retentionPolicy||'niet vastgelegd')}</small></td>
 <td><small>${esc(list(r.subprocessors))}</small><small>${evidenceLinks(r.evidenceUrls)}</small></td>
 </tr>`).join('')}

function flowRows(items=[]){return items.map(f=>{
 const processors=(f.processors||[]).map(x=>`${x.provider||'—'} · ${x.component||'—'} · ${x.region||'—'}`).join(' → ');
 const storage=(f.storage||[]).map(x=>`${x.provider||'—'} · ${x.service||'—'} · ${x.region||'—'}`).join(' | ');
 return `<tr>
 <td><b>${esc(f.name)}</b><small>${esc(f.flowKey)}</small></td>
 <td><small>${esc(list(f.inputData))}</small></td>
 <td><small>${esc(processors||'—')}</small></td>
 <td><small>${esc(storage||'geen persistente opslag in deze flow')}</small></td>
 <td>${esc(labelScope(f.crossBorderTransfer||'UNKNOWN'))}</td>
 <td><small>${esc(f.retention||'—')}</small></td>
 <td><span class="dsp-badge dsp-${String(f.evidenceStatus||'unknown').toLowerCase()}">${esc(f.evidenceStatus)}</span><small>${evidenceLinks(f.evidenceUrls)}</small></td>
 </tr>`;
}).join('')}

function connectorRows(items=[]){
 if(!items.length)return '<tr><td colspan="7"><small>Nog geen tenantkoppelingen geregistreerd. Nieuwe koppelingen verschijnen hier automatisch.</small></td></tr>';
 return items.map(c=>`<tr>
  <td><b>${esc(c.name)}</b><small>${esc(c.templateId||'eigen koppeling')}</small></td>
  <td>${esc(c.status)}</td>
  <td>${esc(c.sourceType)}<small>${esc(c.sourceResidency?.processingScope||'UNKNOWN')}</small></td>
  <td>${esc(c.targetType)}<small>${esc(c.targetResidency?.processingScope||'UNKNOWN')}</small></td>
  <td>${esc(c.sourceResidency?.storageScope||'UNKNOWN')}</td>
  <td>${esc(c.targetResidency?.storageScope||'UNKNOWN')}</td>
  <td><span class="dsp-badge dsp-${String((c.sourceResidency?.evidenceStatus==='VERIFIED'&&c.targetResidency?.evidenceStatus==='VERIFIED')?'verified':'unknown')}">${esc((c.sourceResidency?.evidenceStatus==='VERIFIED'&&c.targetResidency?.evidenceStatus==='VERIFIED')?'VERIFIED':'CHECK')}</span></td>
 </tr>`).join('');
}

class DataSovereigntyPanel extends HTMLElement{
 constructor(){super();this.scope='customer';this.snapshot=null}
 connectedCallback(){this.scope=this.getAttribute('scope')==='bedrijfsgeheugen'?'bedrijfsgeheugen':'customer';this.load()}
 async load(){
  this.innerHTML='<section class="dsp-shell"><p class="dsp-loading">Data-soevereiniteit wordt gecontroleerd…</p></section>';
  try{
   const suffix=this.scope==='bedrijfsgeheugen'?'?scope=bedrijfsgeheugen':'';
   const r=await fetch('/api/data-sovereignty'+suffix,{credentials:'same-origin',headers:{accept:'application/json'}});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'read_failed');
   this.snapshot=data.snapshot||data;this.render();
  }catch{this.innerHTML='<section class="dsp-shell"><p>Data-soevereiniteit kon niet veilig worden geladen.</p></section>'}
 }
 render(){
  const s=this.snapshot||{},p=s.policy||{},sum=s.summary||{},viol=s.violations||[],self=this.scope==='bedrijfsgeheugen';
  const ai={...AI_DEPLOYMENT_DEFAULTS,...(p.ai_deployment_profile||{})};
  const placementRequested=Boolean(p.ai_deployment_profile);
  const selectionActive=placementRequested&&ai.deploymentMode==='MANAGED_CLOUD'&&ai.provider==='ANTHROPIC'&&ai.modelFamily==='CURRENT'&&ai.computeRegion==='AUTO'&&ai.storageRegion==='AUTO'&&ai.ragRegion==='SAME_AS_STORAGE'&&ai.networkMode==='STANDARD'&&!ai.modelId;
  const deploymentPending=placementRequested&&!selectionActive;
  const displayedPolicySatisfied=Boolean(sum.policySatisfied)&&!deploymentPending;
  const impact=p.last_change_impact?.contract==='powerhouse-cross-domain-change-v1'?p.last_change_impact:null;
  const impactPending=impact?.status==='REVIEW_REQUIRED';
  const impactTypeLabel={AI_MODEL:'AI-model of AI-provider',AI_DEPLOYMENT:'AI-infrastructuur',DATA_LOCATION:'Data- of verwerkingslocatie'};
  const reviewStates={
   OPEN:'Open — bewijs en beoordeling nodig',
   READY:'Gereed voor beoordeling',
   RUNNING:'In behandeling',
   BLOCKED:'Geblokkeerd — vervolgactie nodig',
   FULFILLED:'Administratief afgerond; inhoudelijk bewijs blijft vereist',
   BREACHED:'Niet tijdig afgerond',
   CANCELLED:'Ingetrokken',
   NOT_REGISTERED:'Registratie nog niet aangetoond',
   UNVERIFIED:'Status nog niet geverifieerd'
  };
  const brainReview=s.brainReview&&typeof s.brainReview==='object'?s.brainReview:null;
  const reviewStatus=brainReview&&Object.prototype.hasOwnProperty.call(reviewStates,brainReview.status)
   ?reviewStates[brainReview.status]:'Nog geen bevestigde Brain-status';
  const esrsCandidates=impactPending&&Array.isArray(impact.esrsReview)
   ?impact.esrsReview.filter(item=>item?.reviewRequired===true&&item?.materiality==='UNDETERMINED').map(item=>String(item.standard||'')).filter(Boolean)
   :[];
  this.innerHTML=`<section class="dsp-shell" data-sovereignty-scope="${esc(this.scope)}">
   <header class="dsp-head"><div><span class="dsp-kicker">DATA SOVEREIGNTY CONTROL PLANE</span><h2>Waar gaat data heen?</h2><p>Live overzicht van invoer, verwerking, opslag, AI, doorgifte, koppelingen en bewijs. Onbekend blijft onbekend.</p></div>
   <div class="dsp-scope"><button type="button" data-scope="bedrijfsgeheugen" class="${self?'is-active':''}">Bedrijfsgeheugen</button><button type="button" data-scope="customer" class="${!self?'is-active':''}">Mijn organisatie</button></div></header>
   <div class="dsp-pulse">
    <article><small>Actief beleid</small><b>${esc(modeLabel[p.mode]||p.mode||'—')}</b></article>
    <article><small>Status</small><b class="${displayedPolicySatisfied?'ok':'bad'}">${deploymentPending?'Gekozen AI-route nog niet actief':esc(statusLabel(sum))}</b><small>${esc(sum.violationCount??0)} afwijkingen in geregistreerde stromen</small></article>
    <article><small>Dataflows</small><b>${esc(sum.flowCount??0)}</b><small>${esc(sum.connectorCount??0)} koppelingen</small></article>
    <article><small>AI-routes</small><b>${esc(sum.activeAiRoutes??0)}</b><small>${esc(sum.globalOrUnknownAiRoutes??0)} globaal/onbekend</small></article>
    <article><small>Laatste herijking</small><b>${esc(s.generatedAt?new Date(s.generatedAt).toLocaleString('nl-NL'):'—')}</b></article>
   </div>
   ${impactPending?`<section class="dsp-alert dsp-cross-domain-review" role="status" aria-label="Herbeoordeling AI-keuze en CSRD">
    <h3>Gevolgen van je AI- of datakeuze worden beoordeeld</h3>
    <p><strong>Wijziging:</strong> ${esc(impactTypeLabel[impact.kind]||'Infrastructuur of databeleid')}.</p>
    <p><strong>Opvolging door het Brein:</strong> ${esc(reviewStatus)}.</p>
    <p>De gevolgen voor gegevensbescherming, beveiliging, leveranciers, kosten en duurzaamheid moeten opnieuw worden vastgesteld. Ook relevante CSRD/ESRS-onderwerpen worden gecontroleerd${esrsCandidates.length?' ('+esrsCandidates.map(esc).join(', ')+')':''}.</p>
    <p>Dit betekent niet dat CSRD voor jouw organisatie verplicht is of dat energieverbruik en CO₂ al zijn gemeten. De gekozen AI-route wordt niet automatisch geactiveerd.</p>
   </section>`:''}
   ${!self?`<form class="dsp-policy">
    <div class="dsp-policy-title"><h3>Kies waar jouw AI draait</h3><p>Selecteer de gewenste infrastructuur, het AI-model en de opslagplaatsen. Dit is een aanvraag/beleidskeuze, geen automatische installatie.</p></div>
    <label>Databeleid<select name="mode">${options([['TRANSPARENT_GLOBAL','Transparant wereldwijd'],['EU_STORAGE','Opslag uitsluitend in EU'],['EU_ONLY','EU-only: opslag + verwerking'],['CUSTOM','Aangepast beleid']],p.mode)}</select></label>
    <label>Infrastructuur<select name="deploymentMode">${options([['MANAGED_CLOUD','Beheerde cloud AI'],['PRIVATE_CLOUD','Private cloud / eigen cloudaccount'],['ON_PREMISE','Op eigen servers / on-premise'],['AIR_GAPPED','Volledig offline / air-gapped']],ai.deploymentMode)}</select></label>
    <label>Cloud / inferentieprovider<select name="provider">${options([['ANTHROPIC','Anthropic (huidige route)'],['AZURE_OPENAI','Microsoft Azure OpenAI'],['AWS_BEDROCK','Amazon Bedrock'],['GOOGLE_VERTEX','Google Vertex AI'],['MISTRAL_API','Mistral API'],['OLLAMA','Ollama (eigen infrastructuur)'],['VLLM','vLLM (eigen infrastructuur)']],ai.provider)}</select></label>
    <label>Modelfamilie<select name="modelFamily">${options([['CURRENT','Huidig model'],['MISTRAL','Mistral'],['GEMMA','Gemma'],['LLAMA','Llama'],['CUSTOM','Eigen / ander model']],ai.modelFamily)}</select></label>
    <label>Specifiek model (optioneel)<input name="modelId" type="text" maxlength="120" pattern="[a-zA-Z0-9._:/-]*" placeholder="bijvoorbeeld mistral-small" value="${esc(ai.modelId)}"></label>
    <label>Waar wordt AI uitgevoerd?<select name="computeRegion">${options([['AUTO','Volgens provider (onbeperkt)'],['EU','Europa'],['NL','Nederland'],['DE','Duitsland'],['US','Verenigde Staten'],['LOCAL','Eigen locatie']],ai.computeRegion)}</select></label>
    <label>Waar staan documenten en data?<select name="storageRegion">${options([['AUTO','Huidige opslagroute'],['EU','Europese opslag'],['NL','Nederland'],['DE','Duitsland'],['US','Verenigde Staten'],['LOCAL','Eigen locatie']],ai.storageRegion)}</select></label>
    <label>Waar staat RAG / vectorindex?<select name="ragRegion">${options([['SAME_AS_STORAGE','Zelfde locatie als documenten'],['EU','Europa'],['NL','Nederland'],['DE','Duitsland'],['US','Verenigde Staten'],['LOCAL','Eigen locatie']],ai.ragRegion)}</select></label>
    <label>Netwerkisolatie<select name="networkMode">${options([['STANDARD','Standaard verbinding'],['PRIVATE_ENDPOINT','Private endpoint / afgesloten netwerk'],['OFFLINE','Zonder internet']],ai.networkMode)}</select></label>
    <div class="dsp-policy-assurance"><strong>Privacyvoorwaarden</strong><p>Klantgegevens mogen niet voor modeltraining worden gebruikt. Geen automatische externe fallback. Geheimen en API-sleutels worden nooit in dit formulier opgeslagen.</p><p><strong>Activatie:</strong> ${!placementRequested?'Bestaande route, nog geen afzonderlijk profiel gekozen.':selectionActive?'Bestaande Anthropic-route aangevraagd; zie runtimebewijs hieronder.':'Nieuwe AI-route gevraagd — niet geactiveerd. Gegevens worden niet stilzwijgend naar de huidige AI-provider verstuurd.'}</p></div>
    <div class="dsp-policy-actions"><button type="submit">AI-keuze en databeleid opslaan</button><output aria-live="polite" data-save-message></output></div>
    <small>Een gewenste locatie is geen bewezen dataresidentie. Providerconfiguratie, contracten, hosting, encryptie, verwerkers en end-to-end tests moeten eerst worden gevalideerd. Bij ontbrekend bewijs wordt verwerking geblokkeerd.</small>
   </form>`:''}
   ${viol.length?`<section class="dsp-alert"><h3>${viol.length} afwijking(en) / blokkade(s)</h3>${viol.map(v=>`<p><b>${esc(v.name||v.key)}</b> — ${esc(v.reason)}</p>`).join('')}</section>`:''}
   <section class="dsp-card"><h3>1. Dataflows — van invoer tot opslag</h3><div class="dsp-tablewrap"><table><thead><tr><th>Flow</th><th>Data</th><th>Verwerking</th><th>Opslag</th><th>Doorgifte</th><th>Bewaren</th><th>Bewijs</th></tr></thead><tbody>${flowRows(s.dataFlows)}</tbody></table></div></section>
   <section class="dsp-card"><h3>2. Providers & datalocaties</h3><div class="dsp-tablewrap"><table><thead><tr><th>Provider</th><th>Klantdata</th><th>Verwerking</th><th>Opslag</th><th>Doorgifte</th><th>Training</th><th>Bewijs</th><th>Retentie / toelichting</th></tr></thead><tbody>${providerRows(s.providers)}</tbody></table></div></section>
   <section class="dsp-card"><h3>3. AI-routes die data kunnen verwerken</h3><div class="dsp-tablewrap"><table><thead><tr><th>Use-case</th><th>Provider/model</th><th>Verwerking</th><th>Doorgifte</th><th>Training</th><th>Datacategorieën</th><th>Retentie</th><th>Subprocessors / bewijs</th></tr></thead><tbody>${aiRows(s.aiRoutes)}</tbody></table></div></section>
   <section class="dsp-card"><h3>4. Mijn koppelingen</h3><p class="dsp-card-intro">Bron en doel worden automatisch uit de connectorconfiguratie geprojecteerd. Secrets of credentials worden hier nooit getoond.</p><div class="dsp-tablewrap"><table><thead><tr><th>Koppeling</th><th>Status</th><th>Bron</th><th>Doel</th><th>Bronopslag</th><th>Doelopslag</th><th>Residency</th></tr></thead><tbody>${connectorRows(s.connectors)}</tbody></table></div></section>
   <footer class="dsp-foot">Automatisch herijkt via Brain → Heartbeat → Powerhouse → provider/connector readback. Truth policy: measured_or_evidence_backed_else_unknown.</footer>
  </section>`;
  this.querySelectorAll('[data-scope]').forEach(b=>b.addEventListener('click',()=>{this.scope=b.dataset.scope;this.load()}));
  const form=this.querySelector('.dsp-policy');
  if(form){
   form.addEventListener('submit',e=>this.save(e));
   form.elements.deploymentMode?.addEventListener('change',()=>{
    const mode=form.elements.deploymentMode.value;
    if(['ON_PREMISE','AIR_GAPPED'].includes(mode)){
     form.elements.provider.value='OLLAMA';
     form.elements.computeRegion.value='LOCAL';
     form.elements.storageRegion.value='LOCAL';
     form.elements.ragRegion.value='SAME_AS_STORAGE';
     form.elements.networkMode.value=mode==='AIR_GAPPED'?'OFFLINE':'STANDARD';
    }else if(mode==='MANAGED_CLOUD'&&['OLLAMA','VLLM'].includes(form.elements.provider.value)){
     form.elements.provider.value='ANTHROPIC';form.elements.computeRegion.value='AUTO';
     form.elements.storageRegion.value='AUTO';form.elements.networkMode.value='STANDARD';
    }else if(mode==='PRIVATE_CLOUD'&&form.elements.networkMode.value==='OFFLINE'){
     form.elements.networkMode.value='PRIVATE_ENDPOINT';
    }
   });
  }
 }
 async save(e){
  e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;
  const fd=new FormData(form);
  try{
   const aiDeploymentProfile={...AI_DEPLOYMENT_DEFAULTS,
    deploymentMode:String(fd.get('deploymentMode')),provider:String(fd.get('provider')),modelFamily:String(fd.get('modelFamily')),
    modelId:String(fd.get('modelId')||'').trim(),computeRegion:String(fd.get('computeRegion')),storageRegion:String(fd.get('storageRegion')),
    ragRegion:String(fd.get('ragRegion')),networkMode:String(fd.get('networkMode'))};
   const r=await fetch('/api/data-sovereignty',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({mode:fd.get('mode'),preferredAiProvider:this.snapshot?.policy?.preferred_ai_provider||'',preferredAiRegion:this.snapshot?.policy?.preferred_ai_region||'',aiDeploymentProfile})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'write_failed');this.snapshot=data.snapshot||data;this.render();
  }catch{button.disabled=false;button.textContent='Opslaan mislukt — opnieuw';}
 }
}
if(!customElements.get('bg-data-sovereignty-panel'))customElements.define('bg-data-sovereignty-panel',DataSovereigntyPanel);
