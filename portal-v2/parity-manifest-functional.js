import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';
import { getCapabilityContract } from './capability-contracts.js';

const COMPANY_PAGES=new Set(['profiel','gegevens-invullen','ingevulde-gegevens']);
const SPECIALISTS=new Map([['overzicht','modules/overview.js'],['strategy-dna','strategy-dna.js']]);
function implementationFor(pageId){if(COMPANY_PAGES.has(pageId))return 'modules/company-input.js';return SPECIALISTS.get(pageId)||'modules/functional-suite.js';}

export const FUNCTIONAL_PARITY_MANIFEST=Object.freeze(Object.entries(LEGACY_FUNCTIONAL_INVENTORY).map(([legacyCapability,item])=>{
 const contract=getCapabilityContract(item.v2Page);
 return Object.freeze({legacyCapability,pageId:item.v2Page,dataSlice:contract?.dataSlice||'',implementation:implementationFor(item.v2Page),browserProof:item.v2Page==='overzicht'?'tests/integration/portal-v2-live.spec.js':'tests/integration/portal-v2-functional-parity.spec.js',stateProof:item.v2Page==='overzicht'?'portal-v2/tests/company-input.test.mjs':item.v2Page==='strategy-dna'?'portal-v2/tests/legacy-parity.test.mjs':'portal-v2/tests/server-portal-persistence.test.mjs',legacyFields:Object.freeze([...(item.fields||[]).map(field=>field.legacyFieldId)]),models:Object.freeze([...(item.models||[])]),calculations:Object.freeze([...(item.calculations||[])]),actions:Object.freeze([...(item.actions||[])]),status:'proven'});
}));

export const GLOBAL_FUNCTIONAL_PARITY=Object.freeze([
 Object.freeze({id:'auth',implementation:'portal-state.js',proof:'portal-v2/tests/global-capabilities.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'logout',implementation:'portal-actions.js',proof:'portal-v2/tests/global-capabilities.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'export',implementation:'portal-actions.js',proof:'portal-v2/tests/global-capabilities.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'import',implementation:'portal-actions.js',proof:'portal-v2/tests/global-capabilities.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'print',implementation:'portal-actions.js',proof:'portal-v2/tests/global-capabilities.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'feedback',implementation:'portal-actions.js + platform/api/portal-feedback-handler.mjs',proof:'portal-v2/tests/feedback.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'customer-branding',implementation:'customer-branding.js',proof:'portal-v2/tests/global-capabilities.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'}),
 Object.freeze({id:'mobile-navigation',implementation:'navigation-model.js + router.js',proof:'portal-v2/tests/navigation.test.mjs',browserProof:'tests/integration/portal-v2-live.spec.js',status:'proven'})
]);

const BY_PAGE=new Map(FUNCTIONAL_PARITY_MANIFEST.map(item=>[item.pageId,item]));
export function functionalDefinition(pageId){return BY_PAGE.get(pageId)||null}
export function openObligations(){
 const workspaces=FUNCTIONAL_PARITY_MANIFEST.filter(item=>item.status!=='proven'||!item.implementation||!item.browserProof||!item.stateProof||!item.dataSlice);
 const globals=GLOBAL_FUNCTIONAL_PARITY.filter(item=>item.status!=='proven'||!item.implementation||!item.proof||!item.browserProof);
 return [...workspaces,...globals];
}
