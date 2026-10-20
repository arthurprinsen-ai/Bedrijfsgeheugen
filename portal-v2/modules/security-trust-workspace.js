const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=v=>Array.isArray(v)?v:[];
const tone=v=>{const s=String(v||'').toUpperCase();return /VERIFIED|PASS|CURRENT|HEALTHY|SATISFIED/.test(s)?'ok':/FAIL|CRITICAL|ACTION_REQUIRED|BLOCK/.test(s)?'bad':'warn'};
const roleList=user=>arr(user?.roles||user?.appMetadata?.roles||user?.app_metadata?.roles).map(v=>String(v).toLowerCase());
const isInternal=user=>roleList(user).some(r=>['admin','owner','powerhouse-admin','powerhouse_admin'].includes(r));
async function readJson(response){const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body?.error||('HTTP_'+response.status));return body;}
function providerName(p){return p?.name||p?.displayName||p?.providerKey||'Provider';}
function status(v){return '<span class="trust-status '+tone(v)+'">'+esc(v||'UNKNOWN')+'</span>';}
function evidenceLinks(urls=[]){return arr(urls).map(u=>'<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Officiële bron ↗</a>').join('');}

function renderModelContext(data,state,saveStatus,activation){
 const prefs=state?.portal?.aiModelPreferences||{},runtime=state?.portal?.runtime||{};
 const pending=!['idle','saved'].includes(saveStatus);
 return '<section class="trust-section" data-model-passport><header><h3>Jouw AI-keuze en de geregistreerde verwerking</h3><p>Een modelkeuze is een aanvraag; een registratie is geen uitvoeringsbewijs. Werkelijk gebruik vereist afzonderlijke geverifieerde runtime-evidence.</p></header>'+
 '<p><b>Standaardmodel aangevraagd:</b> '+esc(prefs.defaultModelId||'Nog niet gekozen')+' · <b>Datavoorkeur:</b> '+esc(prefs.policy||'Niet vastgelegd')+' · '+(pending?'Wijziging nog niet bevestigd opgeslagen':'Klantstaat geladen')+'</p>'+
 '<p><b>Doel:</b> '+esc(prefs.useCase||'Nog niet vastgelegd')+' · <b>Keuze bijgewerkt:</b> '+esc(prefs.updatedAt||'Onbekend')+'</p>'+
 '<div class="trust-list">'+(arr(prefs.models).map(m=>'<p><b>'+esc(m.modelId)+'</b> · aangevraagde route: '+esc(m.routeId||'Nog niet gekozen')+'</p>').join('')||'<p>Geen modellen aangevraagd.</p>')+'</div>'+
 '<p><b>Taaktoewijzingen:</b> '+(Object.entries(prefs.assignments||{}).map(([task,model])=>esc(task)+': '+esc(model)).join(' · ')||'Geen uitzonderingen vastgelegd')+'</p>'+
 '<p><a href="https://www.bedrijfsgeheugen.nl/portaal?page=ai-modelkeuze" data-passport-model-choice>AI-modelkeuze aanpassen →</a></p>'+
 '<h4>Aansluitstatus voor jouw opgeslagen modelkeuze</h4><p>'+
 (activation?.readyForTest===true?'Servercontrole: klaar voor een handmatige test; nog geen uitvoeringsbewijs.':'Aansluiting niet volledig bewezen; zie de afzonderlijke controles.')+'</p>'+
 '<div class="trust-list">'+(arr(activation?.checks).map(c=>'<p><b>'+esc(c.label)+'</b> · '+esc(c.status||'UNKNOWN')+' · '+esc(c.detail||'')+'</p>').join('')||'<p>Actuele aansluitcontrole niet beschikbaar.</p>')+'</div>'+
 '<h4>AI-routes in het beveiligde register</h4><div class="trust-list">'+
 (arr(data?.aiRoutes).map(r=>'<details><summary><span><b>'+esc(r.name||r.useCaseId||'AI-toepassing')+'</b><small>'+esc(r.provider)+' · '+esc(r.modelId||'Model onbekend')+'</small></span><span class="trust-status warn">Geregistreerd; uitvoering niet bewezen</span></summary><div class="trust-detail">'+
 [['Doel',r.purpose],['Gegevens',arr(r.dataCategories).join(', ')],['Verwerking',r.processingScope],['Training',r.trainingUse],['Bewaren',r.retentionPolicy],['Doorgifte',r.crossBorderTransfer],['Subverwerkers',arr(r.subprocessors).join(', ')],['Beoordeeld',r.lastReviewedAt],['Herbeoordeling',r.nextReviewAt]].map(([label,value])=>'<p><b>'+label+':</b> '+esc(value||'Onbekend')+'</p>').join('')+evidenceLinks(r.evidenceUrls)+'</div></details>').join('')||'<p>Geen geregistreerde AI-routes beschikbaar; actief model niet bewezen.</p>')+
 '</div><p><b>Datapaspoort bronmoment:</b> '+esc(data?.generatedAt||'Onbekend')+' · <b>Brein / Powerhouse bronmoment:</b> '+esc(runtime.observability?.updatedAt||'Onbekend')+'</p>'+
 '<p>Het paspoort leest dezelfde klantstaat en beveiligde snapshots. De bestaande Heartbeat vernieuwt de provider-evidence; ontbrekend bewijs blijft onbekend.</p></section>';
}

function renderSovereignty(root,data,security,scope,state={},saveStatus='idle',activation=null){
 const providers=arr(data?.providers),flows=arr(data?.dataFlows),summary=data?.summary||{},policy=data?.policy||{};
 root.innerHTML=`<section class="trust-workspace">
  <div class="trust-hero"><div><span class="trust-kicker">Alleen ingelogde klantomgeving</span><h2>Data & AI Sovereignty</h2><p>Waar je data staat, waar verwerking plaatsvindt, welke AI/providers betrokken zijn en welke beperkingen aantoonbaar gelden.</p></div><div class="trust-scope"><small>Weergave</small><strong>${scope}</strong><span>Tenant-scoped en server-side geautoriseerd</span></div></div>
  ${renderModelContext(data,state,saveStatus,activation)}
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

// Read-only projection of canonical state; never starts a scheduler or inference.
const workspaces=new WeakMap();
export function disposeSecurityTrustWorkspace(root){workspaces.get(root)?.();}
export async function mountSecurityTrustWorkspace(root,{pageId='trust-center',stateClient,domainState,openPage,fetchImpl=globalThis.fetch,eventTarget=globalThis.window,documentTarget=globalThis.document,now=Date.now}={}){
 if(!root)throw new TypeError('SECURITY_TRUST_ROOT_REQUIRED');
 if(!stateClient?.authHeaders)throw new Error('SECURITY_TRUST_AUTH_CONTEXT_REQUIRED');
 disposeSecurityTrustWorkspace(root);
 root.innerHTML='<div class="trust-loading">Beveiligde trustdata laden…</div>';
 const initialUser=stateClient.currentUser?.(),subject=initialUser?.id;
 let alive=true,inFlight=null,lastRead=-Infinity,sovereignty=null,security=null,activation=null,refreshAgain=false,controller=null;
 const removers=[];
 const dispose=()=>{if(!alive)return;alive=false;controller?.abort();for(const off of removers)off?.();workspaces.delete(root);};
 workspaces.set(root,dispose);
 const authorized=()=>alive&&Boolean(subject)&&stateClient.currentUser?.()?.id===subject&&!stateClient.isDemo?.();
 const deny=()=>{root.innerHTML='<div class="trust-denied">Log opnieuw in om actuele trustdata te laden.</div>';dispose();};
 if(!authorized()){deny();return;}
 // Preferences and passport use the same tenant, including for administrators.
 const internal=pageId!=='data-ai-passport'&&isInternal(initialUser),suffix=internal?'?scope=bedrijfsgeheugen':'';
 const scope=internal?'Bedrijfsgeheugen · canonical':'Jouw organisatie';
 const preferences=()=>JSON.stringify(domainState?.get?.()?.portal?.aiModelPreferences);
 const saved=()=>['idle','saved'].includes(domainState?.status?.()||'idle');
 const render=()=>{
  if(!authorized()){if(alive)deny();return;}
  if(!sovereignty||!security)return;
  if(pageId==='data-ai-passport'){
   renderSovereignty(root,sovereignty,security,scope,domainState?.get?.()||{},domainState?.status?.()||'idle',activation);
   root.querySelector('[data-passport-model-choice]')?.addEventListener('click',event=>{if(openPage){event.preventDefault();openPage('ai-modelkeuze');}});
  }else renderSecurity(root,security,sovereignty,scope);
 };
 const refresh=({force=false}={})=>{
  if(!authorized()){if(alive)deny();return Promise.resolve();}
  if(inFlight){if(force)refreshAgain=true;return inFlight;}
  if(!force&&now()-lastRead<30000)return Promise.resolve();
  lastRead=now();
  const selectionAtRead=preferences(),savedAtRead=saved();
  controller=new AbortController();
  const timeout=setTimeout(()=>controller?.abort(),15000);
  inFlight=(async()=>{
   try{
    const headers=await stateClient.authHeaders();
    if(!authorized())return;
    if(!headers?.authorization)throw new Error('AUTHORIZATION_REQUIRED');
    const options={headers,credentials:'same-origin',cache:'no-store',signal:controller.signal};
    const [sovBody,secBody,activationBody]=await Promise.all([
     fetchImpl('/api/data-sovereignty'+suffix,options).then(readJson),
     fetchImpl('/api/security-trust'+suffix,options).then(readJson),
     pageId==='data-ai-passport'&&savedAtRead?fetchImpl('/api/tenant-ai-activation-status',options).then(readJson).catch(()=>null):null
    ]);
    if(!authorized())return;
    sovereignty=sovBody.snapshot||sovBody;security=secBody.snapshot||secBody;
    activation=savedAtRead&&saved()&&selectionAtRead===preferences()?activationBody:null;
    render();
   }catch(error){
    if(!authorized())return;
    sovereignty=null;security=null;activation=null;
    root.innerHTML='<div class="trust-denied"><b>Trustdata kon niet veilig worden geladen.</b><span>'+esc(error.message)+'</span></div>';
   }
  })().finally(()=>{
   clearTimeout(timeout);inFlight=null;controller=null;
   if(refreshAgain&&alive){refreshAgain=false;void refresh({force:true});}
  });
  return inFlight;
 };
 const watch=(target,event,fn)=>{target?.addEventListener?.(event,fn);removers.push(()=>target?.removeEventListener?.(event,fn));};
 const signature=()=>JSON.stringify([preferences(),domainState?.get?.()?.portal?.runtime?.observability?.updatedAt,domainState?.status?.()]);
 let previous=signature(),previousPreferences=preferences(),needsSelectionRead=!saved();
 let previousRuntime=domainState?.get?.()?.portal?.runtime?.observability?.updatedAt;
 if(domainState?.subscribe)removers.push(domainState.subscribe(()=>{
  if(!authorized()){if(alive)deny();return;}
  const next=signature();if(next===previous)return;previous=next;
  const currentPreferences=preferences(),changed=currentPreferences!==previousPreferences;previousPreferences=currentPreferences;
  if(changed){activation=null;needsSelectionRead=true;}
  const runtime=domainState?.get?.()?.portal?.runtime?.observability?.updatedAt;
  const runtimeChanged=runtime!==previousRuntime;previousRuntime=runtime;
  const savedChoiceChanged=needsSelectionRead&&saved();if(savedChoiceChanged)needsSelectionRead=false;
  render();if(savedChoiceChanged||runtimeChanged)void refresh({force:true});
 }));
 if(stateClient.subscribe)removers.push(stateClient.subscribe(()=>{if(!authorized()&&alive)deny();}));
 watch(eventTarget,'focus',()=>void refresh());
 watch(documentTarget,'visibilitychange',()=>{if(!documentTarget.hidden)void refresh();});
 watch(documentTarget,'bg:runtime-evidence',()=>void refresh({force:true}));
 watch(documentTarget,'bg:portal-identity-boundary',()=>{if(!authorized()&&alive)deny();});
 await refresh({force:true});
 return {dispose,refresh};
}
