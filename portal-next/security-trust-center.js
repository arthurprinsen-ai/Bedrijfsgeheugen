const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const upper=v=>String(v||'').toUpperCase();
const tone=s=>{const v=upper(s);return /VERIFIED|CURRENT|HEALTHY|PASS/.test(v)?'ok':/CRITICAL|ERROR|BLOCK|FAIL|ACTION_REQUIRED/.test(v)?'bad':'warn'};
const fmt=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(d)};
const unique=a=>[...new Set(a.filter(Boolean))];

function answerFor(key,{security,sovereignty}){
 const providers=arr(sovereignty?.providers);
 const flows=arr(sovereignty?.dataFlows);
 if(key==='where')return {title:'Waar staat en verwerkt mijn data?',body:`Primaire tenantopslag: ${providers.find(p=>p.providerKey==='supabase')?.storageScope||'onbekend'}. Er zijn ${flows.length} geregistreerde datastromen. Niet-bewezen of globale routes blijven expliciet zichtbaar en worden niet als EU-only gepresenteerd.`};
 if(key==='who'){const m=arr(security?.managementObservations);return {title:'Wie kan bij mijn data?',body:`Toegang loopt via identity-, tenant- en service-boundaries. Er zijn ${m.length} management-plane controlobservaties in de actuele trust snapshot. GitHub bevat standaard geen klant-runtime-invoer; Notion is alleen betrokken wanneer een koppeling of interne sync data ontvangt. Provider- en IAM-bewijs heeft een vervaldatum: oud bewijs wordt STALE, niet groen.`};}
 if(key==='training')return {title:'Wordt mijn data gebruikt om AI te trainen?',body:`Per AI/provider-route tonen we de geregistreerde training-use. Huidige providerregistratie: ${unique(providers.map(p=>`${p.name}: ${p.trainingUse||'UNKNOWN'}`)).join(' · ')||'geen bewijs beschikbaar'}.`};
 if(key==='eu')return {title:'Gaat data buiten Europa?',body:`De actuele policy is ${sovereignty?.policy?.mode||'onbekend'}. Er zijn ${sovereignty?.summary?.globalOrUnknownAiRoutes??'—'} globale of onbekende AI-routes. Een EU_ONLY-policy faalt dicht wanneer residency of doorgifte niet aantoonbaar is.`};
 if(key==='open')return {title:'Wat staat er securitymatig open?',body:`Het actuele security snapshot bevat ${security?.summary?.findingCount??arr(security?.findings).length} finding(s). Hoge risico’s en verouderd bewijs staan hieronder met concrete oorzaak; provider-assurance wordt nooit gelijkgesteld aan Bedrijfsgeheugen-certificering.`};
 return {title:'Welke normen en kaders dekken we?',body:'Het Trust Center projecteert AVG/GDPR, EU AI Act, NIS2/Cyberbeveiligingswet, ISO 27001/27017/27018/22301/42001, SOC 2, NIST CSF 2.0, CIS Controls, OWASP en DORA waar contextueel relevant. Applicability en certification worden apart gehouden.'};
}

function domainRows(security){
 const db=security?.database||{};
 return [
  ['Identity & toegang',security?.domains?.identity||'PARTIAL','MFA, tenant isolation, least privilege, service identities'],
  ['Database & RLS',db.highRiskCount>0?'ACTION_REQUIRED':'OBSERVED',`${db.rlsNoPolicy??0} RLS-tabellen zonder policy · ${db.anonSecurityDefinerFunctions??0} anon SECURITY DEFINER RPCs`],
  ['Code & deployment',security?.domains?.delivery||'OBSERVED','GitHub, protected delivery, CodeQL/CI, exact-SHA readback'],
  ['Secrets & credentials',security?.domains?.secrets||'PARTIAL','Secret stores, rotatie, revocation, geen secretwaarden in evidence'],
  ['Leveranciers',security?.domains?.suppliers||'PARTIAL','Provider assurance, subprocessors, dataroutes, residency'],
  ['Incident & continuïteit',security?.domains?.resilience||'PARTIAL','Recovery, backup, restore proof, incident evidence']
 ];
}

export function buildSecurityTrustMarkup({security={},sovereignty={}}={}){
 const summary=security.summary||{};
 const providers=arr(sovereignty.providers);
 const frameworks=arr(security.frameworks);
 const assurance=arr(security.providerAssurance);
 const assuranceBy=Object.fromEntries(assurance.map(item=>[item.providerKey,item]));
 const findings=arr(security.findings);
 const management=arr(security.managementObservations);
 const score=Math.max(0,Math.min(100,Number(summary.evidenceCoverage??0)));
 const pulse=Math.round(score*3.6);
 return `<main class="stc">
 <section class="stc-hero">
  <div class="stc-hero-main"><span class="stc-eyebrow">Evidence-first · live posture · fail closed</span><h1>Hoe veilig is mijn data — en hoe weet ik dat?</h1><p class="stc-lead">Eén contextuele trust-laag over data, AI, identity, database, leveranciers, code, incidenten en normen. Geen marketing-vinkjes: we onderscheiden eigen technische evidence, provider-assurance, juridische toepasselijkheid en onbekend bewijs.</p></div>
  <aside class="stc-trust-pulse"><div class="stc-pulse-orb" style="--pulse:${pulse}deg"><b>${score}%</b></div><div class="stc-pulse-copy"><strong>${esc(summary.postureStatus||'EVIDENCE_PARTIAL')}</strong><small>Bewijsdekking · ${esc(summary.findingCount??findings.length)} open finding(s)<br>Laatst opgebouwd: ${esc(fmt(security.generatedAt))}</small></div></aside>
 </section>
 <nav class="stc-question-rail" aria-label="Snelle securityvragen">
  <button data-security-question="where">Waar staat mijn data?</button><button data-security-question="who">Wie kan erbij?</button><button data-security-question="training">AI-training?</button><button data-security-question="eu">Buiten Europa?</button><button data-security-question="open">Wat staat open?</button><button data-security-question="frameworks">Welke normen?</button>
 </nav>
 <section class="stc-answer" data-security-answer aria-live="polite"></section>
 <section class="stc-grid">
  <article class="stc-card"><span class="stc-eyebrow">Data routes</span><div class="stc-stat">${esc(sovereignty?.summary?.flowCount??arr(sovereignty.dataFlows).length)}</div><p>Geregistreerde klant- en platformflows.</p><span class="stc-status ${tone(sovereignty?.summary?.policySatisfied?'VERIFIED':'PARTIAL')}">${sovereignty?.summary?.policySatisfied?'Policy satisfied':'Beperkingen zichtbaar'}</span></article>
  <article class="stc-card"><span class="stc-eyebrow">Providers</span><div class="stc-stat">${providers.length}</div><p>Opslag, verwerking, doorgifte, training en evidence per provider.</p><span class="stc-status warn">Provider assurance ≠ eigen certificering</span></article>
  <article class="stc-card"><span class="stc-eyebrow">Security findings</span><div class="stc-stat">${findings.length}</div><p>Actuele database- en managementplane findings.</p><span class="stc-status ${findings.some(f=>['critical','high'].includes(String(f.severity).toLowerCase()))?'bad':'warn'}">Evidence-first</span></article>
  <article class="stc-card wide"><h2>Securitylagen</h2><p>Klik op een laag voor het bewijs en de beperkingen.</p><div class="stc-domain-grid">${domainRows(security).map((d,i)=>`<div class="stc-domain"><button data-security-domain="${i}" data-title="${esc(d[0])}" data-detail="${esc(d[2])}"><strong>${esc(d[0])}</strong><span class="stc-status ${tone(d[1])}">${esc(d[1])}</span><small>${esc(d[2])}</small></button></div>`).join('')}</div></article>
  <article class="stc-card"><h2>Actuele databeleid</h2><p>Desired state en werkelijk bewezen runtime blijven gescheiden.</p><strong>${esc(sovereignty?.policy?.mode||'UNKNOWN')}</strong><small class="stc-disclaimer">Enforcement: ${esc(sovereignty?.policy?.enforcement_mode||sovereignty?.policy?.enforcementMode||'UNKNOWN')} · ${esc(sovereignty?.summary?.truthPolicy||'measured_or_evidence_backed_else_unknown')}</small></article>
  <article class="stc-card full"><h2>Providers & subprocessors</h2><p>Wat ontvangt klantdata, waar wordt verwerkt/opgeslagen en wat is alleen provider-assurance.</p><div class="stc-provider-grid">${providers.map((p,i)=>{const a=assuranceBy[p.providerKey]||{};return `<div class="stc-provider"><button data-provider-index="${i}"><strong>${esc(p.name||p.displayName||p.providerKey)}</strong><span class="stc-status ${tone(p.evidenceStatus)}">Runtime ${esc(p.evidenceStatus||'UNKNOWN')}</span><span class="stc-status ${tone(a.evidenceStatus)}">Assurance ${esc(a.evidenceStatus||'UNKNOWN')}</span><small>Exposure: ${esc(p.customerDataExposure||'UNKNOWN')} · opslag: ${esc(p.storageScope||'UNKNOWN')} · verwerking: ${esc(p.processingScope||'UNKNOWN')}</small><small>${esc(a.assuranceScope||'Geen provider-assurance gekoppeld')}</small></button></div>`}).join('')||'<div class="stc-empty">Geen providerdata beschikbaar.</div>'}</div></article>
  <article class="stc-card full"><h2>Wie kan meekijken? · management-plane evidence</h2><p>Actuele controls over accounts, MFA, service identities en providerbeheer. Alleen metadata en freshness worden aan klanten getoond; ruwe management-evidence blijft server-only.</p><div class="stc-findings">${management.map(o=>{const provider=o.providerKey||o.provider_key||'provider';const control=o.controlKey||o.control_key||'control';const status=o.status||'UNKNOWN';const observed=o.observedAt||o.observed_at;const expires=o.expiresAt||o.expires_at;const evidence=o.evidenceAvailable??o.evidence_available;return `<div class="stc-finding"><span class="stc-status ${tone(status)}">${esc(status)}</span><div><b>${esc(provider)} · ${esc(control)}</b><p>Waargenomen: ${esc(fmt(observed))} · geldig tot: ${esc(fmt(expires))} · evidence: ${evidence?'aanwezig':'niet publiek geprojecteerd'}</p></div></div>`}).join('')||'<div class="stc-empty">Nog geen actuele management-plane observaties voor deze tenant. Dit wordt niet als groen geïnterpreteerd.</div>'}</div></article>
  <article class="stc-card full"><h2>Normen & wettelijke kaders</h2><p>Applicability is contextafhankelijk; een providercertificaat of technische control maakt Bedrijfsgeheugen niet automatisch gecertificeerd.</p><div class="stc-framework-grid">${frameworks.map(f=>`<div class="stc-framework"><strong>${esc(f.label||f.frameworkKey)}</strong><span class="stc-status ${tone(f.evidenceStatus||f.applicability)}">${esc(f.applicability||'ASSESS')}</span><small>${esc(f.notes||'')}</small>${arr(f.evidenceUrls).map(u=>'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Officiële bron ↗</a>').join('')}</div>`).join('')||'<div class="stc-empty">Frameworkregister nog niet geladen.</div>'}</div></article>
  <article class="stc-card full"><h2>Open security findings</h2><p>Automatisch uit live databasecatalogus en actuele management-observaties. Oud bewijs verloopt.</p><div class="stc-findings">${findings.map(f=>`<div class="stc-finding"><span class="stc-status ${tone(f.severity)}">${esc(f.severity||'info')}</span><div><b>${esc(f.title||f.key)}</b><p>${esc(f.detail||f.reason||'Geen detail')}</p></div></div>`).join('')||'<div class="stc-empty">Geen open findings in deze evidence-set.</div>'}</div></article>
  <article class="stc-card full"><p class="stc-disclaimer"><strong>Trust-semantiek.</strong> “Verified” betekent alleen dat het genoemde bewijs de specifieke control of observatie ondersteunt. Het is geen juridisch oordeel en geen algemene ISO/SOC/NIS2-certificering. Provider-assurance blijft provider-assurance. Onbekend of verlopen bewijs wordt niet groen.</p></article>
 </section>
 <dialog class="stc-evidence-drawer" data-security-drawer><div class="stc-drawer-in"><div class="stc-drawer-head"><div><span class="stc-eyebrow">Evidence detail</span><h2 data-drawer-title>Detail</h2></div><button type="button" data-drawer-close aria-label="Sluiten">Sluiten</button></div><div data-drawer-body></div></div></dialog>
 </main>`;
}

class BgSecurityTrustCenter extends HTMLElement{
 async connectedCallback(){
  this.innerHTML='<div class="stc-loading">Security evidence wordt opgebouwd…</div>';
  try{
   const [secRes,sovRes]=await Promise.all([fetch('/api/security-trust',{credentials:'include'}),fetch('/api/data-sovereignty',{credentials:'include'})]);
   const [securityBody,sovereigntyBody]=await Promise.all([secRes.json(),sovRes.json()]);
   if(!secRes.ok)throw new Error(securityBody?.error||'SECURITY_TRUST_READ_FAILED');
   if(!sovRes.ok)throw new Error(sovereigntyBody?.error||'DATA_SOVEREIGNTY_READ_FAILED');
   this.state={security:securityBody.snapshot||securityBody,sovereignty:sovereigntyBody.snapshot||sovereigntyBody};
   this.innerHTML=buildSecurityTrustMarkup(this.state);
   this.bind();
  }catch(error){
   this.innerHTML=`<main class="stc"><article class="stc-card full"><h1>Trust Center tijdelijk niet beschikbaar</h1><p>${esc(error.message)}</p></article></main>`;
  }
 }
 bind(){
  const answer=this.querySelector('[data-security-answer]');
  const drawer=this.querySelector('[data-security-drawer]');
  this.querySelectorAll('[data-security-question]').forEach(button=>button.addEventListener('click',()=>{
   const a=answerFor(button.dataset.securityQuestion,this.state);
   answer.innerHTML=`<h2>${esc(a.title)}</h2><p>${esc(a.body)}</p>`;
   answer.classList.add('is-open');
   answer.scrollIntoView({block:'nearest',behavior:'smooth'});
  }));
  this.querySelectorAll('[data-security-domain]').forEach(button=>button.addEventListener('click',()=>{
   drawer.querySelector('[data-drawer-title]').textContent=button.dataset.title;
   drawer.querySelector('[data-drawer-body]').innerHTML=`<p>${esc(button.dataset.detail)}</p><p class="stc-disclaimer">Deze laag wordt opgebouwd uit runtime-, database-, repository- en provider-evidence. Ontbrekend of verlopen bewijs blijft zichtbaar.</p>`;
   drawer.showModal();
  }));
  const providers=arr(this.state.sovereignty.providers);
  const assuranceBy=Object.fromEntries(arr(this.state.security.providerAssurance).map(item=>[item.providerKey,item]));
  this.querySelectorAll('[data-provider-index]').forEach(button=>button.addEventListener('click',()=>{
   const p=providers[Number(button.dataset.providerIndex)]||{};
   const a=assuranceBy[p.providerKey]||{};
   drawer.querySelector('[data-drawer-title]').textContent=p.name||p.providerKey||'Provider';
   drawer.querySelector('[data-drawer-body]').innerHTML=`<ul class="stc-evidence-list"><li><b>Customer data exposure</b><br>${esc(p.customerDataExposure||'UNKNOWN')}</li><li><b>Opslag</b><br>${esc(p.storageScope||'UNKNOWN')}</li><li><b>Verwerking</b><br>${esc(p.processingScope||'UNKNOWN')}</li><li><b>Cross-border</b><br>${esc(p.crossBorderTransfer||'UNKNOWN')}</li><li><b>AI-training</b><br>${esc(p.trainingUse||'UNKNOWN')}</li><li><b>Runtime evidence status</b><br>${esc(p.evidenceStatus||'UNKNOWN')} · checked ${esc(fmt(p.evidenceCheckedAt))}</li><li><b>Provider assurance</b><br>${esc(a.evidenceStatus||'UNKNOWN')} · ${esc(a.assuranceScope||'Geen scope gekoppeld')}</li>${arr(p.evidenceUrls).map(u=>`<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">Runtime/source: ${esc(u)}</a></li>`).join('')}${arr(a.evidenceUrls).map(u=>`<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">Provider assurance: ${esc(u)}</a></li>`).join('')}</ul>`;
   drawer.showModal();
  }));
  this.querySelector('[data-drawer-close]')?.addEventListener('click',()=>drawer.close());
 }
}
if(!customElements.get('bg-security-trust-center'))customElements.define('bg-security-trust-center',BgSecurityTrustCenter);