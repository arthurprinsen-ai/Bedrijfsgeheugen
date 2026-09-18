import { upgradeLegacyPortalState, hasLegacyPortalData, readLegacyPortalStateForUser, mergeLegacyPortalStateIntoCanonical } from './legacy-state-migration.js';

const clone=value=>value==null?value:structuredClone(value);
const isObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const normalizeState=value=>isObject(value)?clone(value):{};
const parts=path=>String(path||'').split('.').map(part=>part.trim()).filter(Boolean);
const slug=value=>String(value??'').trim().replace(/([a-z0-9])([A-Z])/g,'$1-$2').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'unknown';
const defaultBusinessInputStoreLoader=()=>import('./business-input-store.js');

function readPath(source,path){
 let current=source;
 for(const key of parts(path)){
  if(current==null||typeof current!=='object')return undefined;
  current=current[key];
 }
 return clone(current);
}

function writePath(source,path,value,{merge=false}={}){
 const keys=parts(path);
 if(!keys.length){
  if(merge&&isObject(source)&&isObject(value))return {...source,...clone(value)};
  return normalizeState(value);
 }
 const root=normalizeState(source);
 let cursor=root;
 for(let index=0;index<keys.length-1;index++){
  const key=keys[index];
  cursor[key]=isObject(cursor[key])?{...cursor[key]}:{};
  cursor=cursor[key];
 }
 const leaf=keys.at(-1);
 if(merge){
  const previous=isObject(cursor[leaf])?cursor[leaf]:{};
  cursor[leaf]={...previous,...clone(value)};
 }else cursor[leaf]=clone(value);
 return root;
}

function publicSnapshot(state,status,error){return Object.freeze({state:clone(state),status,error:error||null});}

export function createDomainState({load,save}={}){
 if(typeof load!=='function')throw new TypeError('DOMAIN_STATE_LOAD_REQUIRED');
 if(typeof save!=='function')throw new TypeError('DOMAIN_STATE_SAVE_REQUIRED');
 let state={};let currentStatus='idle';let currentError=null;let revision=0;let initialized=false;const listeners=new Set();let activeFlush=null;
 const publish=()=>{const snap=publicSnapshot(state,currentStatus,currentError);for(const listener of listeners){try{listener(snap)}catch{}}return snap;};
 const asError=(error,fallback)=>error instanceof Error?error:new Error(String(error||fallback));
 const markDirty=()=>{revision+=1;currentStatus='dirty';currentError=null;publish();};
 async function init(){try{const loaded=normalizeState(await load());const needsMigration=hasLegacyPortalData(loaded);state=upgradeLegacyPortalState(loaded);if(needsMigration){currentStatus='saving';publish();state=upgradeLegacyPortalState(normalizeState(await save(clone(state))));currentStatus='saved';}else currentStatus='idle';currentError=null;revision=0;initialized=true;return publish();}catch(error){state={};initialized=false;currentStatus='error';currentError=asError(error,'DOMAIN_STATE_LOAD_FAILED');publish();throw currentError;}}
 function get(path=''){return path?readPath(state,path):clone(state);}
 function set(path,value){state=writePath(state,path,value);markDirty();return get(path);}
 function patch(path,value){if(!isObject(value))throw new TypeError('DOMAIN_STATE_PATCH_OBJECT_REQUIRED');state=writePath(state,path,value,{merge:true});markDirty();return get(path);}
 async function performFlush(){if(currentStatus!=='dirty'&&currentStatus!=='error')return publicSnapshot(state,currentStatus,currentError);const saveRevision=revision;const candidate=clone(state);currentStatus='saving';currentError=null;publish();try{const confirmed=normalizeState(await save(candidate));if(revision===saveRevision){state=upgradeLegacyPortalState(confirmed);currentStatus='saved';}else currentStatus='dirty';currentError=null;return publish();}catch(error){currentError=asError(error,'DOMAIN_STATE_SAVE_FAILED');currentStatus='error';publish();throw currentError;}}
 function flush(){if(activeFlush)return activeFlush;activeFlush=performFlush().finally(()=>{activeFlush=null});return activeFlush;}
 return Object.freeze({init,initialized:()=>initialized,get,set,patch,flush,status:()=>currentStatus,error:()=>currentError,snapshot:()=>publicSnapshot(state,currentStatus,currentError),subscribe(listener){if(typeof listener!=='function')throw new TypeError('DOMAIN_STATE_SUBSCRIBER_REQUIRED');listeners.add(listener);return()=>listeners.delete(listener);}});
}

const SECTION_BINDINGS=Object.freeze({
 profile:Object.freeze({inputType:'CompanyProfile',modelId:'company-profile'}),
 dataAi:Object.freeze({inputType:'AIAssessment',modelId:'data-ai-readiness'}),
 aiScan:Object.freeze({inputType:'AIAssessment',modelId:'ai-opportunity-scan'}),
 aiCapabilities:Object.freeze({inputType:'AIAssessment',modelId:'ai-capabilities'}),
 aiAct:Object.freeze({inputType:'AIActAssessment',modelId:'eu-ai-act'}),
 businessCase:Object.freeze({inputType:'BusinessCase',modelId:'businesscase'}),
 metrics:Object.freeze({inputType:'BusinessMetrics',modelId:'business-metrics'}),
 valueFinance:Object.freeze({inputType:'FinancialAssessment',modelId:'value-financing'}),
 people:Object.freeze({inputType:'PeopleAssessment',modelId:'people'}),
 market:Object.freeze({inputType:'MarketAssessment',modelId:'market'}),
 research:Object.freeze({inputType:'ResearchInput',modelId:'research'}),
 compliance:Object.freeze({inputType:'ComplianceAssessment',modelId:'compliance-governance'}),
 finalConclusion:Object.freeze({inputType:'StrategyConclusion',modelId:'final-conclusion'}),
 dueDiligence:Object.freeze({inputType:'DueDiligenceAssessment',modelId:'due-diligence'}),
 freshness:Object.freeze({inputType:'FreshnessInput',modelId:'current-state'}),
});

function businessInputBinding(path){
 const keys=parts(path);
 if(keys[0]!=='portal'||!keys[1])return null;
 const section=keys[1],detail=keys[2];
 if(section==='canvases'&&detail)return Object.freeze({key:`canvas:${detail}`,inputType:'StrategyCanvas',modelId:`canvas-${slug(detail)}`,statePath:`portal.canvases.${detail}`});
 if(section==='strategy'){
  if(detail==='dna')return Object.freeze({key:'strategy:dna',inputType:'StrategyModel',modelId:'strategy-dna',statePath:'portal.strategy.dna'});
  if(detail==='execution')return Object.freeze({key:'strategy:execution',inputType:'StrategyExecution',modelId:'strategy-execution',statePath:'portal.strategy.execution'});
  return Object.freeze({key:'strategy:operating-model',inputType:'StrategyModel',modelId:'strategy-operating-model',statePath:'portal.strategy'});
 }
 if(section==='aiAct'||section==='ai-act'||section==='euAiAct')return Object.freeze({key:'compliance:eu-ai-act',inputType:'AIActAssessment',modelId:'eu-ai-act',statePath:`portal.${section}`});
 if(section==='compliance'&&['aiAct','ai-act','euAiAct'].includes(detail))return Object.freeze({key:'compliance:eu-ai-act',inputType:'AIActAssessment',modelId:'eu-ai-act',statePath:`portal.compliance.${detail}`});
 const semantic=SECTION_BINDINGS[section];
 if(semantic)return Object.freeze({key:`section:${section}`,...semantic,statePath:`portal.${section}`});
 return Object.freeze({key:`section:${section}`,inputType:'PortalModel',modelId:slug(section),statePath:`portal.${section}`});
}

function asAnswers(value){
 if(isObject(value))return clone(value);
 if(Array.isArray(value))return {items:clone(value)};
 return {value:clone(value)};
}

function hasLegacyBusinessInputStorage(storage){
 if(!storage||typeof storage.length!=='number')return false;
 for(let index=0;index<storage.length;index+=1){const key=storage.key(index);if(key?.startsWith('bg_portaal_')&&!['bg_portaal_open','bg_portaal_lead'].includes(key))return true;}
 return false;
}

export function createPortalDomainState(stateClient,{businessInputSaver=null,businessInputStoreLoader=defaultBusinessInputStoreLoader,legacyStorage=globalThis.localStorage}={}){
 if(!stateClient?.load||!stateClient?.write)throw new TypeError('PORTAL_STATE_CLIENT_REQUIRED');
 if(businessInputSaver!==null&&typeof businessInputSaver!=='function')throw new TypeError('PORTAL_BUSINESS_INPUT_SAVER_REQUIRED');
 if(typeof businessInputStoreLoader!=='function')throw new TypeError('PORTAL_BUSINESS_INPUT_STORE_LOADER_REQUIRED');
 let browserLegacyLiftPending=false;
 const domain=createDomainState({
  load:async()=>{
   const snap=await stateClient.load();
   const canonical=snap?.state||{};
   if(stateClient.isDemo?.())return canonical;
   const legacy=readLegacyPortalStateForUser(legacyStorage,stateClient.currentUser?.());
   if(!legacy)return canonical;
   browserLegacyLiftPending=true;
   return mergeLegacyPortalStateIntoCanonical(canonical,legacy);
  },
  save:async nextState=>{const snap=await stateClient.write(nextState);if(snap?.mode!=='authenticated')throw new Error('PORTAL_STATE_CONFIRMATION_REQUIRED');return snap.state||{};}
 });
 const pendingBusinessInputs=new Map();let businessRevision=0;let activePortalFlush=null;let activeInit=null;let businessInputStorePromise=null;
 const loadBusinessInputStore=()=>businessInputStorePromise||(businessInputStorePromise=Promise.resolve().then(()=>businessInputStoreLoader()));
 async function saveBusinessInput(input){
  const headers=typeof stateClient.authHeaders==='function'?await stateClient.authHeaders():{};
  const authorization=String(headers?.authorization||'').trim();
  if(!authorization){
   if(stateClient.isDemo?.())return Object.freeze({stored:false,skipped:true,reason:'DEMO_NON_DURABLE'});
   throw new Error('PORTAL_BUSINESS_INPUT_AUTH_REQUIRED');
  }
  const saver=businessInputSaver||((await loadBusinessInputStore())?.savePortalBusinessInput);
  if(typeof saver!=='function')throw new TypeError('PORTAL_BUSINESS_INPUT_SAVER_REQUIRED');
  return saver(input,{authorization});
 }
 async function performInit(){
  let result=await domain.init();
  if(browserLegacyLiftPending){
   domain.patch('portal.migration',{browserLegacyLifted:true,browserLegacyLiftVersion:'2026-09-18-v1'});
   result=await domain.flush();
   browserLegacyLiftPending=false;
  }
  if(stateClient.isDemo?.()||!hasLegacyBusinessInputStorage(legacyStorage))return result;
  const reader=(await loadBusinessInputStore())?.readLegacyPortalBusinessInputs;
  if(typeof reader!=='function')throw new TypeError('PORTAL_LEGACY_BUSINESS_INPUT_READER_REQUIRED');
  for(const input of reader(legacyStorage))await saveBusinessInput(input);
  return result;
 }
 function init(){if(activeInit)return activeInit;activeInit=performInit().finally(()=>{activeInit=null});return activeInit;}
 function track(path){
  const binding=businessInputBinding(path);
  if(!binding)return;
  businessRevision+=1;
  pendingBusinessInputs.set(binding.key,{...binding,generation:businessRevision});
 }
 function set(path,value){const result=domain.set(path,value);track(path);return result;}
 function patch(path,value){const result=domain.patch(path,value);track(path);return result;}
 async function performPortalFlush(){
  const pending=[...pendingBusinessInputs.values()].map(binding=>({...binding,answers:asAnswers(domain.get(binding.statePath))}));
  const stateResult=await domain.flush();
  for(const item of pending){
   await saveBusinessInput({inputType:item.inputType,modelId:item.modelId,instanceId:'primary',schemaVersion:1,answers:item.answers,sourcePortal:'portal-v2',metadata:{statePath:item.statePath,binding:'portal-domain-business-input-v1',truthContract:'powerhouse-model-truth-v1',preserveMissing:true,intelligenceEligible:true}});
   if(pendingBusinessInputs.get(item.key)?.generation===item.generation)pendingBusinessInputs.delete(item.key);
  }
  return stateResult;
 }
 function flush(){if(activePortalFlush)return activePortalFlush;activePortalFlush=performPortalFlush().finally(()=>{activePortalFlush=null});return activePortalFlush;}
 const portalDomain=Object.freeze({...domain,init,set,patch,flush,saveBusinessInput});
 if(typeof globalThis!=='undefined')globalThis.__BG_PORTAL_DOMAIN_STATE__=portalDomain;
 return portalDomain;
}
