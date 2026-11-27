import {findPage} from './page-registry.js';

// ONE authenticated Portal V2 projection. This code does not persist, schedule,
// fetch, create an agent or acknowledge work on behalf of ONE BRAIN.
const DOMAINS=Object.freeze([
  {id:'strategy',label:'Doelen & strategie',page:'bedrijfssituatie',description:'Doelen, besluiten en hun gevolgen'},
  {id:'work',label:'Processen & werk',page:'taken-werkstromen',description:'Taken, eigenaren en overdrachten'},
  {id:'customers',label:'Klanten & groei',page:'sales-intelligence',description:'Klantvragen en commerciële kansen'},
  {id:'people',label:'Mensen & kennis',page:'mensen',description:'Rollen en bedrijfscontinuïteit'},
  {id:'finance',label:'Financiën & waarde',page:'businesscase',description:'Kosten, aannames en gerealiseerd effect'},
  {id:'connections',label:'Systemen & data',page:'koppelingen',description:'Geautoriseerde bronkoppelingen'}
]);
const STAGES=Object.freeze([
  ['source','Bron & context'],
  ['brain','ONE BRAIN'],
  ['execution','Powerhouse'],
  ['outcome','Heartbeat'],
  ['learning','Leren']
]);
const freeze=x=>Object.freeze(x);

export function buildOneRoofModel({authenticated=false,state=null,journey=null,pendingHandoff=null}={}){
  if(!authenticated||!state||typeof state!=='object'||!journey?.authenticated){
    return freeze({authenticated:false,domains:freeze([]),stages:freeze([]),closed:false,summary:'Log in om je eigen bedrijf te bekijken.'});
  }
  const steps=Array.isArray(journey.steps)?journey.steps:[];
  const hasOwnSource=steps.some(s=>['scan','evidence'].includes(s?.id)&&s.confirmed===true);
  const pending=pendingHandoff?.pending===true;
  // A producer POST or generic refresh does not establish actual consumer
  // processing. Every later stage needs its own independent evidence.
  const brainReceived=journey.brainReceipt?.acknowledged===true&&!pending;
  const executed=brainReceived&&journey.autopilot?.autonomousExecutionVerified===true;
  const observed=executed&&journey.autopilot?.freshRuntime===true
    &&Number.isInteger(journey.autopilot?.outcomes)&&journey.autopilot.outcomes>0;
  const learned=observed&&Number.isInteger(journey.autopilot?.learned)&&journey.autopilot.learned>0;
  const proofs={source:hasOwnSource,brain:brainReceived,execution:executed,outcome:observed,learning:learned};
  const stages=STAGES.map(([id,label])=>freeze({
    id,label,status:proofs[id]?'confirmed':id==='brain'&&pending?'pending':'unverified',
    description:proofs[id]?'Bronbewijs in huidige sessie':id==='brain'&&pending
      ?'Originele overdracht wacht op onafhankelijke ontvangst':'Nog geen volledige bevestiging voor deze stap'
  }));
  const domains=DOMAINS.filter(d=>Boolean(findPage(d.page))).map(d=>freeze({...d}));
  return freeze({
    authenticated:true,domains:freeze(domains),stages:freeze(stages),
    closed:stages.every(x=>x.status==='confirmed'),
    summary:learned?'Lus zichtbaar onderbouwd voor deze beschikbare uitkomsten. Controleer per actie het bronbewijs.'
      :pending?'Een originele overdracht staat nog open. De bestaande herstelketen blijft eigenaar.'
      :'Nog geen volledig gesloten bedrijfsbrede lus bewezen; ontbrekend bewijs blijft zichtbaar.'
  });
}

function element(doc,tag,cls,content){
  const node=doc.createElement(tag);if(cls)node.className=cls;
  if(content!==undefined)node.textContent=content;return node;
}

// Render INSIDE the existing entrepreneur disclosure. The existing authenticated
// one-next-action hero and delegated data-entrepreneur-page router stay canonical.
export function renderOneRoofWorkspace(container,options={}){
  const model=buildOneRoofModel(options);
  if(!model.authenticated)return null;
  const doc=container.ownerDocument;
  const section=element(doc,'section','bgos-workspace');
  section.dataset.oneRoofWorkspace='v1';
  section.setAttribute('aria-labelledby','bgos-title');
  const head=element(doc,'div','bgos-heading');
  const heading=element(doc,'div');
  heading.appendChild(element(doc,'span','bgos-eyebrow','JOUW BEDRIJF · ÉÉN WERKPLEK'));
  const title=element(doc,'h3','','Alles onder één dak');
  title.id='bgos-title';heading.appendChild(title);
  heading.appendChild(element(doc,'p','','Verbind wat je weet, beslist en uitvoert. Je bestaande gegevens en pagina’s blijven leidend.'));
  head.appendChild(heading);section.appendChild(head);
  const grid=element(doc,'div','bgos-grid');
  for(const domain of model.domains){
    const button=element(doc,'button','bgos-domain');
    button.type='button';button.dataset.entrepreneurPage=domain.page;
    button.setAttribute('aria-label',domain.label+' bekijken');
    button.appendChild(element(doc,'strong','',domain.label));
    button.appendChild(element(doc,'span','',domain.description));
    grid.appendChild(button);
  }
  section.appendChild(grid);
  const detail=element(doc,'details','bgos-evidence');
  const summary=element(doc,'summary','','Hoe werken mijn gegevens door?');
  detail.appendChild(summary);
  detail.appendChild(element(doc,'p','bgos-note','Eén bestaande keten; een verstuurde wijziging is pas verwerkt na controle van de echte ontvanger.'));
  const list=element(doc,'ol','bgos-chain');
  for(const stage of model.stages){
    const item=element(doc,'li','bgos-stage');
    item.dataset.evidenceStatus=stage.status;
    item.appendChild(element(doc,'strong','',stage.label));
    item.appendChild(element(doc,'span','',stage.status==='confirmed'?'Bevestigd':stage.status==='pending'?'In behandeling':'Bewijs ontbreekt'));
    list.appendChild(item);
  }
  detail.appendChild(list);
  const status=element(doc,'p','bgos-status',model.summary);
  status.setAttribute('role','status');detail.appendChild(status);
  section.appendChild(detail);
  container.appendChild(section);return section;
}
