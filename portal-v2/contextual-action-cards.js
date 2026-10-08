import { PORTAL_PAGE_INDEX } from './page-registry.js';
import { companyInputSchema } from './modules/company-input.js';
import { functionalSchema } from './modules/functional-suite.js';
import { fullCompanyInputSchema } from './modules/full-company-input.js';
import {classifyPortalInputPath,SUPPLEMENTAL_PORTAL_INPUT_SURFACES} from './input-impact-coverage.js';
import {appendBroaderContextualActions} from './contextual-action-rules-extended.js';

// One read-only projection on the existing tenant-scoped Portal V2 state.
// A proposal is NOT a measured risk, legal applicability ruling, executed action or euro saving.
const RELEVANT_PAGES = Object.freeze([
  'overzicht','gegevens-invullen','ingevulde-gegevens','mensen','data-ai',
  'compliance-governance','ai-capabilities','wet-regelgeving','csrd-impact',
  'cijfers-maatstaven','waarde-financiering','businesscase','due-diligence',
  'advies','roadmap','actieve-acties','taken-werkstromen','eindconclusie',
  'branche-markt','omgevingsradar','onderzoek'
]);
export const CONTEXTUAL_ACTION_PAGES = RELEVANT_PAGES;

const get = (state,path) => String(path||'').split('.').filter(Boolean).reduce((v,k)=>v==null?undefined:v[k],state);
const present = v => v!==null && v!==undefined && v!=='' && !(typeof v==='number' && !Number.isFinite(v));
const numeric = v => present(v)&&Number.isFinite(Number(v))?Number(v):null;
const unique = values => [...new Set(values)];
const validPage = id => Boolean(PORTAL_PAGE_INDEX[id]);

// The compiled schema is an auditable inventory of registered native form paths.
// Explicitly does not claim to enumerate DOM controls in standalone/legacy integrations.
export function inventoryPortalCustomerFields() {
  const pages = Object.keys(PORTAL_PAGE_INDEX);
  const inventory = new Map();
  function register(field,page) {
    if(!field?.path || !validPage(page))return;
    const existing=inventory.get(field.path) || {path:field.path,id:field.legacyFieldId||field.id||field.path,label:field.label||field.path,type:field.type||'unknown',pages:[],columns:[]};
    existing.pages=unique([...existing.pages,page]);
    if(Array.isArray(field.columns))existing.columns=field.columns.map(col=>({id:col.id,label:col.label,type:col.type}));
    inventory.set(field.path,existing);
  }
  for(const page of pages)for(const field of functionalSchema(page))register(field,page);
  for(const field of companyInputSchema('profiel'))register(field,'profiel');
  for(const field of fullCompanyInputSchema())register(field,'gegevens-invullen');
  for(const surface of SUPPLEMENTAL_PORTAL_INPUT_SURFACES)for(const path of surface.paths)register({path,label:path,type:'custom-workspace'},surface.page);
  return [...inventory.values()].map(row=>Object.freeze({...row,...classifyPortalInputPath(row.path),writeBoundary:'PORTAL_DOMAIN_STATE_OR_WORKSPACE',readbackStatus:'TENANT_ACK_REQUIRED',declarationOnly:true})).sort((a,b)=>a.path.localeCompare(b.path));
}

const priorityOrder = {P1:1,P2:2,P3:3};
function card(id,title,priority,sourcePath,sourceValue,description,action,pages,extra={}) {
  return Object.freeze({
    id,title,priority,sourcePath,sourceValue,
    description,action,
    pages:Object.freeze(unique(pages).filter(validPage)),
    status:'PROPOSAL_REVIEW_REQUIRED',
    financialImpact:Object.freeze({status:'NOT_QUANTIFIED',amount:null,reason:'Geen betrouwbare euroberekening op basis van deze invoer alleen.'}),
    ...extra
  });
}
function item(cards,entry){if(!cards.some(row=>row.id===entry.id))cards.push(entry);}
const HR=['mensen','overzicht','advies','roadmap','taken-werkstromen','due-diligence','businesscase','waarde-financiering'];
const AI=['data-ai','ai-capabilities','compliance-governance','eu-ai-act-audit','wet-regelgeving','csrd-impact','businesscase','waarde-financiering','advies','roadmap','due-diligence','trust-center'];
const LAW=['wet-regelgeving','compliance-governance','csrd-impact','due-diligence','waarde-financiering','businesscase','advies','roadmap','taken-werkstromen'];
const FINANCE=['cijfers-maatstaven','waarde-financiering','businesscase','due-diligence','overzicht','advies','roadmap'];

export function buildContextualActionCards(state={},options={}) {
  const cards=[];
  const mto=get(state,'portal.people.mto');
  const score=numeric(get(state,'portal.people.mtoScore'));
  const response=numeric(get(state,'portal.people.mtoResponse'));
  if(score!==null && score>=1 && score<=10 && score<=7){
    item(cards,card('mto-score','MTO-resultaat vraagt opvolging',score<=5?'P1':'P2','portal.people.mtoScore',score,
      'Ingevuld MTO-cijfer '+score+'/10. Dit is een beoordelingssignaal, geen wettelijke norm of vastgesteld geldverlies.',
      'Bespreek uitkomsten, identificeer oorzaken, wijs een actie-eigenaar toe en meet verbetering.',HR));
  }else if(present(mto) && String(mto)!=='0' && score===null){
    item(cards,card('mto-results-missing','MTO-resultaten ontbreken','P2','portal.people.mto',mto,
      'De frequentie van het MTO is bekend, maar er is geen feitelijk resultaat ingevoerd.',
      'Leg totaalscore, respons, datum en concrete verbetermaatregelen vast.',HR));
  }
  if(response!==null && response<50){
    item(cards,card('mto-response','MTO-respons beoordelen','P2','portal.people.mtoResponse',response,
      'Ingevulde respons '+response+'%. Beoordeel representativiteit alvorens harde conclusies te trekken.',
      'Bepaal welke groepen ondervertegenwoordigd zijn en verbeter de vervolgmeting.',HR));
  }
  const enps=numeric(get(state,'portal.people.enps'));
  if(enps!==null&&enps<0)item(cards,card('negative-enps','Negatieve eNPS beoordelen','P2','portal.people.enps',enps,'De eigen eNPS is negatief; bekijk samenhang met MTO, verloop en verzuim.','Analyseer teamspecifieke oorzaken en leg passende opvolging vast.',HR));
  const absence=numeric(get(state,'portal.people.absence'));
  if(absence!==null&&absence>7)item(cards,card('absence-signal','Verzuim vraagt nadere analyse','P2','portal.people.absence',absence,'Ingevuld verzuim '+absence+'%. De grens van 7% is hier een attentiewaarde, geen branchebenchmark.','Vergelijk met betrouwbare sectorbenchmark, onderzoek oorzaken en kwantificeer pas dan financiële impact.',HR));

  const ai=get(state,'portal.dataAi')||{};
  const hasAI=ai.aiUse==='ja'||(present(ai.aiRiskClass)&&ai.aiRiskClass!=='nog te beoordelen')||present(ai.aiPurpose);
  const highRisk=['hoog','verboden'].includes(ai.aiRiskClass);
  if(hasAI && (!present(ai.governanceOwner)||!present(ai.aiRiskClass)||ai.aiRiskClass==='nog te beoordelen')){
    item(cards,card('ai-owner-classification','AI-eigenaarschap en risicobeoordeling aanvullen',highRisk?'P1':'P2','portal.dataAi.aiRiskClass',ai.aiRiskClass||null,
      'Er is AI-gebruik gemeld, maar eigenaar en/of voorlopige risicoklasse zijn niet compleet.',
      'Leg toepassing, eigenaar, classificatie-onderbouwing, leverancier en review vast.',AI));
  }
  if(highRisk){
    item(cards,card('ai-risk-review','AI met verhoogd gemeld risico: toets regelgeving','P1','portal.dataAi.aiRiskClass',ai.aiRiskClass,
      'De klant heeft de categorie '+ai.aiRiskClass+' ingevoerd. Dit is geen onafhankelijk vastgestelde AI Act-classificatie.',
      'Laat risicoklasse, toepassing, verplichtingen en bewijs toetsen voor operationele vrijgave.',AI));
    if(ai.aiHumanOversight!==true){
      item(cards,card('ai-oversight','Menselijk toezicht voor AI vastleggen','P1','portal.dataAi.aiHumanOversight',ai.aiHumanOversight??null,
        'Bij de gemeld verhoogde risicoklasse ontbreekt een bevestigde menselijke controle.',
        'Ontwerp, test en documenteer menselijke beoordeling en escalatie.',AI));
    }
  }
  if(hasAI && !present(ai.aiDataLocation)){
    item(cards,card('ai-data-location','AI-datalocatie en leveranciersrisico toetsen','P2','portal.dataAi.aiDataLocation',null,
      'Locatie en verwerkingscontext van AI-data zijn niet vastgelegd; dat is nog geen bewezen AVG-overtreding.',
      'Controleer verwerkers, datalocatie, doorgifte, contracten en bewijs.',AI));
  }
  const policies=get(state,'portal.compliance.policies')||{};
  const missing=Object.entries(policies).filter(([,v])=>v==='ontbreekt');
  if(missing.length){
    item(cards,card('missing-policy','Ontbrekende beleidsdocumenten opvolgen','P2','portal.compliance.policies',missing.map(([k])=>k),
      missing.length+' expliciet als ontbrekend gemarkeerde beleidsitems. Reikwijdte en daadwerkelijke verplichting moeten worden getoetst.',
      'Prioriteer afhankelijk van klantsector en AI-/privacy-/securitygebruik; wijs documenteigenaar toe.',AI));
  }
  const equity=numeric(get(state,'portal.valueFinance.equity'));
  if(equity!==null && equity<0)item(cards,card('negative-equity','Negatief eigen vermogen beoordelen','P1','portal.valueFinance.equity',equity,
    'Ingevoerd eigen vermogen is negatief (in duizendtallen euro). Analyseer context, kasstroom en financieringsruimte.',
    'Valideer cijfers en maak een herstel- en financieringsscenario.',FINANCE));
  const largest=numeric(get(state,'portal.metrics.largestCustomer'));
  if(largest!==null&&largest>=30)item(cards,card('customer-concentration','Afhankelijkheid grootste klant toetsen','P2','portal.metrics.largestCustomer',largest,
    'De grootste klant vertegenwoordigt '+largest+'% volgens de invoer. De grens van 30% is een attentiewaarde.',
    'Bereken scenario bij klantverlies en plan concentratiereductie.',FINANCE));
  const dso=numeric(get(state,'portal.metrics.dso'));
  if(dso!==null&&dso>60)item(cards,card('cash-collection','Debiteurentermijn analyseren','P2','portal.metrics.dso',dso,
    'Ingevoerde DSO '+dso+' dagen; toets dit tegen contractafspraken en branche. Nog geen vastgesteld kasstroomverlies.',
    'Verbeter debiteurenproces en bereken werkkapitaalimpact met gevalideerde omzet.',FINANCE));
  const events=get(state,'portal.regulatory.events')||get(state,'portal.external.regulatoryEvents')||[];
  if(Array.isArray(events))for(const event of events){
    if(!event||typeof event!=='object'||!present(event.id)&&!present(event.title))continue;
    const id=String(event.id||event.title).replace(/[^a-z0-9-]/gi,'-').slice(0,64);
    const authoritative=event.authority==='source-universe-company-impact'&&event.tenantScoped===true&&event.evidenceStatus==='VERIFIED';
    const applies=authoritative&&event.customerRelevance==='applicable';
    item(cards,card('regulation-'+id, String(event.title||event.name||'Regelgevingssignaal')+(applies?' — toepasselijkheid toetsen':' — relevantie onderzoeken'),applies?'P1':'P2','portal.regulatory.events',event.id||event.title,
      'Nieuw/gewijzigd regelgevingssignaal. '+(applies?'Bron en tenantcontext zijn als geverifieerd gemarkeerd; juridische beoordeling blijft vereist.':'Bron, actualiteit of toepasselijkheid op deze klant is nog onvoldoende bewezen.'),
      applies?'Bepaal getroffen processen, systemen, controls, investeringen en deadlines.':'Verifieer officiële bron, geldende datum, sector, omvang en klanttoepasselijkheid voordat maatregelen definitief worden.',LAW,
      {regulatorySource:event.sourceUrl||null,regulatoryEvidenceStatus:applies?'SOURCE_VERIFIED_REVIEW_REQUIRED':'SOURCE_REVIEW_REQUIRED'}));
  }
  appendBroaderContextualActions(state,cards,{card,item,today:options.today||new Date().toISOString().slice(0,10)});
  return Object.freeze(cards.sort((a,b)=>(priorityOrder[a.priority]-priorityOrder[b.priority])||a.id.localeCompare(b.id)));
}

export function contextualCardsForPage(pageId,state={}) {
  return buildContextualActionCards(state).filter(entry=>entry.pages.includes(pageId));
}
export function toRoadmapProposal(entry,existing=[]) {
  if(!entry||!['P1','P2','P3'].includes(entry.priority))throw new TypeError('INVALID_CONTEXTUAL_ACTION');
  const sourceFingerprint='contextual-action:'+entry.id;
  if((Array.isArray(existing)?existing:[]).some(row=>row.sourceFingerprint===sourceFingerprint))return null;
  const sprint=priorityOrder[entry.priority];
  return Object.freeze({
    id:'contextual-'+entry.id,title:entry.title,dimension:entry.pages[0]||'overzicht',
    start:sprint,sprint,duration:1,progress:0,done:false,owner:'',
    status:'Voorgesteld',priority:entry.priority,sourceFingerprint,
    sourcePath:entry.sourcePath,why:entry.description,nextStep:entry.action,
    expected_value:null,financialStatus:'NOT_QUANTIFIED',reviewRequired:true
  });
}
