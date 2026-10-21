import {findPage,PORTAL_PAGE_INDEX} from './page-registry.js';
import {buildEntrepreneurHomeModel} from './entrepreneur-home-model.js';

export const CONNECTED_CONTEXT_VERSION='portal-one-organism-context-20261021-v1';

// A provider's presence in the architecture is not a tenant connection, a
// successful API call, or permission to read provider data in a customer UI.
export const SOURCE_DIRECTORY=Object.freeze({
  supabase:Object.freeze({label:'Supabase',role:'Beveiligde opslag en klantgegevens',page:'bronnenstatus'}),
  brain:Object.freeze({label:'Brein',role:'Eén bedrijfscontext en gecontroleerde verwerking',page:'brain-verwerking'}),
  powerhouse:Object.freeze({label:'Powerhouse',role:'Voorstellen, besluiten, acties en bewijs',page:'ondernemerscockpit'}),
  heartbeat:Object.freeze({label:'Heartbeat',role:'Actualiteit, signalen en opvolging',page:'actueel-houden'}),
  github:Object.freeze({label:'GitHub',role:'Broncode en beschermde softwarewijzigingen',page:'powerhouse-control-center'}),
  netlify:Object.freeze({label:'Netlify',role:'Gepubliceerde website en portaalversie',page:'powerhouse-control-center'}),
  notion:Object.freeze({label:'Notion',role:'Documentatie en vastgelegde kennis',page:'documenten'}),
  composio:Object.freeze({label:'Composio',role:'Externe accountkoppelingen met toestemming',page:'koppelingen'})
});
const GROUP_SOURCES=Object.freeze({
  overzicht:['brain','powerhouse','heartbeat','supabase'],
  besturen:['brain','powerhouse','supabase','heartbeat'],
  realiseren:['powerhouse','brain','heartbeat','supabase'],
  'data-intelligence':['supabase','brain','powerhouse','composio'],
  'actueel-externe-data':['heartbeat','brain','composio','supabase'],
  'continuiteit-risico':['heartbeat','brain','powerhouse','supabase'],
  beheren:['supabase','composio','github','netlify','notion']
});
const SPECIAL=Object.freeze({
  koppelingen:['composio','supabase','brain'],
  'powerhouse-control-center':['github','netlify','supabase','notion','composio','brain','powerhouse','heartbeat'],
  documenten:['notion','brain','supabase'],
  'bronnenbibliotheek':['heartbeat','brain','supabase'],
  'ai-modelkeuze':['brain','composio','supabase'],
  'data-ai-passport':['supabase','brain','composio']
});
const arr=x=>Array.isArray(x)?x:[];
const str=x=>String(x??'').trim();
const normalize=x=>str(x).toLowerCase().replace(/[^a-z0-9]+/g,'');
const canonicalSource=(name='')=>Object.keys(SOURCE_DIRECTORY).find(id=>normalize(name).includes(id))||null;
const ageGood=(at,now)=>{const time=Date.parse(str(at));return Number.isFinite(time)&&time<=now&&now-time<=24*3600*1000;};
const nonEmpty=x=>typeof x==='string'&&x.trim().length>0;

export function contextualSourceStatus(state={},id,now=Date.now()){
  const definition=SOURCE_DIRECTORY[id];
  if(!definition)return null;
  // Read ONLY the canonical authenticated customer runtime, not admin/global
  // integration records, a provider map, or the presence of an API key.
  const tenant=str(state?.tenant_id||state?.powerhouse?.tenant_id);
  const runtime=state?.portal?.runtime;
  const sourceRows=arr(runtime?.sources?.items);
  const evidence=sourceRows.find(item=>canonicalSource(item?.naam||item?.name||item?.provider)===id
    && nonEmpty(item?.evidenceRef||item?.evidence_ref)
    && ageGood(item?.updatedAt||item?.observedAt||item?.verifiedAt,now)
    && item?.healthy===true);
  // Provider statuses and health can be displayed as verified only when the
  // corresponding tenant-scoped source row has timestamped provider evidence.
  return Object.freeze({...definition,id,verified:Boolean(tenant&&evidence),
    labelStatus:tenant&&evidence?'Recente broncontrole aanwezig':'Verbinding niet bevestigd',
    note:tenant&&evidence?'Bronverwijzing en actualiteit aanwezig; dit bewijst geen eindresultaat.':'Deze bron kan relevant zijn. Er is geen actuele klantgebonden provider-readback bewezen.'});
}

export function buildConnectedJourneyModel({pageId='overzicht',state={},authenticated=false,impact=null,phase='unknown',now=Date.now()}={}){
  const page=findPage(pageId);
  if(!page)return null;
  const safe=authenticated&&state&&typeof state==='object'?state:{};
  const entrepreneur=buildEntrepreneurHomeModel(safe,{authenticated:Boolean(authenticated),now});
  const goal=entrepreneur.goals.find(item=>item.id===entrepreneur.selectedGoal)||null;
  const sourceIds=SPECIAL[pageId]||GROUP_SOURCES[page.sectionId]||GROUP_SOURCES.overzicht;
  const sources=sourceIds.map(id=>contextualSourceStatus(safe,id,now)).filter(Boolean);
  // Causal impact describes potential review paths only; even a canonical ACK
  // does not establish a quantified profit, legal conclusion or provider action.
  const related=authenticated&&impact&&['pending','confirmed'].includes(phase)
    ?[...new Set(arr(impact.affectedPages).filter(id=>id!==pageId&&Boolean(PORTAL_PAGE_INDEX[id])))].slice(0,8)
    :[];
  const rule=arr(impact?.effectRules).find(item=>nonEmpty(item?.reason));
  const next=entrepreneur.next;
  const targetRoute=next?.page&&PORTAL_PAGE_INDEX[next.page]?next.page:'overzicht';
  const message=goal
    ?`Je werkt aan ${goal.label.toLowerCase()}. ${page.label} hoort bij jouw bedrijfscontext. Gegevens veranderen niet automatisch in bewezen winst of een goedgekeurde actie.`
    :`Dit is ${page.label}. Kies eerst jouw ondernemersdoel om dit onderdeel in jouw bedrijfsroute te plaatsen.`;
  const impactStatus=phase==='confirmed'?'Opgeslagen in de bestaande bedrijfs- en Brain-keten':phase==='pending'?'Gewijzigd; opslag en Brain-bevestiging nog afwachten':'Geen recente wijziging met verwerkingsbewijs';
  return Object.freeze({pageId,pageLabel:page.label,goalLabel:goal?.label||null,
    message,action:Object.freeze({title:next.title||'Kies jouw ondernemersdoel',page:targetRoute}),
    sources:Object.freeze(sources),
    related:Object.freeze(related.map(id=>Object.freeze({id,label:PORTAL_PAGE_INDEX[id].label}))),
    impact:Object.freeze({phase:authenticated?phase:'unknown',status:impactStatus,
      reason:related.length?str(rule?.reason)||'Deze wijziging kan meerdere bedrijfsonderdelen raken; gevolgen vragen afzonderlijke verificatie.':null}),
    authenticated:Boolean(authenticated)});
}

export function allConnectedPagesHaveContext(){
  return Object.keys(PORTAL_PAGE_INDEX).every(pageId=>Boolean(buildConnectedJourneyModel({pageId})));
}
