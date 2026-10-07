const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const tone=v=>{const s=String(v||'').toUpperCase();return /VERIFIED|PASS|CURRENT|HEALTHY|SATISFIED/.test(s)?'ok':/FAIL|CRITICAL|ACTION_REQUIRED|BLOCK/.test(s)?'bad':'warn'};
const roleList=user=>arr(user?.roles||user?.appMetadata?.roles||user?.app_metadata?.roles).map(v=>String(v).toLowerCase());
const isInternal=user=>roleList(user).some(r=>['admin','owner','powerhouse-admin','powerhouse_admin'].includes(r));
async function readJson(response){const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body?.error||('HTTP_'+response.status));return body;}
function providerName(p){return p?.name||p?.displayName||p?.providerKey||'Provider';}
function status(v){return '<span class="trust-status '+tone(v)+'">'+esc(v||'UNKNOWN')+'</span>';}
function evidenceLinks(urls=[]){return arr(urls).map(u=>'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Officiële bron ↗</a>').join('');}
function renderSovereignty(root,data,security,scope){
 const providers=arr(data?.providers),flows=arr(data?.dataFlows),summary=data?.summary||{},policy=data?.policy||{};
 root.innerHTML=`<section class="trust-workspace">
  <div class="trust-hero"><div><span class="trust-kicker">Alleen ingelogde klantomgeving</span><h2>Data & AI Sovereignty</h2><p>Waar je data staat, waar verwerking plaatsvindt, welke AI/providers betrokken zijn en welke beperkingen aantoonbaar gelden.</p></div><div class="trust-scope"><small>Weergave</small><strong>${scope}</strong><span>Tenant-scoped en server-side geautoriseerd</span></div></div>
  <div class="trust-questionbar">
   <button data-answer="storage">Waar staat mijn data?</button><button data-answer="processing">Waar wordt verwerkt?</button><button data-answer="ai">Welke AI kijkt mee?</button><button data-answer="border">Gaat data buiten Europa?</button><button data-answer="training">Wordt data gebruikt voor training?</button>
  </div>
  <div class="trust-answer" data-trust-answer aria-live="polite"></div>
  <div class="trust-grid">
   <article><small>Policy</small><strong>${esc(policy.mode||'UNKNOWN')}</strong><span>Enforcement: ${esc(policy.enforcementMode||policy.enforcement_mode||'UNKNOWN')}</span></article>
   <article><small>Datastromen</small><strong>${flows.length}</strong><span>Geregistreerde verwerkingsroutes</span></article>
   <article><small>Providers</small><strong>${providers.length}</strong><span>Opslag, verwerking, AI en subprocessors</span></article>
   <article><small>Policy-status</small><strong>${summary.policySatisfied===true?'Voldoet':'Niet volledig bewezen'}</strong><span>${status(summary.policySatisfied===true?'SATISFIED':'PARTIAL')}</span></article>
  </div>
  <section class="trust-section"><header><h3>Providers en datalocatie</h3><p>Klik open voor opslag, verwerking, doorgifte, training en evidence.</p></header>
   <div class="trust-list">${providers.map(p=>`<details><summary><span><b>${esc(providerName(p))}</b><small>${esc(p.customerDataExposure||'UNKNOWN')}</small></span>${status(p.evidenceStatus)}</summary><div class="trust-detail"><p><b>Opslag:</b> ${esc(p.storageScope||'UNKNOWN')}</p><p><b>Verwerking:</b> ${esc(p.processingScope||'UNKNOWN')}</p><p><b>Cross-border:</b> ${esc(p.crossBorderTransfer||'UNKNOWN')}</p><p><b>Training-use:</b> ${esc(p.trainingUse||'UNKNOWN')}</p>${evidenceLinks(p.evidenceUrls)}</div></details>`).join('')||'<p>Geen provider-evidence beschikbaar.</p>'}</div>
  </section>
  <section class="trust-section"><header><h3>Datastromen</h3><p>Alleen geregistreerde tenantflows; onbekend blijft onbekend.</p></header>
   <div class="trust-list">${flows.map(f=>`<details><summary><span><b>${esc(f.name||f.flowKey||f.id||'Datastroom')}</b><small>${esc(f.purpose||f.kind||'')}</small></span>${status(f.evidenceStatus||'OBSERVED')}</summary><div class="trust-detail"><pre>${esc(JSON.stringify(f,null,2))}</pre></div></details>`).join('')||'<p>Geen datastromen beschikbaar.</p>'}</div>
  </section>
 </section>`;
 const answer=root.querySelector('[data-trust-answer]');
 const answers={
  storage:'De primaire opslaglocatie wordt per provider getoond. Alleen evidence-backed regio’s tellen als bewezen.',
  processing:'Opslag en verwerking zijn aparte velden. Een EU-opslaglocatie betekent niet automatisch dat alle verwerking in de EU plaatsvindt.',
  ai:'AI-routes worden per provider en use-case zichtbaar gemaakt. Onbekende routes worden niet als veilig of EU-only verondersteld.',
  border:'Cross-border transfer staat per provider/route apart. Een EU_ONLY-policy faalt dicht wanneer doorgifte niet aantoonbaar past.',
  training:'Training-use wordt per providerroute getoond. UNKNOWN blijft zichtbaar en wordt niet als “nee” geïnterpreteerd.'
 };
 root.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{answer.textContent=answers[b.dataset.answer]||'';answer.classList.add('open')}));
}
function renderSecurity(root,security,sovereignty,scope){
 const summary=security?.summary||{},findings=arr(security?.findings),frameworks=arr(security?.frameworks),assurance=arr(security?.providerAssurance),observations=arr(security?.managementObservations),db=security?.database||{};
 root.innerHTML=`<section class="trust-workspace">
  <div class="trust-hero"><div><span class="trust-kicker">Alleen ingelogde klantomgeving</span><h2>Security Trust Center</h2><p>Hoe veilig is je data, wie kan erbij, welke controls zijn aantoonbaar en welke punten staan nog open?</p></div><div class="trust-scope"><small>Weergave</small><strong>${scope}</strong><span>Ruwe security-evidence blijft server-only</span></div></div>
  <div class="trust-grid">
   <article><small>Security posture</small><strong>${esc(summary.postureStatus||'EVIDENCE_PARTIAL')}</strong>${status(summary.postureStatus)}</article>
   <article><small>Open findings</small><strong>${findings.length}</strong><span>High risk: ${esc(summary.highRiskFindingCount??0)}</span></article>
   <article><small>Evidence-dekking</small><strong>${esc(summary.evidenceCoverage??0)}%</strong><span>Geen false-green bij stale/unknown</span></article>
   <article><small>Database</small><strong>${esc(db.highRiskCount??0)} high-risk</strong><span>${esc(db.rlsNoPolicy??0)} RLS zonder policy-classificatie</span></article>
  </div>
  <section class="trust-section"><header><h3>Open security findings</h3><p>Automatisch afgeleid uit runtime-, database- en managementplane-evidence.</p></header>
   <div class="trust-findings">${findings.map(f=>`<article><div>${status(f.severity)}</div><div><b>${esc(f.title||f.key)}</b><p>${esc(f.detail||f.reason||'Geen detail')}</p></div></article>`).join('')||'<p>Geen open findings in deze snapshot.</p>'}</div>
  </section>
  <section class="trust-section"><header><h3>Provider assurance</h3><p>Provider-certificeringen en verklaringen zijn expliciet géén Bedrijfsgeheugen-certificering.</p></header>
   <div class="trust-list">${assurance.map(a=>`<details><summary><span><b>${esc(a.providerKey)}</b><small>${esc(a.assuranceScope||'')}</small></span>${status(a.evidenceStatus)}</summary><div class="trust-detail"><p>${esc(a.notes||'')}</p>${evidenceLinks(a.evidenceUrls)}</div></details>`).join('')||'<p>Geen provider-assurance beschikbaar.</p>'}</div>
  </section>
  <section class="trust-section"><header><h3>Normen en kaders</h3><p>Applicability en technische evidence blijven gescheiden van formele certificering.</p></header>
   <div class="trust-frameworks">${frameworks.map(f=>`<article><b>${esc(f.label||f.frameworkKey)}</b>${status(f.applicability)}<p>${esc(f.notes||'')}</p>${evidenceLinks(f.evidenceUrls)}</article>`).join('')}</div>
  </section>
  <section class="trust-section"><header><h3>Actuele access- en managementevidence</h3><p>Alleen metadata en freshness; ruwe management-evidence wordt nooit naar de browser geprojecteerd.</p></header>
   <div class="trust-list">${observations.map(o=>`<div class="trust-observation"><b>${esc(o.provider_key||o.providerKey)} · ${esc(o.control_key||o.controlKey)}</b>${status(o.status)}<small>Bron: ${esc(o.source||'runtime')} · evidence aanwezig: ${esc(o.evidence_available??o.evidenceAvailable??false)}</small></div>`).join('')||'<p>Geen actuele management-observaties beschikbaar.</p>'}</div>
  </section>
 </section>`;
}
export async function mountSecurityTrustWorkspace(root,{pageId='trust-center',stateClient}={}){
 if(!root)throw new TypeError('SECURITY_TRUST_ROOT_REQUIRED');
 if(!stateClient?.authHeaders)throw new Error('SECURITY_TRUST_AUTH_CONTEXT_REQUIRED');
 root.innerHTML='<div class="trust-loading">Beveiligde trustdata laden…</div>';
 const user=stateClient.currentUser?.();
 if(!user||stateClient.isDemo?.()){root.innerHTML='<div class="trust-denied">Log in als klant of Bedrijfsgeheugen-beheerder om deze pagina te openen.</div>';return;}
 const headers=await stateClient.authHeaders();
 if(!headers?.authorization){root.innerHTML='<div class="trust-denied">Je sessie bevat geen geldige autorisatie.</div>';return;}
 const internal=isInternal(user);
 const suffix=internal?'?scope=bedrijfsgeheugen':'';
 try{
  const [sovBody,secBody]=await Promise.all([
   fetch('/api/data-sovereignty'+suffix,{headers,credentials:'same-origin'}).then(readJson),
   fetch('/api/security-trust'+suffix,{headers,credentials:'same-origin'}).then(readJson)
  ]);
  const sovereignty=sovBody.snapshot||sovBody;
  const security=secBody.snapshot||secBody;
  const scope=internal?'Bedrijfsgeheugen · canonical':'Jouw organisatie';
  if(pageId==='data-ai-passport')renderSovereignty(root,sovereignty,security,scope);
  else renderSecurity(root,security,sovereignty,scope);
 }catch(error){
  root.innerHTML='<div class="trust-denied"><b>Trustdata kon niet veilig worden geladen.</b><span>'+esc(error.message)+'</span></div>';
 }
}
