import {KOPPELING_TEMPLATES,findTemplate} from './templates.js';
import {createWizardState,applyAnswer,nextQuestion,toConnectorDefinition,PHASES} from './wizard.js';
import {askConnectorGuide} from './ai-guide.js';
import {createConnectorApi} from './api.js';
import {toHumanStatus,activationEvidenceId} from './status.js';
import {CONNECTOR_PORTAL_PAGES} from './portal-routing.js';
import {connectorRecoveryAdvice} from './recovery.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const STEP_LABELS={source:'Bron',selection:'Selectie',information:'Informatie',target:'Doel',schedule:'Planning',test:'Test'};
const EVIDENCE_LABELS={source:'Bron gelezen',extractor:'Informatie herkend',validation:'Gecontroleerd',target:'Bestemming getest'};

export const WIZARD_CSS=`.bg-kw{margin-top:1.2rem;border-top:1px solid var(--lijn,#ddd);padding-top:1.2rem}.bg-kw button,.bg-kw textarea,.bg-kw select,.bg-kw summary{min-height:44px}.bg-kw__head{display:flex;gap:1rem;justify-content:space-between;align-items:flex-start}.bg-kw__head h2{margin:.15rem 0 .45rem}.bg-kw__eyebrow{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--grijs,#666)}.bg-kw__help{flex:0 0 44px;width:44px;height:44px;border:1px solid var(--lijn,#ddd);border-radius:50%;background:#fff;font-weight:700;font-size:1rem;font-family:inherit;cursor:pointer}.bg-kw__helptext{margin:.75rem 0;padding:.8rem;border-left:3px solid var(--blauw,#2742d6);background:var(--papier,#fbfaf7)}.bg-kw__progress{list-style:none;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.35rem;margin:1rem 0}.bg-kw__progress li{font-size:.72rem;color:var(--grijs,#666);display:flex;gap:.35rem;align-items:center;min-width:0}.bg-kw__progress li span{display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--lijn,#ddd);border-radius:50%;background:#fff;flex:0 0 24px}.bg-kw__progress li[aria-current=step]{color:var(--inkt,#14171a);font-weight:700}.bg-kw__progress li[aria-current=step] span{background:var(--inkt,#14171a);color:#fff}.bg-kw__routes{display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;margin:1rem 0}.bg-kw__route{min-height:96px;text-align:left;border:1px solid var(--lijn,#ddd);background:#fff;border-radius:8px;padding:.85rem;cursor:pointer}.bg-kw__route strong,.bg-kw__route span{display:block}.bg-kw__route span{font-size:.8rem;color:var(--grijs,#666);margin-top:.25rem}.bg-kw__route--primary{border-color:var(--inkt,#14171a)}.bg-kw__workspace{display:grid;gap:.65rem}.bg-kw__intent span{display:block;font-weight:700;margin-bottom:.35rem}.bg-kw textarea{width:100%;padding:.7rem;border:1px solid var(--lijn,#ddd);border-radius:6px;font:inherit;resize:vertical}.bg-kw__message{min-height:1.5em;font-size:.86rem;color:var(--grijs,#666)}.bg-kw__templates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin:.8rem 0}.bg-kw__template{border:1px solid var(--lijn,#ddd);border-radius:6px;background:#fff;padding:.75rem;text-align:left;cursor:pointer}.bg-kw__template strong,.bg-kw__template span{display:block}.bg-kw__template span{font-size:.78rem;color:var(--grijs,#666);margin-top:.2rem}.bg-kw__question{padding:.85rem;background:var(--papier,#fbfaf7);border-radius:6px}.bg-kw__question label{display:block;font-weight:700;margin-bottom:.4rem}.bg-kw__question select{width:100%}.bg-kw__evidence{margin-top:1rem}.bg-kw__evidence-card{padding:.9rem;border:1px solid var(--lijn,#ddd);border-radius:8px;background:#fff}.bg-kw__evidence-flow{list-style:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.45rem;margin:.7rem 0 0}.bg-kw__evidence-flow li{display:flex;gap:.4rem;align-items:flex-start;padding:.55rem;background:var(--papier,#fbfaf7);border-radius:6px;min-width:0}.bg-kw__evidence-flow li>span{font-weight:800}.bg-kw__evidence-flow strong,.bg-kw__evidence-flow small{display:block}.bg-kw__evidence-flow small{font-size:.65rem;color:var(--grijs,#666);overflow-wrap:anywhere}.bg-kw__execution{font-size:.72rem;color:var(--grijs,#666);margin-top:.55rem;overflow-wrap:anywhere}.bg-kw__evidence-empty{font-size:.8rem;color:var(--grijs,#666)}.bg-kw__activation{margin-top:1rem}.bg-kw__activation p{font-size:.8rem;color:var(--grijs,#666);margin-top:.35rem}.bg-kw__advanced{margin-top:1rem}.bg-kw__advanced pre{white-space:pre-wrap;word-break:break-word;font-size:.72rem;margin-top:.5rem}.bg-kw button:focus-visible,.bg-kw textarea:focus-visible,.bg-kw select:focus-visible,.bg-kw summary:focus-visible{outline:3px solid var(--geel,#ffe86b);outline-offset:2px}@media(max-width:700px){.bg-kw__routes,.bg-kw__templates,.bg-kw__evidence-flow{grid-template-columns:1fr}.bg-kw__progress{grid-template-columns:repeat(3,1fr);row-gap:.55rem}.bg-kw__progress li{font-size:.68rem}.bg-kw__route{min-height:76px}.bg-kw__head{align-items:flex-start}.bg-kw__activation .knop,.bg-kw__question .knop,.bg-kw__question select{width:100%}}`;
export const DATA_USE_CSS=`.bg-kw__privacy{margin:1.2rem 0;padding:1rem;border:1px solid #cad4df;border-radius:18px;background:linear-gradient(130deg,#f4f8fc,#fff);min-width:0}.bg-kw__privacy legend{font-weight:800;padding:0 .3rem}.bg-kw__privacy>p{font-size:.88rem;max-width:58ch}.bg-kw__privacy-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem}.bg-kw__privacy-grid label{display:flex;gap:.6rem;align-items:flex-start;padding:1rem;border:1px solid #cbd5df;border-radius:14px;background:#fff;cursor:pointer}.bg-kw__privacy-grid label:has(input:checked){border:2px solid #2742d6;background:#f2f5ff}.bg-kw__privacy-grid input{accent-color:#2742d6;min-width:20px;min-height:20px;margin-top:2px}.bg-kw__privacy-grid strong,.bg-kw__privacy-grid small{display:block}.bg-kw__privacy-grid small{font-size:.78rem;color:#4b5563;margin-top:.3rem}.bg-kw__sovereignty{margin-top:.8rem;display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;font-size:.81rem}.bg-kw__sovereignty a{font-weight:700;text-underline-offset:3px}.bg-kw__sovereignty-status{border-radius:999px;background:#ecf0f4;padding:.3rem .6rem}.bg-kw__privacy-note{font-size:.78rem;color:#4b5563}@media(max-width:750px){.bg-kw__privacy-grid{grid-template-columns:1fr}.bg-kw__privacy{padding:.8rem}}`;
export const ROUTING_CSS=`.bg-kw__routing{border:1px solid #cad4df;border-radius:16px;padding:1rem;margin:.8rem 0;background:#fff}.bg-kw__routing legend{font-weight:800}.bg-kw__routechoices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}.bg-kw__routechoices label{display:flex;align-items:flex-start;gap:.55rem;border:1px solid #d8e0e9;border-radius:12px;padding:.7rem;cursor:pointer}.bg-kw__routechoices input{min-width:20px;min-height:20px;accent-color:#2742d6}.bg-kw__routechoices label:has(input:checked){background:#f1f5ff;border-color:#2742d6}.bg-kw__routechoices small{display:block;color:#4b5563}.bg-kw__routing[hidden]{display:none}.bg-kw__repair{padding:.9rem;border:1px solid #dfbb80;border-radius:12px;background:#fffaf0;margin-top:1rem}.bg-kw__repair h3{margin:0 0 .3rem}.bg-kw__repair p{margin:.35rem 0}@media(max-width:700px){.bg-kw__routechoices{grid-template-columns:1fr}}`;
export const TRUST_CSS=`.bg-kw__trust{margin:.75rem 0;padding:1rem;background:#f7faff;border:1px solid #d2dff0;border-radius:16px}.bg-kw__trust-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:.75rem 0;border-top:1px solid #dde5ee}.bg-kw__trust-row strong{color:#223b60}.bg-kw__trust-row p{font-size:.8rem;color:#526078;line-height:1.5}.bg-kw__trust-badge{border-radius:999px;border:1px solid #e0bf88;background:#fff1da;color:#75460d;padding:.35rem .65rem;font-size:.73rem;white-space:nowrap}.bg-kw__trust-badge[data-proof="CONFIGURED"],.bg-kw__trust-badge[data-proof="CONTROL_PRESENT"],.bg-kw__trust-badge[data-proof="DISABLED"]{background:#edf2fa;border-color:#c7d6e5;color:#355477}.bg-kw__trust-summary{font-weight:750;color:#774c15}@media(max-width:390px){.bg-kw__trust-row{display:block}.bg-kw__trust-badge{display:inline-block;margin:.5rem 0}}@media(prefers-reduced-motion:reduce){.bg-kw__trust *{animation:none!important;transition:none!important}}`;
export const wizardStyles=()=>WIZARD_CSS+DATA_USE_CSS+ROUTING_CSS+TRUST_CSS;

export function renderEvidenceFlow(result={}){
  const stages=Array.isArray(result.stages)?result.stages:[];
  if(!stages.length)return '<p class="bg-kw__evidence-empty">Nog geen testbewijs.</p>';
  const rows=stages.map(item=>{
    const label=EVIDENCE_LABELS[item?.name]||item?.name||'Stap';
    const symbol=item?.ok?'✓':(item?.skipped?'–':'!');
    const evidence=item?.evidenceId?`<small>bewijs ${esc(item.evidenceId)}</small>`:'';
    return `<li data-stage="${esc(item?.name||'unknown')}" data-ok="${item?.ok===true?'1':'0'}"><span aria-hidden="true">${symbol}</span><div><strong>${esc(label)}</strong>${evidence}</div></li>`;
  }).join('');
  const execution=result.executionId?`<p class="bg-kw__execution">Testbewijs: <code>${esc(result.executionId)}</code></p>`:'';
  return `<div class="bg-kw__evidence-card"><strong>Zo liep je test</strong><ol class="bg-kw__evidence-flow">${rows}</ol>${execution}</div>`;
}

export function renderWizardShell(){
  return `<section class="bg-kw" data-bg-wizard>
    <div class="bg-kw__head">
      <div><p class="bg-kw__eyebrow">Nieuwe koppeling</p><h2>Wat wil je automatisch laten gebeuren?</h2><p>Je hoeft geen technische koppeling te bouwen. Kies een route; Bedrijfsgeheugen maakt het voorstel en test het veilig.</p></div>
      <button type="button" class="bg-kw__help" data-bg-help aria-label="Uitleg over koppelen" aria-expanded="false" aria-controls="bg-kw-help">?</button>
    </div>
    <div id="bg-kw-help" class="bg-kw__helptext" data-bg-helptext hidden>Een koppeling haalt informatie uit een bron, controleert wat nodig is en zet die veilig op de juiste plek. Activeren kan pas nadat een echte veilige test is geslaagd.</div>
    <ol class="bg-kw__progress" aria-label="Stappen">${PHASES.map((phase,index)=>`<li data-phase="${phase}"${index===0?' aria-current="step"':''}><span>${index+1}</span>${STEP_LABELS[phase]}</li>`).join('')}</ol>
    <div class="bg-kw__journey" aria-label="Zo werkt een gegevenskoppeling">
      <h3>Van één systeem naar begrijpelijk inzicht</h3>
      <p>Geen technisch schema nodig. Jij bepaalt wat binnenkomt, waar het te zien is en of AI er iets mee mag doen.</p>
      <ol><li><strong>01 · Kies</strong>Welk systeem wil je verbinden?</li><li><strong>02 · Bepaal</strong>Welke velden en pagina’s mogen meedoen?</li><li><strong>03 · Controleer</strong>Test de echte bron en opslag veilig.</li><li><strong>04 · Begrijp</strong>Bekijk bevestigde waarden, herkomst en acties.</li></ol>
      <p data-bg-journey-readout aria-live="polite">Begin met één systeem. Niets wordt automatisch met AI gedeeld.</p>
    </div>
    <div class="bg-kw__routes" data-bg-routes>
      <button type="button" class="bg-kw__route bg-kw__route--primary" data-bg-route="ai"><strong>Vertel wat je wilt koppelen</strong><span>Omschrijf het in gewone taal.</span></button>
      <button type="button" class="bg-kw__route" data-bg-route="template"><strong>Kies een voorbeeld</strong><span>Start met een veilige, herkenbare standaard.</span></button>
      <button type="button" class="bg-kw__route" data-bg-route="manual"><strong>Bouw zelf</strong><span>Kies bron, informatie en doel stap voor stap.</span></button>
    </div>
    <div class="bg-kw__workspace" data-bg-workspace>
      <label class="bg-kw__intent"><span>Wat wil je automatisch laten gebeuren?</span><textarea data-bg-intent rows="3" placeholder="Bijvoorbeeld: haal PDF-facturen uit Outlook en zet de gegevens dagelijks in de Datahub"></textarea></label>
      <button type="button" class="knop" data-bg-make>Maak mijn koppeling</button>
      <p class="bg-kw__message" data-bg-message aria-live="polite"></p>
    </div>
    <fieldset class="bg-kw__privacy" data-bg-privacy>
       <legend>Jouw data. Jouw keuze.</legend>
       <p>Je kiest zelf of verbonden informatie alleen wordt doorgegeven, ook in je portaal verschijnt, of mag worden gebruikt voor AI-advies. Standaard staat extra gebruik uit.</p>
       <div class="bg-kw__privacy-grid" role="radiogroup" aria-label="Toegestaan gebruik van gekoppelde data">
         <label><input type="radio" name="bgDataUseMode" value="CONNECTION_ONLY" checked><span><strong>Alleen koppelen</strong><small>Geen toestemming voor dashboards of aanvullend AI-advies.</small></span></label>
         <label><input type="radio" name="bgDataUseMode" value="PORTAL_INSIGHTS"><span><strong>Ook in mijn portaal</strong><small>Gebruik geselecteerde gegevens voor mijn eigen inzichten.</small></span></label>
         <label><input type="radio" name="bgDataUseMode" value="PORTAL_AI"><span><strong>Ook AI-advies</strong><small>AI mag geselecteerde data analyseren, uitsluitend volgens mijn model- en locatiebeleid.</small></span></label>
       </div>
       <div class="bg-kw__sovereignty"><span data-bg-sovereignty-status class="bg-kw__sovereignty-status" role="status">Databeleid controleren…</span><a href="https://www.bedrijfsgeheugen.nl/portal-v2/?page=data-ai-passport">Bekijk opslag, verwerking en AI-modelkeuze ↗</a></div>
       <p class="bg-kw__privacy-note">Toestemming voor AI-advies is geen toestemming voor modeltraining. Documentextractie en externe systemen hebben eigen gegevensstromen; controleer hun locaties en verwerkers vóór activatie. Een aangevraagd beleid is nog geen geverifieerde AI-infrastructuur.</p>
     </fieldset>
     <fieldset class="bg-kw__routing" data-bg-fields hidden><legend>Welke gegevens wil je gebruiken?</legend><p>Kies één of meer gegevensvelden. Alleen deze velden worden meegenomen in de doelmapping.</p><div class="bg-kw__routechoices" data-bg-fieldchoices></div></fieldset>
     <fieldset class="bg-kw__routing" data-bg-pages hidden><legend>Op welke pagina's wil je deze gegevens zien?</legend><p>Je kunt meerdere bestemmingen kiezen. Dit is een verzoek om gegevens te gebruiken; echte waarden verschijnen pas na geverifieerde opslag.</p><div class="bg-kw__routechoices" data-bg-pagechoices></div></fieldset>
     <div class="bg-kw__routing" data-bg-saved-area>
       <strong>Meerdere systemen koppelen</strong>
       <p>Bewaar iedere verbinding afzonderlijk, voeg daarna de volgende toe. Elke koppeling houdt zijn eigen toestemming, tests en status.</p>
       <div class="bg-kw__routes"><button type="button" data-bg-save-draft class="knop">Bewaar deze koppeling als concept</button><button type="button" data-bg-new-connector class="knop licht">Voeg nog een koppeling toe</button></div>
       <div data-bg-saved-list aria-live="polite"></div>
     </div>
     <div data-bg-template-list hidden></div>
    <div data-bg-question hidden></div>
    <div class="bg-kw__evidence" data-bg-evidence aria-live="polite"><p class="bg-kw__evidence-empty">Nog geen testbewijs.</p></div>
    <div class="bg-kw__activation">
      <button type="button" class="knop" data-bg-activate disabled>Activeer koppeling</button>
      <p data-bg-activate-reason>Eerst een veilige test uitvoeren. Activeren wordt pas mogelijk als de test een execution-id en volledige evidence heeft.</p>
    </div>
    <details class="bg-kw__advanced"><summary>Technische details</summary><pre data-bg-definition>Nog geen configuratie.</pre></details>
  </section>`;
}

function ensureStyles(){
  if(document.getElementById('bg-kw-styles'))return;
  const style=document.createElement('style');
  style.id='bg-kw-styles';
  style.textContent=wizardStyles();
  document.head.appendChild(style);
}

function templateListHtml(){
  return `<div class="bg-kw__templates">${KOPPELING_TEMPLATES.map(template=>`<button type="button" class="bg-kw__template" data-template-id="${esc(template.id)}"><strong>${esc(template.title)}</strong><span>${esc(template.result)}</span></button>`).join('')}</div>`;
}

function setProgress(root,phase){
  root.querySelectorAll('.bg-kw__progress li').forEach(li=>{
    if(li.dataset.phase===phase)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
  });
}

function renderQuestion(root,state){
  const box=root.querySelector('[data-bg-question]');
  const question=nextQuestion(state);
  setProgress(root,question.phase);
  box.hidden=false;
  if(question.key==='safeTest'){
    box.innerHTML=`<div class="bg-kw__question"><strong>Veilige test</strong><p>Gebruik testgegevens. De koppeling wordt nog niet actief.</p><button type="button" class="knop" data-bg-safe-test>Voer veilige test uit</button></div>`;
    return;
  }
  const options=(question.options||[]).map(option=>`<option value="${esc(option)}">${esc(option)}</option>`).join('');
  box.innerHTML=`<div class="bg-kw__question"><label>${esc(question.label)}</label>${options?`<select data-bg-answer="${esc(question.key)}"><option value="">Kies…</option>${options}</select>`:`<button type="button" class="knop licht" data-bg-answer-button="${esc(question.key)}">Ja, ga door</button>`}</div>`;
}

function sampleFor(template){
  if(template.id==='outlook-pdf-facturen')return {messageId:`safe-${Date.now()}`,subject:'Testfactuur',attachments:[{name:'testfactuur.pdf'}],documentType:'invoice',extractedFields:{factuurnummer:'TEST-001',factuurdatum:'2026-09-08',leverancier:'Testleverancier',bedrag:100,btw:21,valuta:'EUR'}};
  return {extractedFields:Object.fromEntries((template.fields||[]).map(field=>[typeof field==='string'?field:field.key,'test']))};
}

export function mountConnectorWizard(container,{api=createConnectorApi(),askGuide=askConnectorGuide}={}){
  if(!container)return null;
  ensureStyles();
  container.insertAdjacentHTML('beforeend',renderWizardShell());
  const root=container.querySelector('[data-bg-wizard]');
  const message=root.querySelector('[data-bg-message]');
  const definitionOut=root.querySelector('[data-bg-definition]');
  const evidenceBox=root.querySelector('[data-bg-evidence]');
  const activate=root.querySelector('[data-bg-activate]');
  const activateReason=root.querySelector('[data-bg-activate-reason]');
  let state=null,draft=null,lastTest=null,draftDirty=false,dataUseMode='CONNECTION_ONLY';

  const say=text=>{message.textContent=text||'';};
  const savedList=root.querySelector('[data-bg-saved-list]');
  const refreshSaved=async()=>{
    try{
      const items=await api.list();
      if(!Array.isArray(items))throw new Error('INVALID_LIST');
      savedList.replaceChildren();
      const label=document.createElement('p');label.textContent=items.length?`${items.length} opgeslagen koppeling(en). Kies 'Voeg nog een koppeling toe' voor een nieuw systeem.`:'Nog geen opgeslagen koppelingen.';
      savedList.append(label);
      const list=document.createElement('ul');
      for(const item of items.slice(0,30)){
        const li=document.createElement('li');
        const name=document.createElement('strong');
        name.textContent=String(item.name||item.templateId||'Koppeling').slice(0,80);
        const description=document.createElement('p');
        description.textContent=item.state==='Active'?'Configuratie actief. Echte brondata niet bewezen.':item.state==='Paused'?'Gepauzeerd':'Concept';
        li.append(name,description);
        if(typeof item.id==='string'&&item.id){
          const checkButton=document.createElement('button');
          checkButton.type='button';checkButton.className='knop licht';checkButton.textContent='Bekijk veiligheid en bronbewijs';
          const proof=document.createElement('section');proof.className='bg-kw__trust';proof.hidden=true;
          proof.setAttribute('aria-label','Controle per koppeling');
          checkButton.setAttribute('aria-expanded','false');
          checkButton.addEventListener('click',async()=>{
            if(!proof.hidden){proof.hidden=true;checkButton.setAttribute('aria-expanded','false');return;}
            proof.hidden=false;checkButton.setAttribute('aria-expanded','true');proof.textContent='Veiligheidsbewijs ophalen…';
            try{
              const report=await api.trust(item.id);
              if(report?.contract!=='CONNECTOR_TRUST_EVIDENCE_V1'||report.overall!=='EVIDENCE_DUE'||!Array.isArray(report.checks))throw new Error('TRUST_READBACK_INVALID');
              proof.replaceChildren();
              const heading=document.createElement('h4');heading.textContent='Hoe veilig is deze koppeling?';
              const intro=document.createElement('p');intro.className='bg-kw__trust-summary';
              intro.textContent='Nog niet volledig bewezen. Iedere controle wordt afzonderlijk aangetoond.';
              proof.append(heading,intro);
              const badges={CONTROL_PRESENT:'Controle aanwezig',CONFIGURED:'Ingesteld',TEST_EVIDENCED:'Providerproef vastgelegd',DISABLED:'Uitgeschakeld',EVIDENCE_DUE:'Bewijs ontbreekt'};
              for(const control of report.checks){
                const row=document.createElement('div');row.className='bg-kw__trust-row';
                const body=document.createElement('div'),label=document.createElement('strong'),detail=document.createElement('p'),badge=document.createElement('span');
                label.textContent=control.label;detail.textContent=control.detail;
                badge.className='bg-kw__trust-badge';badge.dataset.proof=control.status;
                badge.textContent=badges[control.status]||'Niet gecontroleerd';
                body.append(label,detail);row.append(body,badge);proof.append(row);
              }
              const followup=document.createElement('p');followup.textContent=report.nextAction;proof.append(followup);
            }catch{
              proof.textContent='De controle kon niet worden teruggelezen. We nemen geen beveiligingsresultaat aan.';
            }
          });
          li.append(checkButton,proof);
        }
        list.append(li);
      }
      savedList.append(list);
    }catch{savedList.textContent='Opgeslagen koppelingen zijn tijdelijk niet beschikbaar.';}
  };
  const invalidateEvidence=(reason='Deze koppeling is gewijzigd. Voer opnieuw een veilige test uit.',keepDraft=false)=>{
    if(keepDraft){draftDirty=Boolean(draft);}else{draft=null;draftDirty=false;}
    lastTest=null;activate.disabled=true;activateReason.textContent=reason;
    evidenceBox.innerHTML='<p class="bg-kw__evidence-empty">Nog geen geldig testbewijs voor deze versie.</p>';
  };
  const renderRouting=()=>{
    const fieldsRoot=root.querySelector('[data-bg-fields]');
    const pagesRoot=root.querySelector('[data-bg-pages]');
    fieldsRoot.hidden=!state;
    pagesRoot.hidden=!state||dataUseMode==='CONNECTION_ONLY';
    const readout=root.querySelector('[data-bg-journey-readout]');
    if(!state){if(readout)readout.textContent='Begin met één systeem. Niets wordt automatisch met AI gedeeld.';return;}
    if(readout){const fields=state.answers.selectedFields||[],pages=state.answers.portalPages||[];
      readout.textContent=fields.length+' veld(en) gekozen · '+(dataUseMode==='CONNECTION_ONLY'?'alleen koppelen, geen portaal- of AI-gebruik':pages.length+' portaalbestemming(en) · '+(dataUseMode==='PORTAL_AI'?'AI-gebruik aangevraagd, nog niet geactiveerd':'geen AI-gebruik'))+'. Echte gegevens blijven onbevestigd tot bron- en opslagbewijs beschikbaar is.';
    }
    const selected=new Set(state.answers.selectedFields||[]);
    const pages=new Set(state.answers.portalPages||[]);
    fieldsRoot.querySelector('[data-bg-fieldchoices]').innerHTML=(state.template.fields||[]).map(field=>{
      const key=typeof field==='string'?field:field.key;
      return `<label><input type="checkbox" data-bg-field="${esc(key)}" ${selected.has(key)?'checked':''}><span><strong>${esc(key)}</strong></span></label>`;
    }).join('');
    pagesRoot.querySelector('[data-bg-pagechoices]').innerHTML=CONNECTOR_PORTAL_PAGES.map(page=>
      `<label><input type="checkbox" data-bg-page="${esc(page.id)}" ${pages.has(page.id)&&!(page.id==='brain-verwerking'&&dataUseMode!=='PORTAL_AI')?'checked':''} ${page.id==='brain-verwerking'&&dataUseMode!=='PORTAL_AI'?'disabled':''}><span><strong>${esc(page.label)}</strong><small>${esc(page.hint)}${page.id==='brain-verwerking'&&dataUseMode!=='PORTAL_AI'?' — vraagt AI-toestemming':''}</small></span></label>`).join('');
  };
  const chooseTemplate=template=>{
    invalidateEvidence('Eerst deze gekozen koppeling veilig testen.');
    state=applyAnswer(createWizardState(template),'dataUseMode',dataUseMode);
    definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);
    renderQuestion(root,state);
    renderRouting();
    say(`${template.title} gekozen. Alleen ontbrekende keuzes worden nog gevraagd.`);
  };

  root.querySelector('[data-bg-save-draft]').addEventListener('click',async()=>{
    if(!state){say('Kies eerst een systeem of maak een AI-voorstel.');return;}
    const definition=toConnectorDefinition(state);
    if(!definition.mappings.length){say('Selecteer minimaal één gegevensveld.');return;}
    try{
      if(draft){draft=await api.saveDraft(draft.id||draft.connectorId,definition);}
      else draft=await api.createDraft(definition);
      draftDirty=false;
      lastTest=null;activate.disabled=true;activateReason.textContent='Concept opgeslagen. Voer een nieuwe veilige test uit voordat je activeert.';
      say('Concept opgeslagen. Je kunt nu een volgend systeem toevoegen.');
      await refreshSaved();
    }catch(error){const guide=connectorRecoveryAdvice(error);say(guide.message+' '+guide.action);}
  });
  root.querySelector('[data-bg-new-connector]').addEventListener('click',()=>{
    if(state&&(!draft||draftDirty)){say('Bewaar deze keuze eerst als concept om gegevensverlies te voorkomen.');return;}
    state=null;draft=null;lastTest=null;draftDirty=false;dataUseMode='CONNECTION_ONLY';
    const noExtraUse=root.querySelector('input[name="bgDataUseMode"][value="CONNECTION_ONLY"]');if(noExtraUse)noExtraUse.checked=true;
    invalidateEvidence('Kies een nieuwe bron en test iedere koppeling apart.');
    root.querySelector('[data-bg-template-list]').hidden=false;
    root.querySelector('[data-bg-template-list]').innerHTML=templateListHtml();
    root.querySelectorAll('[data-template-id]').forEach(item=>item.addEventListener('click',()=>chooseTemplate(findTemplate(item.dataset.templateId))));
    renderRouting();
    definitionOut.textContent='Nog geen nieuwe koppeling geselecteerd.';
    say('Kies een volgend systeem. Bestaande concepten blijven bewaard.');
  });
  void refreshSaved();
  root.querySelector('[data-bg-help]').addEventListener('click',event=>{
    const text=root.querySelector('[data-bg-helptext]');
    text.hidden=!text.hidden;
    event.currentTarget.setAttribute('aria-expanded',String(!text.hidden));
  });
  root.querySelectorAll('[data-bg-route]').forEach(button=>button.addEventListener('click',()=>{
    const route=button.dataset.bgRoute;
    if(route==='template'||route==='manual'){
      const list=root.querySelector('[data-bg-template-list]');
      list.hidden=false;list.innerHTML=templateListHtml();
      list.querySelectorAll('[data-template-id]').forEach(item=>item.addEventListener('click',()=>chooseTemplate(findTemplate(item.dataset.templateId))));
      say(route==='manual'?'Kies eerst de bron die het dichtst bij je situatie ligt. Technische details kun je later aanpassen.':'Kies een voorbeeld dat het meest lijkt op wat je wilt bereiken.');
    }else root.querySelector('[data-bg-intent]').focus();
  }));
  root.querySelector('[data-bg-make]').addEventListener('click',async()=>{
    const intent=root.querySelector('[data-bg-intent]').value.trim();
    if(!intent){say('Omschrijf eerst wat je automatisch wilt laten gebeuren.');return;}
    say('Voorstel maken…');
    try{
      const proposal=await askGuide({intent,currentState:state?toConnectorDefinition(state):{}});
      say(proposal.summary||'Voorstel gemaakt. Kies hieronder het passende voorbeeld om veilig verder te gaan.');
      const text=JSON.stringify(proposal).toLowerCase();
      const matched=KOPPELING_TEMPLATES.find(template=>text.includes(template.id)||text.includes(template.title.toLowerCase()));
      if(matched)chooseTemplate(matched);else{
        const list=root.querySelector('[data-bg-template-list]');list.hidden=false;list.innerHTML=templateListHtml();
        list.querySelectorAll('[data-template-id]').forEach(item=>item.addEventListener('click',()=>chooseTemplate(findTemplate(item.dataset.templateId))));
      }
    }catch(error){say(error.code==='UNAUTHORIZED'?'Log opnieuw in om AI-begeleiding te gebruiken.':'AI-begeleiding is nu niet beschikbaar. Je kunt direct een voorbeeld kiezen.');}
  });
  root.addEventListener('change',event=>{
    if(event.target?.name==='bgDataUseMode'){
      dataUseMode=event.target.value;
      if(state){
        invalidateEvidence('Het toegestane datagebruik is gewijzigd. Een nieuwe test en nieuwe toestemming zijn nodig.',true);
        state=applyAnswer(state,'dataUseMode',dataUseMode);
        definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);
      }
      renderRouting();
      say(dataUseMode==='CONNECTION_ONLY'?'Alleen koppelen gekozen. Datahub-activatie vereist eerst je uitdrukkelijke keuze voor portaalgebruik.':'Jouw datagebruik wordt uitsluitend voor deze koppeling vastgelegd.');
      return;
    }
    if(state&&(event.target?.dataset?.bgField||event.target?.dataset?.bgPage)){
      const isField=Boolean(event.target?.dataset?.bgField);
      const key=isField?'selectedFields':'portalPages';
      const prop=isField?'bgField':'bgPage';
      const values=new Set(state.answers[key]||[]);
      if(event.target.checked)values.add(event.target.dataset[prop]);else values.delete(event.target.dataset[prop]);
      invalidateEvidence('Je gegevenskeuze is gewijzigd. Een nieuwe veilige test is nodig.',true);
      state=applyAnswer(state,key,[...values]);
      definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);
      renderRouting();
      return;
    }
    const key=event.target?.dataset?.bgAnswer;if(!key||!state)return;
    invalidateEvidence(undefined,true);
    state=applyAnswer(state,key,event.target.value);
    definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);
    renderQuestion(root,state);
  });
  root.addEventListener('click',async event=>{
    const answerKey=event.target?.dataset?.bgAnswerButton;
    if(answerKey&&state){invalidateEvidence(undefined,true);state=applyAnswer(state,answerKey,true);definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);renderQuestion(root,state);return;}
    if(event.target?.matches('[data-bg-safe-test]')&&state){
      try{
        if(!state.answers.selectedFields?.length){say('Kies minimaal één gegevensveld.');return;}
        if(dataUseMode!=='CONNECTION_ONLY'&&!state.answers.portalPages?.length){say('Kies minimaal één portaalpagina voor de gekozen toestemming.');return;}
        if(draftDirty&&draft){draft=await api.saveDraft(draft.id||draft.connectorId,toConnectorDefinition(state));draftDirty=false;}
        if(!draft){draft=await api.createDraft(toConnectorDefinition(state));draftDirty=false;}
        const id=draft.id||draft.connectorId;
        if(!id)throw Object.assign(new Error('Draft zonder id'),{code:'DRAFT_ID_MISSING'});
        say('Veilige test uitvoeren…');
        const sample=sampleFor(state.template);
        try{lastTest=await api.safeTest(id,sample);}
        catch(firstError){
          const advice=connectorRecoveryAdvice(firstError);
          if(!advice.canRetry)throw firstError;
          say('Tijdelijke verbindingsfout; één veilige test opnieuw proberen.');
          lastTest=await api.safeTest(id,sample); // sample test only, never a production write
        }
        evidenceBox.innerHTML=renderEvidenceFlow(lastTest);
        const evidence=lastTest?.evidence||{};
        const status=toHumanStatus({state:lastTest?.status==='TEST_PASSED'?'ready':'error',lastSafeTest:{ok:lastTest?.status==='TEST_PASSED',executionId:evidence.testExecutionId||evidence.runtimeExecutionId||lastTest?.executionId,proofLevel:evidence.proofLevel}});
        say(status.reason);
        activate.disabled=!status.canActivate;
        activateReason.textContent=status.canActivate?'Test geslaagd. Je kunt deze exacte geteste versie nu activeren.':status.reason;
      }catch(error){
        const guide=connectorRecoveryAdvice(error);
        say(guide.message);
        activate.disabled=true;
        evidenceBox.innerHTML=`<section class="bg-kw__repair" role="alert"><h3>${esc(guide.heading)}</h3><p>${esc(guide.message)}</p><p><strong>Volgende stap:</strong> ${esc(guide.action)}</p><p>De koppeling blijft veilig uit totdat de test slaagt. Een open fout blijft in het bestaande herstelregister staan.</p></section>`;
      }
    }
  });
  activate.addEventListener('click',async()=>{
    if(!draft||!lastTest)return;
    const id=draft.id||draft.connectorId;
    const testExecutionId=activationEvidenceId({lastSafeTest:{ok:lastTest.status==='TEST_PASSED',executionId:lastTest?.evidence?.testExecutionId||lastTest?.evidence?.runtimeExecutionId||lastTest?.executionId,proofLevel:lastTest?.evidence?.proofLevel}});
    if(!testExecutionId)return;
    try{await api.activate(id,testExecutionId);void refreshSaved();activate.disabled=true;activateReason.textContent='Geactiveerd op basis van de vastgelegde veilige test.';say('Koppeling geactiveerd.');}
    catch(error){say(error?.message||'Activeren is geblokkeerd omdat de test-evidence niet geldig is.');}
  });
  // Only show observed tenant policy, never presume the selected route is actually live.
  if(typeof fetch==='function')fetch('/api/data-sovereignty',{credentials:'same-origin',headers:{accept:'application/json'}})
    .then(async response=>{if(!response.ok)throw new Error('POLICY_UNAVAILABLE');return response.json();})
    .then(data=>{
      const policy=data?.snapshot?.policy;
      const badge=root.querySelector('[data-bg-sovereignty-status]');
      if(!badge)return;
      const labels={TRANSPARENT_GLOBAL:'Wereldwijde routes toegestaan',EU_STORAGE:'EU-opslag gewenst',EU_ONLY:'Alleen EU gevraagd',CUSTOM:'Eigen beleid'};
      badge.textContent=labels[policy?.mode]||'Verwerkingslocatie nog onbekend';
    })
    .catch(()=>{const badge=root.querySelector('[data-bg-sovereignty-status]');if(badge)badge.textContent='Locatie nog niet geverifieerd';});
  return {root};
}
