import {buildOwnerOperatingModel} from './owner-operating-model.js';
import {buildWinstnavigatorModel} from './winstnavigator.js';
import {findPage} from './page-registry.js';

// This is a read-only composition of existing, authenticated authorities. It does
// not own persistence, approvals, forecasts, connector credentials or a scheduler.
const clean=value=>String(value??'').trim();
const route=page=>Boolean(findPage(page));
const unique=values=>[...new Set(values)];
const PAGE_HINTS=Object.freeze({
  overzicht:'Dit overzicht helpt je kiezen waar je vandaag als ondernemer aandacht aan geeft.',
  besturen:'Leg keuzes en doelen vast. Veranderingen worden alleen als verwerkt getoond na de canonieke bevestiging.',
  realiseren:'Leg uitvoering en eigenaar vast. Een voorstel is nog geen uitgevoerde actie.',
  'data-intelligence':'Controleer de oorsprong, toestemming en actualiteit van je gegevens voordat je conclusies trekt.',
  'actueel-externe-data':'Externe signalen zijn context, niet automatisch feiten of bewezen kansen voor jouw onderneming.',
  'continuiteit-risico':'Controleer afhankelijkheden, risico en bewijs. Wettelijke toepasbaarheid moet afzonderlijk worden vastgesteld.',
  beheren:'Deze pagina beheert je beveiligde bedrijfsomgeving en toegangsinstellingen.',
  overig:'Controleer hoe de conclusie zich verhoudt tot je doel, de brongegevens en mogelijke risico’s.'
});

export function buildEntrepreneurJourneyModel(state={},{
  authenticated=false,home=null,impact=null,brainReceipt=null,tenantRuntime=null,now=Date.now()
}={}){
  if(!authenticated||!home?.authenticated)return Object.freeze({
    authenticated:false,steps:Object.freeze([]),cockpit:null,scenario:null,
    dependencies:Object.freeze([]),brainReceipt:null,heartbeat:'UNKNOWN'
  });
  const safe=state&&typeof state==='object'?state:{};
  const owner=buildOwnerOperatingModel(safe,{now});
  const metric=home.selectedGoal||'profit';
  const twin=buildWinstnavigatorModel(safe,{metric,days:90,asOf:new Date(now).toISOString()});
  const chosen=twin.selected;
  const stateConfirmed=Boolean(safe?.portal?.business_context?.goal_confirmed_at&&home.selectedGoal);
  const verifiedSeries=chosen?.history?.filter(item=>item.evidenceRef).length||0;
  // Only current principal-bound runtime readback is eligible for live evidence.
  // Legacy canonical state remains the fallback; admin inventories are never proof.
  const liveRuntime=tenantRuntime&&typeof tenantRuntime==='object'?tenantRuntime:safe?.portal?.runtime;
  const observation=liveRuntime?.observability;
  const updated=Date.parse(observation?.updatedAt||'');
  const currentRuntime=observation?.source==='brain-operating-loop'&&Number.isFinite(updated)&&updated<=now&&now-updated<86400000;
  const dependencies=unique((Array.isArray(impact?.affectedPages)?impact.affectedPages:[]).filter(route)).slice(0,8)
    .map(id=>Object.freeze({id,label:findPage(id).label}));
  const receipt=brainReceipt?.acknowledged===true
    ?Object.freeze({acknowledged:true,label:'Brain-invoer bevestigd; daadwerkelijke gevolgen en resultaten afzonderlijk toetsen'})
    :impact?Object.freeze({acknowledged:false,label:'Afhankelijke pagina’s gemarkeerd; definitieve Brain-verwerking nog niet aangetoond'}):null;
  return Object.freeze({
    authenticated:true,
    steps:Object.freeze([
      Object.freeze({id:'scan',label:'Frisse Blik',confirmed:home.scan.verified,detail:home.scan.verified?'Gekoppeld aan je eigen bedrijf; antwoorden hoeven niet opnieuw':'Nog geen gecontroleerde koppeling met je eigen bedrijf'}),
      Object.freeze({id:'goal',label:'Mijn doel',confirmed:stateConfirmed,detail:stateConfirmed?'Voorkeur vastgelegd, niet je hele bedrijfsdiagnose':'Kies een doel; andere bedrijfsgegevens blijven onveranderd'}),
      Object.freeze({id:'evidence',label:'Mijn bedrijfsgegevens',confirmed:owner.ready&&owner.proof.verified>0,detail:owner.ready?owner.proof.verified+' onderdelen met bronbewijs':'Een actuele klantgebonden Powerhouse-projectie is nog niet bewezen'}),
      Object.freeze({id:'decision',label:'Mijn vervolgstap',confirmed:home.next.kind==='verified-proposal',detail:home.next.kind==='verified-proposal'?'Onderbouwd voorstel, uitvoering vraagt eigen bewijs':'Begeleidingsstap; geen gerealiseerd financieel effect'}),
      Object.freeze({id:'outcome',label:'Gemeten resultaat',confirmed:owner.outcomes.length>0,detail:owner.outcomes.length?owner.outcomes.length+' brongeverifieerde uitkomsten':'Nog geen gerealiseerde uitkomst met voldoende bewijs'})
    ]),
    cockpit:Object.freeze({ready:owner.ready,actions:owner.counts.acties,verified:owner.proof.verified,outcomes:owner.counts.uitkomsten}),
    scenario:Object.freeze({
      id:metric,history:chosen?.history?.length||0,sourceRefs:verifiedSeries,
      available:Boolean(chosen?.forecast),quality:chosen?.quality||'INSUFFICIENT_HISTORY',
      note:chosen?.forecast?'Een verkennende trend met onzekerheid; geen causale voorspelling of gerealiseerde winst':
        'Geen verantwoorde trend: minimaal 3 recente metingen over 14 dagen zijn nodig'
    }),
    dependencies:Object.freeze(dependencies),brainReceipt:receipt,
    heartbeat:currentRuntime?'TENANT_RUNTIME_OBSERVED':'UNKNOWN'
  });
}

// Correlate a Brain ACK to the exact mutation generation and state path.
// A successful write for another form, older revision or tenant is not proof.
export function isBrainAckForImpact(impact,detail={}){
  if(!impact||!Number.isInteger(impact.generation)||!impact.path)return false;
  return Array.isArray(detail.stored)&&detail.stored.length>0
    &&Array.isArray(detail.impacts)
    &&detail.impacts.some(item=>item?.generation===impact.generation&&item?.path===impact.path);
}

export function journeyGuidance(pageId,home,journey){
  const page=findPage(pageId);
  if(!page)return null;
  const goal=home?.goals?.find(item=>item.id===home.selectedGoal);
  const group=PAGE_HINTS[page.sectionId]||PAGE_HINTS.overig;
  const direct=home?.next?.page===pageId;
  const impacted=journey?.dependencies?.some(item=>item.id===pageId);
  return Object.freeze({
    title:page.label,
    why:goal?(direct?'Deze pagina helpt je direct bij '+goal.label.toLowerCase()+'.':
      'Je werkt aan '+goal.label.toLowerCase()+'. '+group):'Kies jouw ondernemersdoel. '+group,
    check:impacted?'Deze pagina kan door je laatste wijziging zijn geraakt; bekijk de vernieuwde gegevens en het bronbewijs.':
      'Gebruik brongegevens voor conclusies. Zonder betrouwbare gegevens blijven cijfers en effectinschattingen onbekend.',
    next:direct?home.next.explanation:'Je kunt altijd naar je persoonlijke ondernemersroute terugkeren.'
  });
}
