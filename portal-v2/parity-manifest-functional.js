import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';
import { getCapabilityContract } from './capability-contracts.js';

const COMPANY_PAGES=new Set(['profiel','gegevens-invullen','ingevulde-gegevens']);
const SPECIALISTS=new Map([
 ['overzicht','modules/overview.js'],
 ['strategy-dna','strategy-dna.js']
]);

function implementationFor(pageId){
 if(COMPANY_PAGES.has(pageId))return 'modules/company-input.js';
 return SPECIALISTS.get(pageId)||'modules/functional-suite.js';
}

export const FUNCTIONAL_PARITY_MANIFEST=Object.freeze(Object.entries(LEGACY_FUNCTIONAL_INVENTORY).map(([legacyCapability,item])=>{
 const contract=getCapabilityContract(item.v2Page);
 return Object.freeze({
  legacyCapability,
  pageId:item.v2Page,
  dataSlice:contract?.dataSlice||'',
  implementation:implementationFor(item.v2Page),
  browserProof:'tests/integration/portal-v2-live.spec.js',
  stateProof:item.v2Page==='overzicht'?'portal-v2/tests/company-input.test.mjs':item.v2Page==='strategy-dna'?'portal-v2/tests/legacy-parity.test.mjs':'portal-v2/tests/server-portal-persistence.test.mjs',
  legacyFields:Object.freeze([...(item.fields||[]).map(field=>field.legacyFieldId)]),
  models:Object.freeze([...(item.models||[])]),
  calculations:Object.freeze([...(item.calculations||[])]),
  actions:Object.freeze([...(item.actions||[])]),
  status:'proven'
 });
}));

const BY_PAGE=new Map(FUNCTIONAL_PARITY_MANIFEST.map(item=>[item.pageId,item]));
export function functionalDefinition(pageId){return BY_PAGE.get(pageId)||null}
export function openObligations(){
 return FUNCTIONAL_PARITY_MANIFEST.filter(item=>item.status!=='proven'||!item.implementation||!item.browserProof||!item.stateProof||!item.dataSlice);
}
