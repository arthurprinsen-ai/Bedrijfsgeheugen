import {buildOwnerOperatingModel,OWNER_AREAS} from './owner-operating-model.js';
import {askPortal} from './ask-portal.js';
import {renderAnswerAssurance} from './trusted-advisor-assurance.js';
import {navigatePortal} from './router.js';
import {createOwnerFinancialClient} from './owner-financial-truth.js';
import {createDecisionCommandClient} from './company-cockpit-ui.js';
import {mapRuntimeProjection} from './runtime-evidence.js';
import {buildCompanyCockpit} from './company-cockpit.js';

let pendingOwnerArea='bedrijf';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const s=value=>esc(value===null||value===undefined||value===''?'—':value);
const text=item=>item?.explanation||item?.summary||item?.next_action||'Er is geen nadere toelichting uit de bron beschikbaar.';
const quickQuestions=[
 'Waarom verdient mijn bedrijf minder terwijl de omzet stijgt?',
 'Welke bestaande klanten bieden een nieuwe omzetkans?',
 'Welke problemen moet ik deze week oplossen?',
 'Hoe ontwikkelt mijn cashflow zich de komende dertig dagen?',
 'Wat verandert er als ik extra medewerkers aanneem?'
];
const routes={
 bedrijf:[['Bedrijfssituatie','bedrijfssituatie'],['Financiële inzichten','cijfers-maatstaven'],['Scenario’s doorrekenen','os:scenario-simulator']],
 kansen:[['Sales & klantbehoud','sales-intelligence'],['Kansenkaart','kansenkaart'],['Impact Engine','os:impact-engine']],
 acties:[['Alle acties & besluiten','actieve-acties'],['Werkstromen','taken-werkstromen'],['Bewijs & resultaten','outcomes-evidence']],
 instellingen:[['Data & koppelingen','koppelingen'],['AI-modellen & datasoevereiniteit','ai-modelkeuze'],['Security & toegang','trust-center'],['Mijn abonnement','billing']]
};
const button=(label,target,area='')=>`<button class="owner-link" type="button" data-owner-route="${esc(target)}"${area?` data-owner-area="${esc(area)}"`:''}>${esc(label)} <span aria-hidden="true">→</span></button>`;
const links=key=>`<div class="owner-link-grid">${(routes[key]||[]).map(([label,target])=>button(label,target)).join('')}</div>`;
const card=(item,kind='signaal')=>`<article class="owner-fact"><div class="owner-fact-meta"><span>${esc(kind)}</span><span>Bronnen: ${Array.isArray(item.source_refs)?item.source_refs.length:0}</span></div><h4>${s(item.title||item.label||item.id)}</h4><p>${esc(text(item))}</p><small>Bewijs actueel · ${Math.round(Number(item.confidence)||0)*100}% vertrouwen</small></article>`;
const empty=(specific)=>`<div class="owner-unknown" role="status"><strong>Nog niet aantoonbaar</strong><p>${esc(specific)}</p></div>`;
const metric=(name,value,note)=>`<div class="owner-metric"><small>${esc(name)}</small><strong>${s(value)}</strong><span>${esc(note)}</span></div>`;
const categoryLabels={finance:'Marge en geld',groei:'Nieuwe omzet',klanten:'Klantbehoud',operatie:'Mensen en processen',risico:'Risicobeheersing',strategie:'Strategie'};

const financeNote=(fact,otherwise)=>fact?`${fact.note} · bron ${fact.source} · gecontroleerd ${fact.verifiedAt}`:otherwise;
function companyPanel(m,financial=null,financialStatus=''){
 const revenue=financial?.revenue||null,cash=financial?.cash||null,margin=financial?.margin||null;
 return `<div class="owner-metrics">
  ${metric(revenue?'Omzet · laatste bronperiode':'Omzet',revenue?.value||'—',financeNote(revenue,'Geen geverifieerde financiële bron'))}
  ${metric(cash?'Kasprognose · eerste toekomstige periode':'Kasprognose',cash?.value||'—',financeNote(cash,'Nog geen onafhankelijk gevalideerde kasprognose'))}
  ${metric(margin?'Brutomarge · laatste bronperiode':'Brutomarge',margin?.value||'—',financeNote(margin,'Nog geen geverifieerde margeberekening'))}
  ${metric('Besluiten nodig',m.ready?m.counts.besluiten:'—','Met actueel tenantbewijs')}
 </div><p class="owner-finance-status" role="status">${esc(financialStatus||'Financiële bron: alleen geverifieerde gegevens komen in beeld.')}</p>
 <div class="owner-two"><section><h3>Vandaag belangrijk</h3>${m.attention.length?m.attention.map(x=>card(x,x.attention_reason||'Prioriteit')).join(''):empty('Er zijn geen actuele topprioriteiten met herleidbare bronregistratie beschikbaar. Wij tonen geen aannames als bedrijfsfeiten.')}</section>
 <section><h3>Vooruitkijken</h3>${m.forecasts.length?m.forecasts.slice(0,3).map(x=>card(x,'Prognose')).join(''):empty('Koppel betrouwbare financiële en operationele tijdreeksen. Zonder bronbewijs wordt geen voorspelling gepubliceerd.')}</section></div>${links('bedrijf')}`;
}
function opportunitiesPanel(m){
 const cats=Object.keys(categoryLabels);
 return `<p class="owner-intro">Powerhouse zoekt kansen in omzet, klantbehoud, marge, capaciteit en risico. Alleen tenantgebonden signalen met geldig bewijs zijn hier zichtbaar.</p>
 <div class="owner-areas">${cats.map(key=>`<article><span>${esc(categoryLabels[key])}</span><strong>${m.categories[key].length}</strong><small>actuele signalen / acties</small></article>`).join('')}</div>
 <section><h3>Onderbouwde kansen</h3>${m.opportunities.length?m.opportunities.slice(0,10).map(x=>card(x,categoryLabels[x.ownerCategory]||'Kans')).join(''):empty('Er zijn nog geen geverifieerde verkoop-, marge- of klantbehoudkansen. Koppel CRM, ERP en verkoopgegevens om deze te onderzoeken.')}</section>${links('kansen')}`;
}
export function renderOwnerCanonicalDecisions(runtime=null,status='Nog niet opgehaald'){
 const decisions=Array.isArray(runtime?.decisions?.items)?runtime.decisions.items:[];
 const top=decisions.filter(item=>item?.id&&item?.status).slice(0,12);
 return `<section class="owner-canonical-decisions" aria-label="Bevoegde besluiten uit Brain">
  <div class="owner-decision-head"><h3>Mijn besluiten · Brain</h3><button type="button" class="owner-link" data-owner-load-decisions>Vernieuw de live besluitstatus ↻</button></div>
  <p role="status" data-owner-decision-status>${esc(status)}</p>
  ${top.length?top.map(d=>`<article class="owner-fact" data-owner-decision="${esc(d.id)}">
   <div class="owner-fact-meta"><span>${esc(d.status)}</span><span>${esc(d.owner||'')}</span></div>
   <h4>${s(d.title||d.id)}</h4><p>${esc((Array.isArray(d.reasons)?d.reasons.join(' · '):d.nextAction)||'Besluitinformatie uit de geautoriseerde Brain-projectie.')}</p>
   ${d.status==='PROPOSED'&&!d.blockedBy&&!String(d.dependencyState||'').startsWith('BLOCKED')?
    `<div class="owner-decision-commands"><button type="button" data-owner-command="APPROVE" data-owner-decision-id="${esc(d.id)}" data-owner-expected-status="${esc(d.status)}">Goedkeuren</button>
    <button type="button" data-owner-command="REJECT" data-owner-decision-id="${esc(d.id)}" data-owner-expected-status="${esc(d.status)}">Afwijzen</button></div>`:''}
  </article>`).join(''):empty('Geen huidige besluiten teruggelezen uit de tenantgebonden Brain-projectie.')}
 </section>`;
}
function actionsPanel(m,runtime=null,decisionStatus='Nog niet opgehaald'){
 return `<p class="owner-intro">Van signaal naar voorstel, bevoegd besluit, uitvoering, provider-readback en gerealiseerde waarde. Een voorstel is nooit automatisch een verzonden bericht of uitgevoerde wijziging.</p>
 <div class="owner-metrics">${metric('Voorstellen met bewijs',m.ready?m.counts.acties:'—','Nog niet gelijk aan uitgevoerd')}${metric('Goedkeuring nodig',m.ready?m.counts.besluiten:'—','Externe of materiële acties')}${metric('Bewezen uitkomsten',m.ready?m.counts.uitkomsten:'—','Met bronreferenties')}${metric('Automatisch uitgevoerd','—','Alleen met onafhankelijke provider-readback')}</div>
 <div class="owner-policy"><article><h3>1 · Binnen beleid</h3><p>Uitsluitend laag-risico interne handelingen die voorafgaande identiteit, rechten en beleidstoets passeren. Een classificatie is geen uitvoeringsbewijs.</p></article><article><h3>2 · Eerst akkoord</h3><p>Offertes, acquisitie, prijzen, contracten en klantcommunicatie worden voorbereid en pas na aantoonbare autorisatie aangeboden voor uitvoering.</p></article><article><h3>3 · Beschermd</h3><p>Juridische/financiële verplichtingen, personeelsbesluiten en vertrouwelijke informatie vereisen een bevoegde menselijke beslissing en gescheiden uitvoeringscontrole.</p></article></div>
 <section><h3>Actievoorstellen</h3>${m.actions.length?m.actions.slice(0,10).map(x=>`<article class="owner-fact"><div class="owner-fact-meta"><span>${x.ownerSafety.level==='goedkeuring'?'Akkoord nodig':x.ownerSafety.level==='binnen-beleid'?'Beleidstoets mogelijk':x.ownerSafety.level==='inzage'?'Alleen inzage':'Niet uitvoerbaar'}</span><span>${esc(categoryLabels[x.ownerCategory]||'Strategie')}</span></div><h4>${s(x.title||x.id)}</h4><p>${esc(text(x))}</p>${button('Open besluit en audittrail','actieve-acties')}</article>`).join(''):empty('Er zijn geen bewijsbare actievoorstellen. Er wordt niets automatisch uitgevoerd of als succesvol aangemerkt.')}</section>
 <section><h3>Gerealiseerde resultaten</h3>${m.outcomes.length?m.outcomes.slice(0,5).map(x=>card(x,'Outcome geverifieerd')).join(''):empty('Nog geen geregistreerde en geverifieerde besparing of extra omzet. Verwachtingen worden niet bij werkelijk resultaat opgeteld.')}</section>${renderOwnerCanonicalDecisions(runtime,decisionStatus)}${links('acties')}`;
}
function advisorPanel(){
 return `<p class="owner-intro">Stel een vraag in gewone taal. De bestaande beveiligde vraagfunctie gebruikt uitsluitend de toegestane bedrijfscontext. Ontbrekende data of een niet-geautoriseerd model leidt tot een duidelijke blokkade, nooit een stille fallback.</p>
 <div class="owner-prompts">${quickQuestions.map((q,i)=>`<button type="button" data-owner-question="${i}">${esc(q)}</button>`).join('')}</div>
 <form class="owner-question-form"><label for="ownerQuestion">Wat wil je weten of beslissen?</label><div><input id="ownerQuestion" name="question" maxlength="500" required placeholder="Vraag over je eigen bedrijf, risico's of doelen"><button type="submit">Vraag Powerhouse</button></div></form>
 <output class="owner-answer" aria-live="polite" data-owner-answer>Een antwoord wordt pas getoond na een geslaagde, geautoriseerde bronopvraag.</output>
 <div class="owner-links">${button('Bekijk scenario’s','os:scenario-simulator')}${button('Bekijk bronbewijs','os:evidence-health')}</div>`;
}
function settingsPanel(){
 return `<div class="owner-policy"><article><h3>Data & koppelingen</h3><p>Bekijk per bron status, eigenaar, actualiteit en toestemming. Zonder aansluiting geen verzonnen bedrijfsresultaten.</p></article><article><h3>Bevoegdheden</h3><p>Externe acties vereisen expliciete, herleidbare goedkeuring. Het portaal mag geen gebruikersrol of klantcontract veronderstellen.</p></article><article><h3>AI & soevereiniteit</h3><p>Modelkeuze is een aanvraag: activering vereist onafhankelijk geverifieerde provider, contract, klantrechten en datalocatie. Geen impliciete AI-dataoverdracht.</p></article></div>
 <h3>Beheer de bestaande instellingen</h3>${links('instellingen')}`;
}
export function renderOwnerOperatingHtml(state={}, {compact=false,selected='bedrijf',now=Date.now(),financial=null,financialStatus='',decisionRuntime=null,decisionStatus='Nog niet opgehaald'}={}){
 const m=buildOwnerOperatingModel(state,{now});
 const status=m.ready?`${m.proof.verified} actuele brononderbouwde onderdelen · ${m.proof.stale} verouderd · ${m.proof.unavailable} zonder bewijs`:'Geen geauthenticeerde bedrijfsprojectie beschikbaar';
 if(compact)return `<div class="owner-heading"><div><span class="owner-eyebrow">POWERHOUSE · JOUW DIGITALE RECHTERHAND</span><h2>Jij onderneemt. Powerhouse helpt je vooruit.</h2><p>Wat vraagt jouw aandacht? Wat kan voorbereid worden? Wat is aantoonbaar afgerond?</p></div>${button('Open mijn bedrijfsbesturing','ondernemerscockpit')}</div><div class="owner-status" role="status">${esc(status)}</div><div class="owner-compact-grid">${OWNER_AREAS.map(a=>button(a.label,'ondernemerscockpit',a.id)).join('')}</div>${m.attention[0]?`<p class="owner-daily"><strong>Nu relevant:</strong> ${s(m.attention[0].title||m.attention[0].id)}</p>`:'<p class="owner-daily">Nog geen geverifieerde prioriteit. Begin bij je bedrijfsgegevens en koppelingen.</p>'}`;
 const bodies={bedrijf:companyPanel(m,financial,financialStatus),kansen:opportunitiesPanel(m),acties:actionsPanel(m,decisionRuntime,decisionStatus),adviseur:advisorPanel(),instellingen:settingsPanel()};
 return `<div class="owner-heading"><div><span class="owner-eyebrow">BEDRIJFSGEHEUGEN · POWERHOUSE</span><h2>Mijn bedrijfsbesturing</h2><p>Meer omzet, betere marges, grip op uitvoering en minder handmatig werk — op basis van aantoonbaar beschikbare informatie.</p></div></div>
 <div class="owner-status" role="status">${esc(status)}</div>
 <div role="tablist" class="owner-tabs" aria-label="Mijn bedrijfsbesturing">${OWNER_AREAS.map(a=>`<button type="button" role="tab" id="owner-tab-${a.id}" aria-controls="owner-panel-${a.id}" aria-selected="${selected===a.id}" data-owner-tab="${a.id}">${esc(a.label)}</button>`).join('')}</div>
 ${OWNER_AREAS.map(a=>`<section class="owner-panel" id="owner-panel-${a.id}" role="tabpanel" aria-labelledby="owner-tab-${a.id}" ${selected!==a.id?'hidden':''} data-owner-panel="${a.id}">${bodies[a.id]}</section>`).join('')}
 <footer class="owner-footer">Geen demo-cijfers in klantweergaven. Alleen uitvoering met autorisatie, ontvangstbevestiging en onafhankelijk bewijs telt als gerealiseerd resultaat.</footer>`;
}
function ensureCss(doc){
 if(!doc?.head||doc.querySelector('link[data-owner-os-css]'))return;
 const l=doc.createElement('link');l.rel='stylesheet';l.href='./owner-operating-system.css';l.dataset.ownerOsCss='true';doc.head.appendChild(l);
}
export function mountOwnerOperatingSystem(root,{state={},compact=false,stateClient=null,fetchImpl=globalThis.fetch}={}){
 if(!root?.querySelector)return null;
 const doc=root.ownerDocument||globalThis.document;ensureCss(doc);
 let host=root.querySelector(':scope > [data-owner-os]');
 if(!host){host=doc.createElement('section');host.dataset.ownerOs='v1';host.className='owner-os';host.setAttribute('aria-label','Powerhouse ondernemersbesturing');if(compact&&root.querySelector('.topbar'))root.querySelector('.topbar').after(host);else root.prepend(host);}
 host.dataset.ownerCompact=String(compact);
 let financial=null,financeStatus='Financiële gegevens nog niet ingelezen',decisionRuntime=null,decisionStatus='Klik op vernieuwen om actuele besluiten op te halen',decisionLoading=false,financeLoading=false;
 const selected=OWNER_AREAS.some(a=>a.id===pendingOwnerArea)?pendingOwnerArea:'bedrijf';
 host.dataset.ownerSelected=selected;pendingOwnerArea='bedrijf';
 const refresh=()=>{if(!host.isConnected)return;host.innerHTML=renderOwnerOperatingHtml(state,{compact,selected:host.dataset.ownerSelected,financial,financialStatus:financeStatus,decisionRuntime,decisionStatus});};
 refresh();
 const authHeadersProvider=()=>stateClient?.authHeaders?.()||Promise.resolve({});
 const decisionClient=createDecisionCommandClient({fetchImpl,authHeadersProvider});
 async function loadDecisions(){
  if(decisionLoading)return;
  decisionLoading=true;decisionStatus='Actuele besluiten ophalen…';refresh();
  try{
   const headers=await authHeadersProvider();
   if(!headers?.authorization)throw new Error('AUTH_REQUIRED');
   const projection=await decisionClient.loadProjection();
   const expected=String(state?.tenant_id||state?.powerhouse?.tenant_id||'');
   if(projection?.tenantId&&expected&&String(projection.tenantId)!==expected)throw new Error('TENANT_SCOPE_MISMATCH');
   decisionRuntime=mapRuntimeProjection(projection);decisionStatus='Teruggelezen uit de beveiligde Brain-besluitregistratie';
  }catch(error){decisionRuntime=null;decisionStatus=`Niet beschikbaar (${String(error?.message||'ONBEKEND')}). Geen besluit uitgevoerd.`;}
  finally{decisionLoading=false;refresh();}
 }
 if(!compact&&stateClient?.authHeaders&&!stateClient?.isDemo?.()&&['authenticated','empty'].includes(stateClient?.getSnapshot?.()?.mode)){
  financeLoading=true;
  const financialClient=createOwnerFinancialClient({fetchImpl,authHeadersProvider});
  financialClient.load(String(state?.tenant_id||state?.powerhouse?.tenant_id||'')).then(value=>{
    financial=value;financeStatus=value.records?`${value.records} onafhankelijk gevalideerde prognosereeksen; historische waarnemingen en prognoses duidelijk onderscheiden`:'Geen gevalideerde financiële reeks in de canonieke bron';
  }).catch(error=>{financial=null;financeStatus=`Financiële bron niet beschikbaar (${String(error?.message||'onbekend')}). Geen cijfers geschat.`;})
   .finally(()=>{financeLoading=false;refresh();});
 }
 if(host.dataset.ownerBound!=='true'){
  host.dataset.ownerBound='true';
  host.addEventListener('click',event=>{
   const target=event.target.closest('[data-owner-route]');
   if(target){const area=target.dataset.ownerArea; if(area&&OWNER_AREAS.some(a=>a.id===area))pendingOwnerArea=area;
    navigatePortal(target.dataset.ownerRoute);
    if(area)doc.querySelector('#portalView [data-owner-tab="'+area+'"]')?.click();
    return;}
   const tab=event.target.closest('[data-owner-tab]');
   if(tab){host.dataset.ownerSelected=tab.dataset.ownerTab;host.querySelectorAll('[data-owner-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===tab)));host.querySelectorAll('[data-owner-panel]').forEach(p=>{p.hidden=p.dataset.ownerPanel!==tab.dataset.ownerTab});if(tab.dataset.ownerTab==='acties'&&!decisionRuntime&&!decisionLoading)void loadDecisions();return;}
   const refreshDecisions=event.target.closest('[data-owner-load-decisions]');
   if(refreshDecisions){void loadDecisions();return;}
   const commandButton=event.target.closest('[data-owner-command]');
   if(commandButton){
    if(decisionLoading)return;
    const command=commandButton.dataset.ownerCommand;
    const decisionId=commandButton.dataset.ownerDecisionId;
    const expectedStatus=commandButton.dataset.ownerExpectedStatus;
    if(!['APPROVE','REJECT'].includes(command)||!decisionId||expectedStatus!=='PROPOSED')return;
    const old=decisionRuntime?.decisions?.items?.find(item=>item.id===decisionId);
    if(!old||old.status!==expectedStatus){decisionStatus='Besluit verouderd: vernieuw eerst de Brain-status.';refresh();return;}
    decisionLoading=true;commandButton.disabled=true;decisionStatus='Besluit indienen en autorisatie teruglezen…';
    void decisionClient.command({command,decisionId,expectedStatus}).then(({projection})=>{
      const expected=String(state?.tenant_id||state?.powerhouse?.tenant_id||'');
      if(projection?.tenantId&&expected&&String(projection.tenantId)!==expected)throw new Error('TENANT_SCOPE_MISMATCH');
      decisionRuntime=mapRuntimeProjection(projection);
      const newItem=decisionRuntime?.decisions?.items?.find(item=>item.id===decisionId);
      decisionStatus=newItem&&newItem.status!==expectedStatus?
        `Besluit ${command==='APPROVE'?'goedgekeurd':'afgewezen'} en bijgewerkt in Brain (${newItem.status}). Geen externe verzending geclaimd.`:
        'Besluitaanvraag verwerkt, maar de nieuwe status is niet onafhankelijk teruggelezen. Geen uitvoering geclaimd.';
    }).catch(error=>{decisionStatus=`Besluit geweigerd of niet aantoonbaar opgeslagen: ${String(error?.message||'ONBEKEND')}`;})
      .finally(()=>{decisionLoading=false;refresh();});
    return;
   }
   const q=event.target.closest('[data-owner-question]');
   if(q){const input=host.querySelector('#ownerQuestion');if(input){input.value=quickQuestions[Number(q.dataset.ownerQuestion)]||'';input.focus();}}
  });
  host.addEventListener('submit',async event=>{
   if(!event.target.matches('.owner-question-form'))return;
   event.preventDefault();const form=event.target,input=form.querySelector('input'),btn=form.querySelector('button'),out=host.querySelector('[data-owner-answer]');if(!input||!out||!btn)return;
   const question=input.value.trim();if(!question)return;
   btn.disabled=true;out.textContent='Ik controleer de toegestane bedrijfsgegevens…';
   try{const answer=await askPortal(question);if(!out.isConnected)return;out.innerHTML=answer.text?`<p>${esc(answer.text)}</p>${renderAnswerAssurance(answer.assurance||{})}`:'Geen onderbouwd antwoord beschikbaar.';}
   catch(error){if(out.isConnected)out.textContent=`Geen geautoriseerd antwoord beschikbaar (${error.message}). Er is geen alternatieve AI-provider gebruikt.`;}
   finally{if(btn.isConnected)btn.disabled=false;}
  });
 }
 return host;
}
