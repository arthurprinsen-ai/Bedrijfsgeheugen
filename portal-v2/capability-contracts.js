import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';

const freezeArray=value=>Object.freeze([...(value||[])]);
const browserContract=Object.freeze({editAndReopen:true,mobileWidths:Object.freeze([320,390,430]),requiresPersistenceProof:true});

const DEFINITIONS=Object.freeze({
  overzicht:{mode:'cockpit',renderer:'overview',dataSlice:'portal.overview'},
  profiel:{mode:'form',renderer:'company-input',dataSlice:'portal.profile'},
  'data-ai':{mode:'workspace',renderer:'data-ai',dataSlice:'portal.dataAi'},
  'ai-scan':{mode:'form',renderer:'ai-scan',dataSlice:'portal.aiScan'},
  'gegevens-invullen':{mode:'form',renderer:'company-input',dataSlice:'portal.inputs'},
  'ingevulde-gegevens':{mode:'workspace',renderer:'company-input',dataSlice:'portal.inputs'},
  businesscase:{mode:'form',renderer:'business-finance',dataSlice:'portal.businessCase'},
  'cijfers-maatstaven':{mode:'form',renderer:'business-finance',dataSlice:'portal.metrics'},
  'waarde-financiering':{mode:'form',renderer:'business-finance',dataSlice:'portal.valueFinance'},
  mensen:{mode:'form',renderer:'people-market-research',dataSlice:'portal.people'},
  'branche-markt':{mode:'form',renderer:'people-market-research',dataSlice:'portal.market'},
  onderzoek:{mode:'workspace',renderer:'people-market-research',dataSlice:'portal.research'},
  'compliance-governance':{mode:'workspace',renderer:'compliance-ai',dataSlice:'portal.compliance'},
  'ai-capabilities':{mode:'form',renderer:'compliance-ai',dataSlice:'portal.aiCapabilities'},
  'strategie-naar-maandagochtend':{mode:'workspace',renderer:'strategy-models',dataSlice:'portal.strategy'},
  canvassen:{mode:'canvas',renderer:'canvases',dataSlice:'portal.canvases'},
  eindconclusie:{mode:'report',renderer:'strategy-models',dataSlice:'portal.finalConclusion'},
  'due-diligence':{mode:'workspace',renderer:'ma-exit',dataSlice:'portal.dueDiligence'},
  'strategy-dna':{mode:'workspace',renderer:'strategy-dna',dataSlice:'portal.strategyDna'},
  'actueel-houden':{mode:'workspace',renderer:'execution',dataSlice:'portal.freshness'},
  wijzigingen:{mode:'workspace',renderer:'execution',dataSlice:'portal.changes'},
  advies:{mode:'workspace',renderer:'execution',dataSlice:'portal.advice'},
  offerte:{mode:'form',renderer:'execution',dataSlice:'portal.offer'},
  roadmap:{mode:'workspace',renderer:'execution',dataSlice:'portal.roadmap'}
});

function contractFor(legacyCapability,item){
 const definition=DEFINITIONS[item.v2Page];
 if(!definition)throw new Error(`CAPABILITY_DEFINITION_MISSING:${legacyCapability}:${item.v2Page}`);
 return Object.freeze({
  id:item.v2Page,
  legacyCapability,
  mode:definition.mode,
  schemaVersion:1,
  renderer:definition.renderer,
  dataSlice:definition.dataSlice,
  validators:freezeArray(item.fields?.length?['schema','field-rules']:['schema']),
  calculators:freezeArray(item.calculations),
  dependencies:freezeArray(item.dependencies),
  completionRules:freezeArray(['server-confirmed-state','legacy-functional-surface']),
  browserContract
 });
}

const LEGACY_CONTRACTS=Object.freeze(Object.entries(LEGACY_FUNCTIONAL_INVENTORY).map(([legacyCapability,item])=>contractFor(legacyCapability,item)));
const BY_PAGE=new Map(LEGACY_CONTRACTS.map(contract=>[contract.id,contract]));

const SPECIALISTS=Object.freeze({
  koppelingen:Object.freeze({id:'koppelingen',legacyCapability:null,mode:'builder',schemaVersion:1,renderer:'connector-builder',dataSlice:'connectors',validators:Object.freeze(['connector-readiness']),calculators:Object.freeze([]),dependencies:Object.freeze([]),completionRules:Object.freeze(['test-evidence-before-activation']),browserContract}),
  'csrd-impact':Object.freeze({id:'csrd-impact',legacyCapability:null,mode:'cockpit',schemaVersion:1,renderer:'csrd-impact',dataSlice:'impact',validators:Object.freeze(['evidence-readiness']),calculators:Object.freeze([]),dependencies:Object.freeze([]),completionRules:Object.freeze(['runtime-evidence']),browserContract})
});

export function getCapabilityContract(pageId){return BY_PAGE.get(pageId)||SPECIALISTS[pageId]||null}
export function listFunctionalContracts(){return [...LEGACY_CONTRACTS]}
export function isProtectedFunctionalPage(pageId){return BY_PAGE.has(pageId)}
