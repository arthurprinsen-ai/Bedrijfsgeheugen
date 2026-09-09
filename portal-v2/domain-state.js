const clone=value=>value==null?value:structuredClone(value);
const isObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const normalizeState=value=>isObject(value)?clone(value):{};
const parts=path=>String(path||'').split('.').map(part=>part.trim()).filter(Boolean);

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
 async function init(){try{const loaded=await load();state=normalizeState(loaded);currentStatus='idle';currentError=null;revision=0;initialized=true;return publish();}catch(error){state={};initialized=false;currentStatus='error';currentError=asError(error,'DOMAIN_STATE_LOAD_FAILED');publish();throw currentError;}}
 function get(path=''){return path?readPath(state,path):clone(state);}
 function set(path,value){state=writePath(state,path,value);markDirty();return get(path);}
 function patch(path,value){if(!isObject(value))throw new TypeError('DOMAIN_STATE_PATCH_OBJECT_REQUIRED');state=writePath(state,path,value,{merge:true});markDirty();return get(path);}
 async function performFlush(){if(currentStatus!=='dirty'&&currentStatus!=='error')return publicSnapshot(state,currentStatus,currentError);const saveRevision=revision;const candidate=clone(state);currentStatus='saving';currentError=null;publish();try{const confirmed=normalizeState(await save(candidate));if(revision===saveRevision){state=confirmed;currentStatus='saved';}else currentStatus='dirty';currentError=null;return publish();}catch(error){currentError=asError(error,'DOMAIN_STATE_SAVE_FAILED');currentStatus='error';publish();throw currentError;}}
 function flush(){if(activeFlush)return activeFlush;activeFlush=performFlush().finally(()=>{activeFlush=null});return activeFlush;}
 return Object.freeze({init,initialized:()=>initialized,get,set,patch,flush,status:()=>currentStatus,error:()=>currentError,snapshot:()=>publicSnapshot(state,currentStatus,currentError),subscribe(listener){if(typeof listener!=='function')throw new TypeError('DOMAIN_STATE_SUBSCRIBER_REQUIRED');listeners.add(listener);return()=>listeners.delete(listener);}});
}

export function createPortalDomainState(stateClient){
 if(!stateClient?.load||!stateClient?.write)throw new TypeError('PORTAL_STATE_CLIENT_REQUIRED');
 const domain=createDomainState({load:async()=>{const snap=await stateClient.load();return snap?.state||{};},save:async nextState=>{const snap=await stateClient.write(nextState);if(snap?.mode!=='authenticated')throw new Error('PORTAL_STATE_CONFIRMATION_REQUIRED');return snap.state||{};}});
 if(typeof globalThis!=='undefined')globalThis.__BG_PORTAL_DOMAIN_STATE__=domain;
 return domain;
}
