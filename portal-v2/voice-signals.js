/**
 * Native V2 voice + signal UI. Uses existing Portal State -> BusinessInput ->
 * Brain writeback and existing router. Never starts its own background worker.
 */
import {listPortalGroups} from './page-registry.js';
import {navigatePortal} from './router.js';
import {askPortal} from './ask-portal.js';
import {SIGNAL_METRICS,metricById,parseSpokenRule,normalizeRule,evaluateSignals,buildSignalTask} from './signal-detection.js';

const norm=value=>String(value||'').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
const safe=state=>state&&typeof state==='object'&&!Array.isArray(state)?state:{};
const pages=listPortalGroups().flatMap(group=>group.pages);
const PAGE_ALIASES=Object.freeze({'bedrijfsgezondheid':'profiel','omzet':'cijfers-maatstaven','kpi':'cijfers-maatstaven','kpis':'cijfers-maatstaven','financien':'waarde-financiering','acties':'actieve-acties','risicos':'advies','mijn bedrijf':'ondernemerscockpit','data':'data-ai'});
const stateRules=state=>Array.isArray(state?.portal?.signalering?.rules)?state.portal.signalering.rules:[];
const btn=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.vsAction=action;return b;};
const note=(el,content,error=false)=>{el.textContent=content;el.classList.toggle('vs-error',Boolean(error));};
export function findSpokenPage(text){
  const query=norm(text).replace(/^(?:de|het|mijn|pagina|onderdeel)\s+/,'');
  if(!query)return null;
  if(PAGE_ALIASES[query])return pages.find(p=>p.id===PAGE_ALIASES[query])||null;
  const exact=pages.filter(p=>norm(p.label)===query||norm(p.id.replace(/-/g,' '))===query);
  if(exact.length===1)return exact[0];
  const partial=pages.filter(p=>norm(p.label).includes(query));
  return partial.length===1?partial[0]:null;
}

export function mountVoiceSignalCenter({stateClient,domainState,openPage=navigatePortal,fetchImpl=globalThis.fetch}={}){
  const row=document.querySelector('.topactions .actionrow');
  if(!row||row.querySelector('[data-voice-signal-root]')||!stateClient||!domainState)return null;
  const holder=document.createElement('span');holder.className='vs-trigger';holder.dataset.voiceSignalRoot='v1';
  const voiceButton=btn('🎙 Spraak','voice'),alertsButton=btn('⚑ Signaleringen','alerts');
  voiceButton.setAttribute('aria-label','Bedien portaal met spraak of tekst');
  alertsButton.setAttribute('aria-label','Open signaleringen en afwijkingen');
  holder.append(voiceButton,alertsButton);row.prepend(holder);
  const dialog=document.createElement('dialog');dialog.className='vs-dialog';
  dialog.setAttribute('aria-label','Spraakbediening en signaleringen');
  dialog.innerHTML='<div class="vs-head"><div><small>BEDRIJFSGEHEUGEN · STUREN OP UITZONDERINGEN</small><h2>Spraak & signaleringen</h2></div><button type="button" data-vs-close aria-label="Sluiten">×</button></div>'
    +'<p class="vs-intro">Navigeer, stel vragen en stel signaleringen in met je stem of toetsenbord. Alleen ingelogde, werkelijk ingevoerde klantdata telt als meetbewijs.</p>'
    +'<section class="vs-voice"><h3>Wat wil je doen?</h3><div class="vs-voice-row"><input data-vs-command maxlength="500" aria-label="Spraakopdracht of getypte opdracht" placeholder="Bijv. open omzet, of waarschuw me als verzuim boven 7"><button type="button" data-vs-run>Uitvoeren</button><button type="button" data-vs-mic aria-label="Microfoon starten">🎙 Spreek</button></div><p class="vs-examples">Zeg bijvoorbeeld: “open bedrijfsgezondheid”, “wat moet ik vandaag doen?”, “toon signaleringen” of “waarschuw me als omzet onder 50 duizend”.</p><p class="vs-privacy">De microfoon luistert alleen na jouw klik. De browser kan spraak extern verwerken; de audio wordt niet door dit portaal opgeslagen. Bij onvoldoende browserondersteuning kun je typen.</p></section>'
    +'<div class="vs-speech-out"><button type="button" data-vs-read>🔊 Lees bericht voor</button><button type="button" data-vs-stop>Stop voorlezen</button></div><output data-vs-status role="status" aria-live="polite" class="vs-status"></output>'
    +'<section class="vs-center"><div class="vs-center-head"><div><h3>Mijn signaleringen</h3><p>Toetsing bij openen en bij het vernieuwen van geautoriseerde portaaldata. Geen claim van achtergrondmeldingen of e-mails.</p></div><span data-vs-counter>Geen regels</span></div><div data-vs-list class="vs-list"></div></section>'
    +'<form data-vs-action-form class="vs-form" hidden><h3>Actie aanmaken uit signaal</h3><p data-vs-action-context></p><div class="vs-form-grid"><label>Eigenaar<input name="owner" required maxlength="100" placeholder="Naam verantwoordelijke"></label><label>Deadline<input name="due" required type="date"></label></div><div class="vs-item-actions"><button type="submit" class="vs-save">Taak opslaan met bewijs</button><button type="button" data-vs-action-cancel>Annuleren</button></div></form>'
    +'<form data-vs-form class="vs-form"><h3>Signalering instellen</h3><div class="vs-form-grid"><label>KPI<select name="metric" required></select></label><label>Als de waarde<select name="operator"><option value="below">Onder de grens komt</option><option value="above">Boven de grens komt</option><option value="missing">Ontbreekt</option></select></label><label>Grenswaarde<input name="threshold" inputmode="decimal" type="number" step="any" placeholder="Bijv. 7" required></label><label>Prioriteit<select name="severity"><option value="midden">Midden</option><option value="hoog">Hoog</option><option value="laag">Laag</option></select></label></div><p class="vs-form-hint">Eén grenswaarde is een eigen beleidskeuze, geen automatisch gevalideerde branchebenchmark. Je kunt de regel later uitschakelen.</p><button class="vs-save" type="submit">Signalering veilig opslaan</button></form>';
  for(const metric of SIGNAL_METRICS){const opt=document.createElement('option');opt.value=metric.id;opt.textContent=metric.label+' ('+metric.unit+')';dialog.querySelector('[name=metric]').append(opt);}
  document.body.append(dialog);
  const output=dialog.querySelector('[data-vs-status]'),input=dialog.querySelector('[data-vs-command]');
  const form=dialog.querySelector('[data-vs-form]'),list=dialog.querySelector('[data-vs-list]');
  const actionForm=dialog.querySelector('[data-vs-action-form]');let selectedSignalId='';
  const mic=dialog.querySelector('[data-vs-mic]'),counter=dialog.querySelector('[data-vs-counter]');
  const threshold=form.elements.threshold,operator=form.elements.operator;
  let recognizer=null,busy=false,principal='',lastPortalField=null;
  function stopSpeaking(){try{globalThis.speechSynthesis?.cancel?.();}catch{}}
  function speak(text){
    const t=String(text||'').trim();const Synth=globalThis.SpeechSynthesisUtterance;
    if(!t||!Synth||!globalThis.speechSynthesis){note(output,'Voorlezen is in deze browser niet beschikbaar.',true);return;}
    stopSpeaking();const item=new Synth(t.slice(0,1200));item.lang='nl-NL';item.rate=1;globalThis.speechSynthesis.speak(item);
  }
  const rememberField=event=>{const field=event.target;if(!dialog.contains(field)&&/^(INPUT|TEXTAREA)$/.test(field?.tagName||'')&&!['password','hidden','file'].includes(field.type))lastPortalField=field;};
  document.addEventListener('focusin',rememberField);
  function authenticated(){
    const snap=stateClient.getSnapshot?.()||{};
    const subject=String(snap.user?.id||'');
    const actual=String(stateClient.currentUser?.()?.id||'');
    return subject&&actual===subject&&['authenticated','empty'].includes(snap.mode)&&!stateClient.isDemo?.()?snap:null;
  }
  function stopListening(){
    if(recognizer){try{recognizer.abort();}catch{}recognizer=null;}
    mic.disabled=false;mic.textContent='🎙 Spreek';
  }
  function reveal(){
    if(!dialog.open)dialog.showModal();
    render();
  }
  function switchFormThreshold(){
    threshold.disabled=operator.value==='missing';
    threshold.required=operator.value!=='missing';
    if(threshold.disabled)threshold.value='';
  }
  async function commitRules(next,expectedId){
    if(busy)throw Error('ER_WORDT_AL_OPGESLAGEN');
    const snapshot=authenticated();
    if(!snapshot)throw Error('Log in om tenantgebonden signaleringen op te slaan.');
    if(!domainState.initialized?.()||!['idle','saved'].includes(domainState.status?.()))throw Error('De actuele klantgegevens zijn nog niet klaar voor opslaan.');
    busy=true;form.querySelector('[type=submit]').disabled=true;
    const owner=String(snapshot.user.id);
    try{
      const values=next.map(normalizeRule).filter(Boolean);
      if(values.length!==next.length||values.length>50)throw Error('ONGELDIGE_SIGNALERINGSREGELS');
      domainState.patch('portal.signalering',{rules:values,updatedAt:new Date().toISOString()});
      const receipt=await domainState.flush();
      const readback=authenticated();
      const saved=stateRules(readback?.state);
      if(String(readback?.user?.id||'')!==owner||receipt?.status!=='saved'
         ||JSON.stringify(saved.map(normalizeRule))!==JSON.stringify(values)
         ||(expectedId&&!saved.some(item=>item.id===expectedId)))
        throw Error('Geen geverifieerde server-readback. Controleer de status voordat je opnieuw probeert.');
      note(output,'Signalering opgeslagen en via de bestaande klantopslag teruggelezen.');
      render();
    }finally{busy=false;form.querySelector('[type=submit]').disabled=false;}
  }
  function itemCard(result){
    const card=document.createElement('article');card.className='vs-item';card.dataset.state=result.status;
    const head=document.createElement('div');head.className='vs-item-head';
    const title=document.createElement('strong');title.textContent=result.metric.label;
    const tag=document.createElement('span');tag.textContent=result.status==='afwijking'?'Afwijking · '+result.severity:result.status==='geen-data'?'Niet meetbaar':result.status==='binnen-grens'?'Binnen grens':result.status==='uitgeschakeld'?'Uitgeschakeld':'Ontbrekende bron';
    head.append(title,tag);card.append(head);
    const why=document.createElement('p');why.textContent=result.explanation;card.append(why);
    const evidence=document.createElement('small');evidence.className='vs-evidence';
    evidence.textContent='Bron: '+result.evidence.sourcePath+' · Actualiteit van de meting: onbekend · Status berekend uit ingevoerde klantdata';
    card.append(evidence);
    if(result.triggered){
      const advice=document.createElement('p');advice.className='vs-advice';advice.textContent='Advies: '+result.advice;card.append(advice);
    }
    const actions=document.createElement('div');actions.className='vs-item-actions';
    const go=btn(result.actionLabel,'go');go.dataset.page=result.actionPage;
    const toggle=btn(result.enabled?'Pauzeren':'Activeren','toggle');toggle.dataset.rule=result.id;
    if(result.triggered){const create=btn('Taak met eigenaar aanmaken','create-task');create.dataset.rule=result.id;actions.append(create);}
    actions.append(go,toggle);card.append(actions);
    return card;
  }
  function render(){
    const snap=authenticated();
    list.replaceChildren();
    if(!snap){
      counter.textContent='Inloggen vereist';
      const p=document.createElement('p');p.className='vs-empty';p.textContent='Log in om je eigen signaleringen en meetwaarden te zien. Voorbeelden worden niet als echte afwijkingen getoond.';list.append(p);alertsButton.textContent='⚑ Signaleringen';return;
    }
    const results=evaluateSignals(stateRules(snap.state),safe(snap.state),{authenticated:true});
    const count=results.filter(x=>x.triggered).length;
    alertsButton.textContent=count?'⚑ '+count+' afwijking'+(count===1?'':'en'):'⚑ Signaleringen';
    counter.textContent=results.length+' regel'+(results.length===1?'':'s')+' · '+count+' signaal'+(count===1?'':'en');
    if(!results.length){const p=document.createElement('p');p.className='vs-empty';p.textContent='Nog geen regels. Kies hieronder een KPI en grenswaarde; alleen echte ingevoerde waarden worden getoetst.';list.append(p);}
    for(const result of results)list.append(itemCard(result));
  }
  async function runCommand(raw){
    const text=String(raw||'').trim();if(!text){note(output,'Spreek of typ eerst een opdracht.',true);return;}
    const n=norm(text);
    const spoken=parseSpokenRule(text);
    if(spoken){
      if(!authenticated()){note(output,'Log eerst in om een signalering op te slaan.',true);return;}
      form.elements.metric.value=spoken.metricId;
      operator.value=spoken.operator;
      threshold.value=String(spoken.threshold);
      switchFormThreshold();reveal();form.querySelector('[type=submit]').focus();
      note(output,'Voorstel ingevuld. Controleer de grens en kies “Signalering veilig opslaan”.');
      return;
    }
    if(/^lees (?:mijn |de )?(?:signaleringen|afwijkingen|meldingen)(?: voor)?$/.test(n)){
      const snap=authenticated();if(!snap){note(output,'Log eerst in om je bedrijfsgegevens te laten voorlezen.',true);return;}
      const signals=evaluateSignals(stateRules(snap.state),safe(snap.state),{authenticated:true});
      const summary=signals.length?signals.map(x=>x.metric.label+': '+x.status+'. '+x.explanation+(x.triggered?' Advies: '+x.advice:'')).join(' '):'Er zijn nog geen signaleringen ingesteld.';
      speak(summary);note(output,'Signaaloverzicht wordt voorgelezen.');return;
    }
    if(/(?:signaal|afwijking|waarschuwing|melding)/.test(n)&&/^(?:toon|open|welke|bekijk|laat)/.test(n)){
      reveal();note(output,'Hier zie je je ingestelde regels, bewijs, advies en mogelijke vervolgstappen.');return;
    }
    const navigation=n.match(/^(?:open|ga naar|toon|laat zien|navigeer naar)\s+(.+)$/);
    if(navigation){
      const page=findSpokenPage(navigation[1]);
      if(!page){note(output,'Ik kan dat onderdeel niet eenduidig vinden. Gebruik de precieze paginanaam.',true);return;}
      dialog.close();openPage(page.id);return;
    }
    if(n==='stop'||n==='sluiten'){dialog.close();return;}
    if(/^(?:vraag|vertel|wat |hoe |waarom |wanneer |welke |geef advies)/.test(n)){
      if(!authenticated()){note(output,'Log eerst in om vragen over je bedrijfscontext te stellen.',true);return;}
      note(output,'Vraag wordt opgehaald bij de bestaande tenantgebonden portaalassistent…');
      try{
        const question=n.startsWith('vraag ')?text.slice(5):text;
        const answer=await askPortal(question,{fetchImpl});
        note(output,answer?.text||'Geen onderbouwd antwoord beschikbaar.');
      }catch(error){note(output,'De portaalassistent kon deze vraag niet beantwoorden ('+String(error?.message||error)+').',true);}
      return;
    }
    // Universal, low-risk dictation: edit only the currently focused input.
    // Never submit forms, execute arbitrary buttons, or trigger privileged changes.
    const dictation=text.match(/^(?:schrijf|vul in|dicteer)\s+(.+)$/i);
    const target=lastPortalField;
    if(dictation&&target?.isConnected&&!target.disabled&&!target.readOnly&&!target.closest('[hidden],[aria-hidden="true"]')){
      dialog.close();target.focus();target.value=dictation[1];target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));
      note(output,'Tekst ingevuld. Controleer de inhoud en sla zelf op.');return;
    }
    note(output,'Niet herkende opdracht. Probeer “open [onderdeel]”, een vraag of “waarschuw me als [KPI] boven/onder [waarde]”.',true);
  }
  voiceButton.addEventListener('click',()=>{reveal();input.focus();});
  alertsButton.addEventListener('click',reveal);
  dialog.querySelector('[data-vs-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{stopListening();stopSpeaking();});
  dialog.querySelector('[data-vs-read]').addEventListener('click',()=>speak(output.textContent));
  dialog.querySelector('[data-vs-stop]').addEventListener('click',stopSpeaking);
  dialog.querySelector('[data-vs-run]').addEventListener('click',()=>{void runCommand(input.value);});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();void runCommand(input.value);}});
  mic.addEventListener('click',()=>{
    const Speech=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
    if(!Speech){note(output,'Spraakherkenning is niet beschikbaar in deze browser. Typ de opdracht in het veld.',true);return;}
    stopListening();
    try{
      const r=new Speech();recognizer=r;r.lang='nl-NL';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
      r.onresult=event=>{const t=String(event.results?.[0]?.[0]?.transcript||'').trim();input.value=t;void runCommand(t);};
      r.onerror=event=>note(output,'Microfoon niet beschikbaar: '+String(event.error||'onbekend')+'. Probeer typen.',true);
      r.onend=()=>{if(recognizer===r){recognizer=null;mic.disabled=false;mic.textContent='🎙 Spreek';}};
      mic.textContent='● Luistert…';r.start();
    }catch(error){stopListening();note(output,'De microfoon kon niet starten. Gebruik het tekstveld.',true);}
  });
  operator.addEventListener('change',switchFormThreshold);switchFormThreshold();
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    try{
      const metric=metricById(form.elements.metric.value);
      const op=operator.value,amount=op==='missing'?null:Number(threshold.value);
      if(!metric||!['above','below','missing'].includes(op)||op!=='missing'&&(!threshold.value.trim()||!Number.isFinite(amount)))
        throw Error('Kies een geldige KPI, vergelijking en grenswaarde.');
      const existing=stateRules(authenticated()?.state).map(normalizeRule).filter(Boolean);
      if(existing.some(x=>x.metricId===metric.id&&x.operator===op&&x.threshold===amount&&x.enabled))
        throw Error('Deze actieve signalering bestaat al.');
      const id=globalThis.crypto?.randomUUID?.()||('rule-'+Date.now()+'-'+Math.random().toString(36).slice(2));
      const rule=normalizeRule({id,metricId:metric.id,operator:op,threshold:amount,enabled:true,severity:form.elements.severity.value});
      if(!rule)throw Error('ONGELDIGE_REGEL');
      await commitRules([...existing,rule],id);
    }catch(error){note(output,'Niet bevestigd: '+String(error?.message||error),true);}
  });
  list.addEventListener('click',async event=>{
    const control=event.target.closest?.('[data-vs-action]');
    if(!control)return;
    if(control.dataset.vsAction==='go'){
      dialog.close();openPage(control.dataset.page);return;
    }
    if(control.dataset.vsAction==='create-task'){
      const signal=evaluateSignals(stateRules(authenticated()?.state),safe(authenticated()?.state),{authenticated:!!authenticated()}).find(x=>x.id===control.dataset.rule);
      if(!signal?.triggered){note(output,'Dit signaal is niet langer actief of meetbaar.',true);return;}
      selectedSignalId=signal.id;actionForm.hidden=false;
      actionForm.querySelector('[data-vs-action-context]').textContent=signal.metric.label+': '+signal.explanation+' Advies: '+signal.advice;
      actionForm.querySelector('[name=owner]').focus();return;
    }
    if(control.dataset.vsAction==='toggle'){
      try{
        const current=stateRules(authenticated()?.state).map(normalizeRule).filter(Boolean);
        const existing=current.find(x=>x.id===control.dataset.rule);
        if(!existing)throw Error('De signalering is niet meer beschikbaar.');
        await commitRules(current.map(x=>x.id===existing.id?{...x,enabled:!x.enabled}:x),existing.id);
      }catch(error){note(output,'Niet bevestigd: '+String(error?.message||error),true);}
    }
  });
  dialog.querySelector('[data-vs-action-cancel]').addEventListener('click',()=>{actionForm.hidden=true;selectedSignalId='';});
  actionForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const snap=authenticated();
    if(!snap){note(output,'Log eerst in om een taak te maken.',true);return;}
    if(busy||!domainState.initialized?.()||!['idle','saved'].includes(domainState.status?.())){note(output,'Gegevens zijn nog niet klaar om op te slaan.',true);return;}
    const ownerId=String(snap.user.id);
    const result=evaluateSignals(stateRules(snap.state),safe(snap.state),{authenticated:true}).find(x=>x.id===selectedSignalId);
    try{
      const task=buildSignalTask(result,{owner:actionForm.elements.owner.value,due:actionForm.elements.due.value});
      const existing=domainState.get('portal.tasks.items')||[];
      if(!Array.isArray(existing))throw Error('TAAKREGISTER_ONGELDIG');
      if(existing.some(x=>x?.id===task.id))throw Error('Voor dit signaal bestaat al een gekoppelde taak. Bekijk de takenlijst.');
      busy=true;actionForm.querySelector('[type=submit]').disabled=true;
      domainState.patch('portal.tasks',{items:[...existing,task]});
      const receipt=await domainState.flush();
      const readback=authenticated();
      const persisted=readback?.state?.portal?.tasks?.items?.find(x=>x?.id===task.id);
      if(String(readback?.user?.id||'')!==ownerId||receipt?.status!=='saved'||!persisted||persisted.owner!==task.owner||persisted.due!==task.due)
        throw Error('Taak is niet onafhankelijk teruggelezen; er is geen succesvolle registratie bevestigd.');
      note(output,'Taak voor '+task.owner+' opgeslagen en teruggelezen. Open Taken & werkstromen voor de voortgang.');
      selectedSignalId='';actionForm.hidden=true;render();
    }catch(error){note(output,'Actie niet bevestigd: '+String(error?.message||error),true);}
    finally{busy=false;actionForm.querySelector('[type=submit]').disabled=false;}
  });
  const unsubscribe=stateClient.subscribe(snap=>{
    const next=String((['authenticated','empty'].includes(snap.mode)&&!stateClient.isDemo?.()?snap.user?.id:'')||'');
    if(next!==principal){principal=next;stopListening();stopSpeaking();selectedSignalId='';actionForm.hidden=true;note(output,'');if(dialog.open)dialog.close();}
    render();
  });
  const boundary=()=>{stopListening();stopSpeaking();selectedSignalId='';actionForm.hidden=true;if(dialog.open)dialog.close();list.replaceChildren();note(output,'');render();};
  document.addEventListener('bg:portal-identity-boundary',boundary);
  const refreshed=()=>render();document.addEventListener('bg:portal-server-refreshed',refreshed);
  render();
  return {render,runCommand,destroy(){unsubscribe?.();stopListening();stopSpeaking();document.removeEventListener('bg:portal-identity-boundary',boundary);document.removeEventListener('bg:portal-server-refreshed',refreshed);document.removeEventListener('focusin',rememberField);holder.remove();dialog.remove();}};
}
