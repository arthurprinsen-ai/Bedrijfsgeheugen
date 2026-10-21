import {buildEntrepreneurHomeModel,saveEntrepreneurGoal} from './entrepreneur-home-model.js';
import {navigatePortal,currentPortalRoute,subscribePortalRoute} from './router.js';
import {findPage} from './page-registry.js';

const add=(parent,tag,className,text)=>{
  const node=parent.ownerDocument.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=String(text);
  parent.appendChild(node);return node;
};

export function mountEntrepreneurHome({documentRef=globalThis.document,domainState,stateClient,navigate=navigatePortal}={}){
  const main=documentRef?.querySelector?.('.main');
  if(!main||!domainState?.get||!stateClient?.getSnapshot)return null;
  const existing=main.querySelector('[data-entrepreneur-home]');
  if(existing)return {element:existing};
  const host=documentRef.createElement('section');
  host.className='entrepreneur-home';
  host.dataset.entrepreneurHome='v1';
  host.setAttribute('aria-label','Jouw ondernemersroute');
  const anchor=main.querySelector('.daily-steering')||main.querySelector('.dashboard');
  main.insertBefore(host,anchor||null);
  let notice='',saving=false,subject='',generation=0,verifiedScanCount=null;
  const updatePageGuide=()=>{
    const root=documentRef.getElementById('portalView');
    if(!root)return;
    const previous=root.querySelector('[data-entrepreneur-guide]');
    if(!auth()||!root.classList.contains('open')){previous?.remove();return;}
    const target=root.dataset.pageId||currentPortalRoute().target;
    if(!findPage(target)){previous?.remove();return;}
    const state=domainState.get()||{};
    const model=buildEntrepreneurHomeModel(state,{authenticated:true,verifiedScanCount});
    const body=root.querySelector('.pvbody');
    if(!body)return;
    const guide=previous||documentRef.createElement('aside');
    guide.className='eh-page-guide';guide.dataset.entrepreneurGuide='true';
    guide.setAttribute('aria-label','Hulp bij jouw ondernemersdoel');
    guide.replaceChildren();
    add(guide,'strong','','Waarom ben je hier?');
    const chosen=model.goals.find(goal=>goal.id===model.selectedGoal);
    const page=findPage(target);
    const directlyRelevant=model.next.page===target;
    add(guide,'p','',chosen
      ?(directlyRelevant?'Dit helpt jouw doel '+chosen.label.toLowerCase()+': '+model.next.explanation
        :'Je werkt aan '+chosen.label.toLowerCase()+'. Je bekijkt nu '+page.label+'. Gebruik hier alleen gegevens die je kunt controleren en ga daarna verder met je persoonlijke route.')
      :'Je bekijkt '+page.label+'. Kies eerst jouw bedrijfsdoel om gerichte vervolgstappen te krijgen.');
    const back=add(guide,'button','eh-text-action',model.selectedGoal?'Terug naar mijn route →':'Kies mijn ondernemersdoel →');
    back.type='button';back.addEventListener('click',()=>navigate('overzicht'));
    if(!previous){
      const status=body.querySelector('.pvstatus');
      if(status)status.after(guide);else body.prepend(guide);
    }
  };
  const auth=()=>{
    const snapshot=stateClient.getSnapshot();
    return Boolean(snapshot?.user?.id&&['authenticated','empty'].includes(snapshot.mode)&&!stateClient.isDemo?.());
  };
  const principal=()=>{
    const snapshot=stateClient.getSnapshot();
    return auth()?String(snapshot.user.id):'';
  };
  const draw=()=>{
    if(!host.isConnected)return;
    updatePageGuide();
    const loggedIn=auth();
    const snapshot=domainState.snapshot?.();
    // Render only the authenticated principal's returned server snapshot. The mutable
    // domainState can still contain the preceding tenant while a login is hydrating.
    const customerState=loggedIn?stateClient.getSnapshot()?.state:null;
    const model=buildEntrepreneurHomeModel(customerState||{},{authenticated:loggedIn&&Boolean(customerState),verifiedScanCount:loggedIn&&customerState?verifiedScanCount:null});
    host.replaceChildren();
    const lead=add(host,'div','eh-lead');
    const copy=add(lead,'div','eh-lead-copy');
    add(copy,'span','eh-eyebrow','JOUW BEDRIJF · JOUW VOLGENDE STAP');
    add(copy,'h2','eh-title',loggedIn?model.headline:'Welkom bij jouw bedrijfsroute');
    add(copy,'p','eh-intro',loggedIn
      ?'Vertel wat je wilt bereiken. Bedrijfsgeheugen helpt je stap voor stap, met jouw eigen gegevens en onderbouwde aanbevelingen.'
      :'Log in om jouw Frisse Blik en bedrijfsdoelen veilig te bekijken. Voorbeeldgegevens worden hier niet als jouw bedrijf getoond.');
    const status=add(lead,'span','eh-status',loggedIn?(saving?'Opslaan…':snapshot?.status==='error'?'Opslaan niet bevestigd':model.selectedGoal?'Jouw doel centraal':'Begin met jouw ambitie'):'Inloggen nodig');
    status.setAttribute('role','status');

    if(!loggedIn){
      const login=add(host,'button','eh-main-action','Log in en ga verder →');
      login.type='button';login.dataset.entrepreneurLogin='true';
      add(host,'p','eh-truth','Een scanresultaat, cijfer of aanbeveling verschijnt uitsluitend voor de eigen ingelogde organisatie.');
      return;
    }
    const chooser=add(host,'div','eh-goals');
    add(chooser,'h3','','Wat wil jij met je bedrijf bereiken?');
    add(chooser,'p','eh-muted','Kies jouw belangrijkste doel. Je kunt later veranderen; andere vastgelegde doelen blijven bewaard.');
    const choices=add(chooser,'div','eh-goal-grid');
    for(const goal of model.goals){
      const button=add(choices,'button','eh-goal'+(model.selectedGoal===goal.id?' is-selected':''),goal.label);
      button.type='button';button.dataset.entrepreneurGoal=goal.id;
      button.setAttribute('aria-pressed',String(model.selectedGoal===goal.id));
      button.disabled=saving;
    }

    const columns=add(host,'div','eh-cards');
    const scan=add(columns,'article','eh-info-card');
    add(scan,'span','eh-card-label','Wat weten we uit jouw scan?');
    add(scan,'h3','',model.scan.verified?(model.scan.score===null?(model.scan.count?'Nulmetingen gekoppeld: '+model.scan.count:'Nulmeting gekoppeld'):'Nulmeting '+model.scan.score+'/100'):'Scanstatus nog niet bevestigd');
    add(scan,'p','',model.scan.description);
    const scanButton=add(scan,'button','eh-text-action',model.scan.verified?'Bekijk je scan →':'Bekijk of koppel je scan →');
    scanButton.type='button';scanButton.dataset.entrepreneurScan='true';
    const ambition=add(columns,'article','eh-info-card');
    add(ambition,'span','eh-card-label','Waar werk jij naartoe?');
    add(ambition,'h3','',model.selectedGoal?model.goals.find(goal=>goal.id===model.selectedGoal)?.label:'Nog geen doel vastgelegd');
    add(ambition,'p','',model.target
      ?'Je doelwaarde en doeldatum zijn vastgelegd. De actuele voortgang wordt alleen getoond wanneer betrouwbare meetgegevens beschikbaar zijn.'
      :'Leg een meetbare doelwaarde en datum vast zodat je vooruitgang kunt volgen.');
    const measure=add(ambition,'button','eh-text-action','Doel en bedrijfsgegevens bekijken →');
    measure.type='button';measure.dataset.entrepreneurPage='bedrijfssituatie';

    const next=add(host,'article','eh-next');
    const eyebrow=add(next,'span','eh-next-label',model.next.kind==='verified-proposal'?'ONDERBOUWD VOORSTEL':'JOUW BESTE VOLGENDE STAP');
    add(next,'h3','',model.next.title);
    add(next,'p','',model.next.explanation);
    if(model.next.kind==='verified-proposal'){
      add(next,'small','eh-truth',model.next.evidenceCount+' bronverwijzing(en). '+(model.next.requiresApproval?'Voor uitvoering kan goedkeuring nodig zijn.':'Een voorstel is nog geen uitgevoerde handeling.'));
    }else add(next,'small','eh-truth','Deze stap is begeleiding op basis van je gekozen doel, geen bewezen financieel rendement.');
    if(model.next.page){
      const action=add(next,'button','eh-main-action',model.next.kind==='verified-proposal'?'Bekijk voorstel en onderbouwing →':'Ga verder met deze stap →');
      action.type='button';action.dataset.entrepreneurPage=model.next.page;
    }else add(next,'p','eh-small','Begin door hierboven een doel te kiezen.');
    const footer=add(host,'div','eh-foot');
    add(footer,'span','','1 · Kies je doel');
    add(footer,'span','','2 · Maak het meetbaar');
    add(footer,'span','','3 · Onderzoek en besluit');
    add(footer,'span','','4 · Meet wat echt werkt');
    const feedback=add(host,'p','eh-feedback',notice||(
      snapshot?.status==='error'?'Gegevens zijn niet bevestigd als opgeslagen. Je wijzigingen blijven herstelbaar.':
      model.intelligence.ready?model.intelligence.verifiedSignals+' brononderbouwde onderdelen beschikbaar in de bestaande ondernemerscockpit.':
      'Nog geen geverifieerde Powerhouse-projectie. We tonen geen verzonnen kansen of resultaten.'
    ));
    feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  };
  host.addEventListener('click',async event=>{
    const button=event.target.closest('button');
    if(!button||!host.contains(button))return;
    if(button.dataset.entrepreneurLogin==='true'){globalThis.netlifyIdentity?.open?.('login');return;}
    if(!auth())return;
    if(button.dataset.entrepreneurScan==='true'){
      const scans=documentRef.getElementById('portalCanonicalScans');
      if(scans&&!scans.hidden){scans.scrollIntoView?.({behavior:'smooth',block:'center'});return;}
      navigate('frisse-blik');return;
    }
    if(button.dataset.entrepreneurPage){navigate(button.dataset.entrepreneurPage);return;}
    const goalId=button.dataset.entrepreneurGoal;
    if(!goalId||saving)return;
    // A freshly authenticated but not-yet-hydrated principal cannot write an old
    // tenant's mutable state. Require a real server snapshot and canonical init.
    if(stateClient.getSnapshot()?.mode!=='authenticated'||!stateClient.getSnapshot()?.state||!domainState.initialized?.()){
      notice='Je eigen bedrijfsgegevens worden nog geladen. Probeer het opnieuw wanneer ze beschikbaar zijn.';draw();return;
    }
    const owner=principal();
    if(!owner)return;
    const request=++generation;
    saving=true;notice='We slaan jouw doel op in je eigen beveiligde bedrijfsomgeving…';draw();
    try{
      await saveEntrepreneurGoal(domainState,goalId,{authenticated:true});
      if(request!==generation||owner!==principal())return;
      notice='Je doel is bevestigd opgeslagen en aangeboden aan de bestaande Brain-verwerkingsketen. Bekijk nu de volgende stap.';
    }catch(error){
      if(request!==generation||owner!==principal())return;
      notice='Opslaan niet bevestigd. Er is geen succesvol Brain-resultaat geclaimd. Probeer opnieuw of controleer je verbinding.';
    }finally{
      if(request===generation&&owner===principal()){saving=false;draw();}
    }
  });
  const onIdentity=()=>{const next=principal();if(next!==subject){generation++;subject=next;saving=false;notice='';verifiedScanCount=null;}draw();};
  const onVerifiedScans=event=>{if(!auth())return;const count=event?.detail?.count;verifiedScanCount=Number.isInteger(count)&&count>=0?count:null;draw();};
  documentRef.defaultView?.addEventListener?.('bg:portal-verified-scan-count',onVerifiedScans);
  const unsubscribeIdentity=stateClient.subscribe(onIdentity);
  const unsubscribeDomain=domainState.subscribe(draw);
  const unsubscribeRoute=subscribePortalRoute(({target})=>{host.hidden=target!=='overzicht';updatePageGuide();});
  host.hidden=currentPortalRoute().target!=='overzicht';
  onIdentity();
  return Object.freeze({element:host,refresh:draw,destroy(){generation++;unsubscribeIdentity?.();unsubscribeDomain?.();unsubscribeRoute?.();documentRef.defaultView?.removeEventListener?.('bg:portal-verified-scan-count',onVerifiedScans);documentRef.getElementById('portalView')?.querySelector('[data-entrepreneur-guide]')?.remove();host.remove();}});
}
