import {KOPPELING_TEMPLATES,findTemplate} from './templates.js';
import {createWizardState,applyAnswer,nextQuestion,toConnectorDefinition,PHASES} from './wizard.js';
import {askConnectorGuide} from './ai-guide.js';
import {createConnectorApi} from './api.js';
import {toHumanStatus,activationEvidenceId} from './status.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const STEP_LABELS={source:'Bron',selection:'Selectie',information:'Informatie',target:'Doel',schedule:'Planning',test:'Test'};

export const WIZARD_CSS=`.bg-kw{margin-top:1.2rem;border-top:1px solid var(--lijn,#ddd);padding-top:1.2rem}.bg-kw button,.bg-kw textarea,.bg-kw select{min-height:44px}.bg-kw__head{display:flex;gap:1rem;justify-content:space-between;align-items:flex-start}.bg-kw__head h2{margin:.15rem 0 .45rem}.bg-kw__eyebrow{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--grijs,#666)}.bg-kw__help{flex:0 0 44px;width:44px;height:44px;border:1px solid var(--lijn,#ddd);border-radius:50%;background:#fff;font-weight:700;font-size:1rem;font-family:inherit;cursor:pointer}.bg-kw__helptext{margin:.75rem 0;padding:.8rem;border-left:3px solid var(--blauw,#2742d6);background:var(--papier,#fbfaf7)}.bg-kw__progress{list-style:none;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.35rem;margin:1rem 0}.bg-kw__progress li{font-size:.72rem;color:var(--grijs,#666);display:flex;gap:.35rem;align-items:center;min-width:0}.bg-kw__progress li span{display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--lijn,#ddd);border-radius:50%;background:#fff;flex:0 0 24px}.bg-kw__progress li[aria-current=step]{color:var(--inkt,#14171a);font-weight:700}.bg-kw__progress li[aria-current=step] span{background:var(--inkt,#14171a);color:#fff}.bg-kw__routes{display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem;margin:1rem 0}.bg-kw__route{min-height:96px;text-align:left;border:1px solid var(--lijn,#ddd);background:#fff;border-radius:8px;padding:.85rem;cursor:pointer}.bg-kw__route strong,.bg-kw__route span{display:block}.bg-kw__route span{font-size:.8rem;color:var(--grijs,#666);margin-top:.25rem}.bg-kw__route--primary{border-color:var(--inkt,#14171a)}.bg-kw__workspace{display:grid;gap:.65rem}.bg-kw__intent span{display:block;font-weight:700;margin-bottom:.35rem}.bg-kw textarea{width:100%;padding:.7rem;border:1px solid var(--lijn,#ddd);border-radius:6px;font:inherit;resize:vertical}.bg-kw__message{min-height:1.5em;font-size:.86rem;color:var(--grijs,#666)}.bg-kw__templates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin:.8rem 0}.bg-kw__template{border:1px solid var(--lijn,#ddd);border-radius:6px;background:#fff;padding:.75rem;text-align:left;cursor:pointer}.bg-kw__template strong,.bg-kw__template span{display:block}.bg-kw__template span{font-size:.78rem;color:var(--grijs,#666);margin-top:.2rem}.bg-kw__question{padding:.85rem;background:var(--papier,#fbfaf7);border-radius:6px}.bg-kw__question label{display:block;font-weight:700;margin-bottom:.4rem}.bg-kw__question select{width:100%}.bg-kw__activation{margin-top:1rem}.bg-kw__activation p{font-size:.8rem;color:var(--grijs,#666);margin-top:.35rem}.bg-kw__advanced{margin-top:1rem}.bg-kw__advanced pre{white-space:pre-wrap;word-break:break-word;font-size:.72rem;margin-top:.5rem}.bg-kw button:focus-visible,.bg-kw textarea:focus-visible,.bg-kw select:focus-visible{outline:3px solid var(--geel,#ffe86b);outline-offset:2px}@media(max-width:700px){.bg-kw__routes,.bg-kw__templates{grid-template-columns:1fr}.bg-kw__progress{grid-template-columns:repeat(3,1fr);row-gap:.55rem}.bg-kw__progress li{font-size:.68rem}.bg-kw__route{min-height:76px}.bg-kw__head{align-items:flex-start}}`;

export function renderWizardShell(){
  return `<section class="bg-kw" data-bg-wizard>
    <div class="bg-kw__head">
      <div><p class="bg-kw__eyebrow">Nieuwe koppeling</p><h2>Wat wil je automatisch laten gebeuren?</h2><p>Je hoeft geen technische koppeling te bouwen. Kies een route; Bedrijfsgeheugen maakt het voorstel en test het veilig.</p></div>
      <button type="button" class="bg-kw__help" data-bg-help aria-expanded="false" aria-controls="bg-kw-help">?</button>
    </div>
    <div id="bg-kw-help" class="bg-kw__helptext" data-bg-helptext hidden>Een koppeling haalt informatie uit een bron, controleert wat nodig is en zet die veilig op de juiste plek. Activeren kan pas nadat een echte veilige test is geslaagd.</div>
    <ol class="bg-kw__progress" aria-label="Stappen">${PHASES.map((phase,index)=>`<li data-phase="${phase}"${index===0?' aria-current="step"':''}><span>${index+1}</span>${STEP_LABELS[phase]}</li>`).join('')}</ol>
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
    <div data-bg-template-list hidden></div>
    <div data-bg-question hidden></div>
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
  style.textContent=WIZARD_CSS;
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
  const activate=root.querySelector('[data-bg-activate]');
  const activateReason=root.querySelector('[data-bg-activate-reason]');
  let state=null,draft=null,lastTest=null;

  const say=text=>{message.textContent=text||'';};
  const chooseTemplate=template=>{
    state=createWizardState(template);
    definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);
    renderQuestion(root,state);
    say(`${template.title} gekozen. Alleen ontbrekende keuzes worden nog gevraagd.`);
  };

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
    const key=event.target?.dataset?.bgAnswer;if(!key||!state)return;
    state=applyAnswer(state,key,event.target.value);
    definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);
    renderQuestion(root,state);
  });
  root.addEventListener('click',async event=>{
    const answerKey=event.target?.dataset?.bgAnswerButton;
    if(answerKey&&state){state=applyAnswer(state,answerKey,true);definitionOut.textContent=JSON.stringify(toConnectorDefinition(state),null,2);renderQuestion(root,state);return;}
    if(event.target?.matches('[data-bg-safe-test]')&&state){
      try{
        if(!draft)draft=await api.createDraft(toConnectorDefinition(state));
        const id=draft.id||draft.connectorId;
        if(!id)throw Object.assign(new Error('Draft zonder id'),{code:'DRAFT_ID_MISSING'});
        say('Veilige test uitvoeren…');
        lastTest=await api.safeTest(id,sampleFor(state.template));
        const evidence=lastTest?.evidence||{};
        const status=toHumanStatus({state:lastTest?.status==='TEST_PASSED'?'ready':'error',lastSafeTest:{ok:lastTest?.status==='TEST_PASSED',executionId:evidence.testExecutionId||evidence.runtimeExecutionId}});
        say(status.reason);
        activate.disabled=!status.canActivate;
        activateReason.textContent=status.canActivate?'Test geslaagd. Je kunt deze exacte geteste versie nu activeren.':status.reason;
      }catch(error){say(error?.message||'Veilige test mislukt.');activate.disabled=true;}
    }
  });
  activate.addEventListener('click',async()=>{
    if(!draft||!lastTest)return;
    const id=draft.id||draft.connectorId;
    const testExecutionId=activationEvidenceId({lastSafeTest:{ok:lastTest.status==='TEST_PASSED',executionId:lastTest?.evidence?.testExecutionId||lastTest?.evidence?.runtimeExecutionId}});
    if(!testExecutionId)return;
    try{await api.activate(id,testExecutionId);activate.disabled=true;activateReason.textContent='Geactiveerd op basis van de vastgelegde veilige test.';say('Koppeling geactiveerd.');}
    catch(error){say(error?.message||'Activeren is geblokkeerd omdat de test-evidence niet geldig is.');}
  });
  return {root};
}
