import {buildOwnerOperatingModel,OWNER_AREAS} from './owner-operating-model.js';
import {askPortal} from './ask-portal.js';
import {renderAnswerAssurance} from './trusted-advisor-assurance.js';
import {navigatePortal} from './router.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const s=value=>esc(value||'—');
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
const button=(label,target)=>`<button class="owner-link" type="button" data-owner-route="${esc(target)}">${esc(label)} <span aria-hidden="true">→</span></button>`;
const links=key=>`<div class="owner-link-grid">${(routes[key]||[]).map(([label,target])=>button(label,target)).join('')}</div>`;
const card=(item,kind='signaal')=>`<article class="owner-fact"><div class="owner-fact-meta"><span>${esc(kind)}</span><span>Bronnen: ${Array.isArray(item.source_refs)?item.source_refs.length:0}</span></div><h4>${s(item.title||item.label||item.id)}</h4><p>${esc(text(item))}</p><small>Bewijs actueel · ${Math.round(Number(item.confidence)||0)*100}% vertrouwen</small></article>`;
const empty=(specific)=>`<div class="owner-unknown" role="status"><strong>Nog niet aantoonbaar</strong><p>${esc(specific)}</p></div>`;
const metric=(name,value,note)=>`<div class="owner-metric"><small>${esc(name)}</small><strong>${s(value)}</strong><span>${esc(note)}</span></div>`;
const categoryLabels={finance:'Marge en geld',groei:'Nieuwe omzet',klanten:'Klantbehoud',operatie:'Mensen en processen',risico:'Risicobeheersing',strategie:'Strategie'};

function companyPanel(m){
 return `<div class="owner-metrics">
  ${metric('Omzet deze maand','—','Wacht op geverifieerde financiële bron')}
  ${metric('Cashpositie over 30 dagen','—','Nog geen gevalideerde kasprognose')}
  ${metric('Brutomarge','—','Wacht op marge- en kostengrondslag')}
  ${metric('Besluiten nodig',m.ready?m.counts.besluiten:'—','Met actueel tenantbewijs')}
 </div>
 <div class="owner-two"><section><h3>Vandaag belangrijk</h3>${m.attention.length?m.attention.map(x=>card(x,x.attention_reason||'Prioriteit')).join(''):empty('Er zijn geen actuele, onafhankelijk onderbouwde topprioriteiten beschikbaar. Wij tonen geen aannames als bedrijfsfeiten.')}</section>
 <section><h3>Vooruitkijken</h3>${m.forecasts.length?m.forecasts.slice(0,3).map(x=>card(x,'Prognose')).join(''):empty('Koppel betrouwbare financiële en operationele tijdreeksen. Zonder bronbewijs wordt geen voorspelling gepubliceerd.')}</section></div>${links('bedrijf')}`;
}
function opportunitiesPanel(m){
 const cats=Object.keys(categoryLabels);
 return `<p class="owner-intro">Powerhouse zoekt kansen in omzet, klantbehoud, marge, capaciteit en risico. Alleen tenantgebonden signalen met geldig bewijs zijn hier zichtbaar.</p>
 <div class="owner-areas">${cats.map(key=>`<article><span>${esc(categoryLabels[key])}</span><strong>${m.categories[key].length}</strong><small>actuele signalen / acties</small></article>`).join('')}</div>
 <section><h3>Onderbouwde kansen</h3>${m.opportunities.length?m.opportunities.slice(0,10).map(x=>card(x,categoryLabels[x.ownerCategory]||'Kans')).join(''):empty('Er zijn nog geen geverifieerde verkoop-, marge- of klantbehoudkansen. Koppel CRM, ERP en verkoopgegevens om deze te onderzoeken.')}</section>${links('kansen')}`;
}
function actionsPanel(m){
 return `<p class="owner-intro">Van signaal naar voorstel, bevoegd besluit, uitvoering, provider-readback en gerealiseerde waarde. Een voorstel is nooit automatisch een verzonden bericht of uitgevoerde wijziging.</p>
 <div class="owner-metrics">${metric('Voorstellen met bewijs',m.ready?m.counts.acties:'—','Nog niet gelijk aan uitgevoerd')}${metric('Goedkeuring nodig',m.ready?m.counts.besluiten:'—','Externe of materiële acties')}${metric('Bewezen uitkomsten',m.ready?m.counts.uitkomsten:'—','Met bronreferenties')}${metric('Automatisch uitgevoerd','—','Alleen met onafhankelijke provider-readback')}</div>
 <div class="owner-policy"><article><h3>1 · Binnen beleid</h3><p>Uitsluitend laag-risico interne handelingen die voorafgaande identiteit, rechten en beleidstoets passeren. Een classificatie is geen uitvoeringsbewijs.</p></article><article><h3>2 · Eerst akkoord</h3><p>Offertes, acquisitie, prijzen, contracten en klantcommunicatie worden voorbereid en pas na aantoonbare autorisatie aangeboden voor uitvoering.</p></article><article><h3>3 · Beschermd</h3><p>Juridische/financiële verplichtingen, personeelsbesluiten en vertrouwelijke informatie vereisen een bevoegde menselijke beslissing en gescheiden uitvoeringscontrole.</p></article></div>
 <section><h3>Actievoorstellen</h3>${m.actions.length?m.actions.slice(0,10).map(x=>`<article class="owner-fact"><div class="owner-fact-meta"><span>${x.ownerSafety.level==='goedkeuring'?'Akkoord nodig':x.ownerSafety.level==='binnen-beleid'?'Beleidstoets mogelijk':'Niet uitvoerbaar'}</span><span>${esc(categoryLabels[x.ownerCategory]||'Strategie')}</span></div><h4>${s(x.title||x.id)}</h4><p>${esc(text(x))}</p>${button('Open besluit en audittrail','actieve-acties')}</article>`).join(''):empty('Er zijn geen bewijsbare actievoorstellen. Er wordt niets automatisch uitgevoerd of als succesvol aangemerkt.')}</section>
 <section><h3>Gerealiseerde resultaten</h3>${m.outcomes.length?m.outcomes.slice(0,5).map(x=>card(x,'Outcome geverifieerd')).join(''):empty('Nog geen aantoonbaar gerealiseerde besparing of extra omzet. Verwachtingen worden niet bij werkelijk resultaat opgeteld.')}</section>${links('acties')}`;
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
export function renderOwnerOperatingHtml(state={}, {compact=false,selected='bedrijf'}={}){
 const m=buildOwnerOperatingModel(state);
 const status=m.ready?`${m.proof.verified} actuele brononderbouwde onderdelen · ${m.proof.stale} verouderd · ${m.proof.unavailable} zonder bewijs`:'Geen geauthenticeerde bedrijfsprojectie beschikbaar';
 if(compact)return `<div class="owner-heading"><div><span class="owner-eyebrow">POWERHOUSE · JOUW DIGITALE RECHTERHAND</span><h2>Jij onderneemt. Powerhouse helpt je vooruit.</h2><p>Wat vraagt jouw aandacht? Wat kan voorbereid worden? Wat is aantoonbaar afgerond?</p></div>${button('Open mijn bedrijfsbesturing','ondernemerscockpit')}</div><div class="owner-status" role="status">${esc(status)}</div><div class="owner-compact-grid">${OWNER_AREAS.map(a=>button(a.label,'ondernemerscockpit')).join('')}</div>${m.attention[0]?`<p class="owner-daily"><strong>Nu relevant:</strong> ${s(m.attention[0].title||m.attention[0].id)}</p>`:'<p class="owner-daily">Nog geen geverifieerde prioriteit. Begin bij je bedrijfsgegevens en koppelingen.</p>'}`;
 const bodies={bedrijf:companyPanel(m),kansen:opportunitiesPanel(m),acties:actionsPanel(m),adviseur:advisorPanel(),instellingen:settingsPanel()};
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
export function mountOwnerOperatingSystem(root,{state={},compact=false}={}){
 if(!root?.querySelector)return null;
 const doc=root.ownerDocument||globalThis.document;ensureCss(doc);
 let host=root.querySelector(':scope > [data-owner-os]');
 if(!host){host=doc.createElement('section');host.dataset.ownerOs='v1';host.className='owner-os';host.setAttribute('aria-label','Powerhouse ondernemersbesturing');if(compact&&root.querySelector('.topbar'))root.querySelector('.topbar').after(host);else root.prepend(host);}
 host.dataset.ownerCompact=String(compact);
 const selected=OWNER_AREAS.some(a=>a.id===host.dataset.ownerSelected)?host.dataset.ownerSelected:'bedrijf';
 host.innerHTML=renderOwnerOperatingHtml(state,{compact,selected});
 if(host.dataset.ownerBound!=='true'){
  host.dataset.ownerBound='true';
  host.addEventListener('click',event=>{
   const target=event.target.closest('[data-owner-route]');
   if(target){navigatePortal(target.dataset.ownerRoute);return;}
   const tab=event.target.closest('[data-owner-tab]');
   if(tab){host.dataset.ownerSelected=tab.dataset.ownerTab;host.querySelectorAll('[data-owner-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===tab)));host.querySelectorAll('[data-owner-panel]').forEach(p=>{p.hidden=p.dataset.ownerPanel!==tab.dataset.ownerTab});return;}
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
