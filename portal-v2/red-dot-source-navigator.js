// Original Portal V2 enhancement, not a second integration or data read authority.
// A customer's connector configurations are never interpreted as ingested business facts.
const PHASES=Object.freeze([
  Object.freeze({id:'choose',number:'01',title:'Kies',subtitle:'Een bron die bij je past'}),
  Object.freeze({id:'allow',number:'02',title:'Bepaal',subtitle:'Jij geeft de grenzen aan'}),
  Object.freeze({id:'verify',number:'03',title:'Bewijs',subtitle:'Eerst controleren, dan gebruiken'}),
  Object.freeze({id:'understand',number:'04',title:'Begrijp',subtitle:'Van gegevens naar een besluit'})
]);
const el=(tag,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;return node;};
const say=(node,value)=>{node.textContent=String(value??'');return node;};
const onlyModes=new Set(['CONNECTION_ONLY','PORTAL_INSIGHTS','PORTAL_AI']);

export function sourceNavigatorSnapshot(definitions,{available=true}={}){
 if(!available||!Array.isArray(definitions)){
   return Object.freeze({available:false,configured:null,activated:null,insightsRequested:null,aiRequested:null,actualRecordsVerified:false});
 }
 const rows=definitions.slice(0,1000);
 return Object.freeze({
  available:true,
  configured:rows.length,
  activated:rows.filter(row=>row?.state==='Active').length,
  insightsRequested:rows.filter(row=>onlyModes.has(row?.dataUse?.mode)&&row.dataUse.mode!=='CONNECTION_ONLY').length,
  aiRequested:rows.filter(row=>row?.dataUse?.mode==='PORTAL_AI').length,
  actualRecordsVerified:false // Canonical list endpoint has no persisted source-record receipt.
 });
}
export function sourceNavigatorExplanation(phase,snapshot){
 const count=snapshot?.available?snapshot.configured:null;
 switch(phase){
 case 'choose':
  return count===null
   ?'We kunnen je opgeslagen bronnen nu niet bevestigen. Je kunt wel de beschikbare koppelroutes bekijken.'
   :count===0
    ?'Er zijn nog geen koppelingen opgeslagen. Vertel wat je wilt bereiken of kies een voorbeeld. De Studio maakt eerst een concept.'
    :`Je hebt ${count} opgeslagen koppeling(en). Iedere verbinding heeft eigen instellingen; een opgeslagen concept betekent nog geen gegevensimport.`;
 case 'allow':
  return snapshot?.available
   ?`Bij ${snapshot.insightsRequested} koppeling(en) is gebruik voor portaalinzichten aangevraagd en bij ${snapshot.aiRequested} daarvan ook AI-advies. Dit zijn keuzes in de configuratie, geen bewijs dat data verwerkt is. Je kunt toestemmingen per koppeling aanpassen.`
   :'Jij kiest per bron welke velden naar welke pagina mogen en of AI-advies is toegestaan. Extra datagebruik staat standaard uit.';
 case 'verify':
  return 'Eerst echte providerrechten en bronreadback, daarna veilige opslag, tenant-isolatie en een onafhankelijke controle. Een voorbeeldtest of geactiveerde instelling is geen bewijs van werkelijke gegevens.';
 case 'understand':
  return 'Pas nadat echte gegevens en herkomst bevestigd zijn, mogen ze als KPI of bedrijfsinzicht verschijnen. Het Brein en Powerhouse mogen alleen met toegestane, geverifieerde gegevens werken. Zonder bewijs zie je geen fictieve cijfers.';
 default: return sourceNavigatorExplanation('choose',snapshot);
 }
}
function statistic(value,title){
 const article=el('div','bg-award-nav__stat');
 article.append(say(el('strong'),value===null?'—':value),say(el('span'),title));return article;
}
function stageButton(stage){
 const button=el('button','bg-award-nav__stage');
 button.type='button';button.dataset.awardPhase=stage.id;button.setAttribute('aria-pressed','false');
 button.append(say(el('span','bg-award-nav__number'),stage.number),say(el('strong'),stage.title),say(el('small'),stage.subtitle));
 return button;
}
export async function mountAwardSourceNavigator(container,{fetchFn=globalThis.fetch}={}){
 if(!container||typeof fetchFn!=='function'||typeof document==='undefined')return null;
 const section=el('section','bg-award-nav');section.dataset.awardSourceNavigator='v1';
 section.setAttribute('aria-labelledby','bg-award-nav-title');
 const hero=el('div','bg-award-nav__hero');
 const copy=el('div','bg-award-nav__copy');
 copy.append(say(el('p','bg-award-nav__eyebrow'),'BEDRIJFSGEHEUGEN · CONNECTIE-ERVARING'),
             say(el('h2'), 'Van jouw software naar inzicht'),
             say(el('p'),'Je wilt je bedrijf begrijpen, niet een technische koppeling beheren. Volg je gegevens stap voor stap. Jij bepaalt het gebruik; wij tonen alleen wat bewezen is.'));
 copy.querySelector('h2').id='bg-award-nav-title';
 const motif=el('div','bg-award-nav__motif');motif.setAttribute('aria-hidden','true');
 const motifLine=el('div','bg-award-nav__motifline');
 for(const txt of ['BRON','VERTROUWEN','INZICHT']) motifLine.append(say(el('span'),txt));
 motif.append(motifLine);
 hero.append(copy,motif);section.append(hero);

 const summary=el('div','bg-award-nav__stats');summary.setAttribute('aria-label','Instellingen en bewijs');
 const connected=statistic(null,'Opgeslagen configuraties');
 const opted=statistic(null,'Portaalgebruik aangevraagd');
 const proof=statistic('—','Echte bronwaarden bewezen');
 summary.append(connected,opted,proof);section.append(summary);

 const narrative=el('div','bg-award-nav__narrative');
 narrative.append(say(el('h3'),'Jouw gegevensroute'),say(el('p'),'Kies een stap om te zien wat de Studio doet — en wat nog niet bewezen is.'));
 const stages=el('div','bg-award-nav__stages');stages.setAttribute('role','group');stages.setAttribute('aria-label','Bekijk elke stap in de gegevensroute');
 for(const step of PHASES) stages.append(stageButton(step));
 const explanation=el('div','bg-award-nav__explanation');
 explanation.setAttribute('role','status');explanation.setAttribute('aria-live','polite');
 const phaseLabel=el('strong'),phaseText=el('p');
 explanation.append(phaseLabel,phaseText);
 narrative.append(stages,explanation);section.append(narrative);

 const footer=el('div','bg-award-nav__footer');
 const action=el('button','bg-award-nav__cta');action.type='button';action.dataset.awardStart='true';
 say(action,'Beschrijf jouw koppeling ↗');
 const examples=el('button','bg-award-nav__secondary');examples.type='button';examples.dataset.awardExamples='true';
 say(examples,'Bekijk voorbeelden');
 const passport=el('a','bg-award-nav__passport');passport.href='https://www.bedrijfsgeheugen.nl/portal-v2/?page=data-ai-passport';
 passport.setAttribute('data-open-page','data-ai-passport');
 say(passport,'Gegevensgebruik en verwerkingslocatie →');
 footer.append(action,examples,passport);
 section.append(footer);

 const caveat=say(el('p','bg-award-nav__caveat'),'Dit overzicht toont connectorinstellingen, geen facturen, omzet of andere geïmporteerde klantgegevens. Een award of toegankelijkheidscertificering is niet geclaimd.');
 section.append(caveat);
 container.prepend(section);
 let snapshot=sourceNavigatorSnapshot(null,{available:false});
 let selected='choose';
 const paint=()=>{
   for(const b of stages.querySelectorAll('button[data-award-phase]')){
    const active=b.dataset.awardPhase===selected;
    b.setAttribute('aria-pressed',String(active));
    b.classList.toggle('is-selected',active);
   }
   const phase=PHASES.find(x=>x.id===selected)||PHASES[0];
   say(phaseLabel,phase.number+' / '+phase.title);
   say(phaseText,sourceNavigatorExplanation(selected,snapshot));
 };
 stages.addEventListener('click',event=>{
  const btn=event.target?.closest?.('button[data-award-phase]');
  if(!btn||!stages.contains(btn))return;
  selected=btn.dataset.awardPhase;paint(); // preserve focus, no hidden interaction or data writes
 });
 const moveTo=selector=>{
  const target=container.querySelector(selector);
  if(!target)return;
  if(target.tagName==='BUTTON'||target.tagName==='TEXTAREA')target.focus();
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  target.scrollIntoView?.({behavior:reduced?'instant':'smooth',block:'center'});
 };
 action.addEventListener('click',()=>moveTo('[data-bg-intent]'));
 examples.addEventListener('click',()=>{
   const button=container.querySelector('[data-bg-route="template"]');
   button?.click();moveTo('[data-bg-template-list] button[data-template-id]'); // original wizard owns all choices
 });
 paint();
 try{
  const response=await fetchFn('/api/connectors',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
  if(!section.isConnected)return null;
  if(!response?.ok)throw new Error('SOURCE_READBACK_UNAVAILABLE');
  const body=await response.json();if(!Array.isArray(body))throw new Error('SOURCE_LIST_SHAPE_INVALID');
  snapshot=sourceNavigatorSnapshot(body);
 }catch{snapshot=sourceNavigatorSnapshot(null,{available:false});}
 if(!section.isConnected)return null;
 say(connected.querySelector('strong'),snapshot.configured===null?'—':snapshot.configured);
 say(opted.querySelector('strong'),snapshot.insightsRequested===null?'—':snapshot.insightsRequested);
 // Never fill 'real data proven' from configuration count, activation or sample tests.
 paint();
 return section;
}
