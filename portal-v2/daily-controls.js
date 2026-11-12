// Quiet, single-glance controls in the ORIGINAL authenticated entrepreneur homepage.
// Read-only projection of the SAME tenant/source-revision home + journey. No
// second provider, business state, telemetry, promise of execution or source.
const card=(id,label,status,detail,page,confirmed=false,pending=false)=>Object.freeze({
 id,label,status,detail,page,confirmed:Boolean(confirmed),pending:Boolean(pending)
});
const step=(journey,id)=>Array.isArray(journey?.steps)
 ?journey.steps.find(item=>item?.id===id&&item.confirmed===true):null;

export function buildDailyControlCards({authenticated=false,home=null,journey=null,pendingHandoff=null}={}){
 if(authenticated!==true||home?.authenticated!==true||journey?.authenticated!==true)
  return Object.freeze([]);
 const hasSources=Boolean(step(journey,'evidence'));
 const hasScan=home?.scan?.verified===true;
 const hasDecision=Boolean(step(journey,'decision'));
 const hasOutcome=Boolean(step(journey,'outcome'));
 const pending=pendingHandoff?.pending===true;
 // A source or a generic Brain receipt does NOT prove a provider action, outcome
 // or applied learning. Each label explicitly names its exact evidence class.
 const brainAck=journey?.brainReceipt?.acknowledged===true&&!pending;
 return Object.freeze([
  card('gegevens','Gegevens',hasSources?'Bronbewijs beschikbaar':hasScan?'Nulmeting gekoppeld':'Bronnen aanvullen',
   hasSources?'Bekijk je eigen onderbouwde bedrijfscontext':hasScan?'Zelfgerapporteerde scan; overige bronnen afzonderlijk toetsen':'Vul bedrijfsgegevens in en controleer de herkomst',
   'ingevulde-gegevens',hasSources),
  card('acties','Acties',hasDecision?'Voorstel onderbouwd':'Nog geen onderbouwd voorstel',
   hasDecision?'Bekijk het voorstel en de noodzakelijke goedkeuring':'Bekijk je taken en de volgende veilige stap',
   'actieve-acties',hasDecision),
  card('resultaat','Resultaat',hasOutcome?'Uitkomst met bronbewijs':'Nog geen bewezen effect',
   hasOutcome?'Bekijk bron, meetmoment en onafhankelijk bewijs':'Een advies of actie is nog geen gerealiseerd resultaat',
   'outcomes-evidence',hasOutcome),
  card('verwerking','Verwerking',pending?'Ontvangst nog open':brainAck?'Brain-invoer bevestigd':'Geen actuele Brain-bevestiging',
   pending?'De bestaande verwerking reconcilieert; geen resultaat claimen':brainAck?'Ontvangst bevestigd; effect en leren worden apart beoordeeld':'Controleer de oorspronkelijke bron en overdracht',
   'brain-verwerking',brainAck,pending)
 ]);
}
const add=(parent,tag,className,value)=>{
 const node=parent.ownerDocument.createElement(tag);
 if(className)node.className=className;
 if(value!==undefined)node.textContent=String(value);
 parent.appendChild(node);
 return node;
};
export function renderDailyControls(parent,options={}){
 const cards=buildDailyControlCards(options);
 if(!cards.length||!parent?.ownerDocument)return null;
 const section=add(parent,'section','eh-quick-controls');
 section.dataset.portalDailyControls='v1';
 section.setAttribute('aria-labelledby','ehQuickControlsTitle');
 const heading=add(section,'div','eh-quick-heading');
 add(heading,'h3','','Jouw bedrijf. In één oogopslag.').id='ehQuickControlsTitle';
 add(heading,'p','','Open direct wat je wilt regelen. Alleen bevestigde gegevens krijgen een bevestigde status.');
 const grid=add(section,'div','eh-quick-grid');
 for(const item of cards){
  const button=add(grid,'button','eh-quick-card');
  button.type='button';
  button.dataset.entrepreneurPage=item.page;
  button.dataset.evidenceStatus=item.pending?'pending':item.confirmed?'confirmed':'unverified';
  button.setAttribute('aria-label',item.label+': '+item.status+'. Open onderdeel.');
  add(button,'span','eh-quick-label',item.label);
  add(button,'strong','eh-quick-status',item.status);
  add(button,'small','eh-quick-detail',item.detail);
  add(button,'span','eh-quick-arrow','Open →').setAttribute('aria-hidden','true');
 }
 return section;
}
