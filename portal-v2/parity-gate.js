import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';
import { listFunctionalContracts } from './capability-contracts.js';
import { listFunctionalSuitePages } from './modules/functional-suite.js';

const functionalPages=new Set(listFunctionalSuitePages());
const contractsByLegacy=new Map(listFunctionalContracts().map(contract=>[contract.legacyCapability,contract]));

const SPECIALIST_OWNERS=Object.freeze({
  overzicht:Object.freeze({renderer:'modules/overview.js',persistence:'domain-state + portal-state',browser:'portal production DOM readback'}),
  profiel:Object.freeze({renderer:'modules/company-input.js',persistence:'domain-state.flush',browser:'portal production DOM readback'}),
  invoeren:Object.freeze({renderer:'modules/company-input.js + modules/functional-suite.js',persistence:'domain-state.flush',browser:'portal production DOM readback'}),
  antwoorden:Object.freeze({renderer:'modules/company-input.js + modules/functional-suite.js',persistence:'domain-state confirmed state',browser:'portal production DOM readback'}),
  canvassen:Object.freeze({renderer:'modules/canvas-workspace.js',persistence:'domain-state.flush',browser:'portal production DOM readback'}),
  dna:Object.freeze({renderer:'strategy-dna.js + modules/dna-library.js',persistence:'domain-state.flush',browser:'portal production DOM readback'}),
  uitvoering:Object.freeze({renderer:'native-pages.js + page-metrics.js',persistence:'domain-state + portal-state',browser:'portal production DOM readback'})
});

function ownerFor(legacyKey,item,contract){
  const specialist=SPECIALIST_OWNERS[legacyKey];
  if(specialist)return Object.freeze({...specialist,contract:contract?.id||item.v2Page});
  if(functionalPages.has(item.v2Page))return Object.freeze({renderer:'modules/functional-suite.js',persistence:'domain-state.flush',browser:'portal production DOM readback',contract:contract?.id||item.v2Page});
  return Object.freeze({renderer:null,persistence:null,browser:null,contract:contract?.id||item.v2Page});
}

export function capabilityImplementationCoverage(){
  return Object.freeze(Object.fromEntries(Object.entries(LEGACY_FUNCTIONAL_INVENTORY).map(([legacyKey,item])=>{
    const contract=contractsByLegacy.get(legacyKey);
    const owner=ownerFor(legacyKey,item,contract);
    return [legacyKey,Object.freeze({
      legacyKey,
      pageId:item.v2Page,
      contract:contract?.id||null,
      renderer:owner.renderer,
      persistence:owner.persistence,
      browser:owner.browser,
      fieldsOwner:(item.fields||[]).length?owner.renderer:'inventory:no-editable-fields',
      modelsOwner:(item.models||[]).length?owner.renderer:'inventory:no-models',
      calculationsOwner:(item.calculations||[]).length?owner.renderer:'inventory:no-calculations',
      actionsOwner:(item.actions||[]).length?owner.renderer:'inventory:no-actions',
      dependenciesOwner:(item.dependencies||[]).length?'capability-contracts.js':'inventory:no-dependencies'
    })];
  })));
}

export function evaluatePortalParity({productionEvidence={}}={}){
  const coverage=capabilityImplementationCoverage();
  const capabilities=Object.entries(coverage).map(([legacyKey,item])=>{
    const missing=[];
    if(!item.contract)missing.push('contract');
    if(!item.renderer)missing.push('renderer');
    if(!item.fieldsOwner)missing.push('fields');
    if(!item.modelsOwner)missing.push('models');
    if(!item.calculationsOwner)missing.push('calculations');
    if(!item.actionsOwner)missing.push('actions');
    if(!item.dependenciesOwner)missing.push('dependencies');
    if(!item.persistence)missing.push('persistence');
    if(!item.browser)missing.push('browser-evidence-owner');
    if(productionEvidence?.[legacyKey]?.production!=='verified')missing.push('production-evidence');
    return Object.freeze({...item,missing:Object.freeze(missing),verified:missing.length===0});
  });
  const verifiedCount=capabilities.filter(item=>item.verified).length;
  return Object.freeze({ok:verifiedCount===capabilities.length,total:capabilities.length,verifiedCount,capabilities:Object.freeze(capabilities)});
}
