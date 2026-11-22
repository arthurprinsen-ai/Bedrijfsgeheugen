// Single versioned, provider-neutral transfer-intent contract.
// Describes WHAT the user wants. It never creates a scheduler, credential,
// webhook, CDC reader, outbound writer or bidirectional reconciliation.
export const TRANSFER_DIRECTIONS=Object.freeze(['SOURCE_TO_TARGET','TARGET_TO_SOURCE','BIDIRECTIONAL']);
export const TRANSFER_TRIGGERS=Object.freeze(['MANUAL','INTERVAL','WEBHOOK','CDC']);
export const TRANSFER_INTERVALS=Object.freeze([5,15,30,60,180,360,720,1440,10080]);
export const TRANSFER_MODES=Object.freeze(['SNAPSHOT','INCREMENTAL_UPSERT','APPEND_ONLY']);
export const TRANSFER_DELETIONS=Object.freeze(['KEEP','TOMBSTONE','REVIEW_FIRST']);
export const TRANSFER_CONFLICTS=Object.freeze(['MANUAL_REVIEW','SOURCE_WINS','TARGET_WINS','NEWEST_WINS']);
export const TRANSFER_ERROR_MODES=Object.freeze(['SAFE_RETRY_THEN_REVIEW','HOLD_FOR_REVIEW']);
export const TRANSFER_INITIAL_LOADS=Object.freeze(['NONE','LAST_30_DAYS','ALL_AUTHORIZED']);
export const DEFAULT_TRANSFER_POLICY=Object.freeze({
 version:1,direction:'SOURCE_TO_TARGET',trigger:'MANUAL',intervalMinutes:null,
 mode:'SNAPSHOT',primaryKey:null,cursorField:null,
 conflictPolicy:'MANUAL_REVIEW',deletionPolicy:'KEEP',failurePolicy:'SAFE_RETRY_THEN_REVIEW',
 initialLoad:'NONE',timeZone:'Europe/Amsterdam',purpose:'',owner:'',dataContractVersion:1
});
const NAME=/^[\p{L}_][\p{L}\p{N}_-]{0,79}$/u;
const fail=code=>{throw Object.assign(new TypeError(code),{code});};
const allowed=new Set(Object.keys(DEFAULT_TRANSFER_POLICY));
function cleanText(value,max=160){
 if(typeof value!=='string'||value.length>max||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value))fail('TRANSFER_TEXT_INVALID');
 return value.trim();
}
export function normalizeTransferPolicy(value,documentSchema){
 if(value==null)return DEFAULT_TRANSFER_POLICY;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!allowed.has(key)))
  fail('TRANSFER_POLICY_INVALID');
 const input={...DEFAULT_TRANSFER_POLICY,...value};
 if(input.version!==1||input.dataContractVersion!==1)fail('TRANSFER_VERSION_UNSUPPORTED');
 for(const [key,enumValues] of [['direction',TRANSFER_DIRECTIONS],['trigger',TRANSFER_TRIGGERS],
  ['mode',TRANSFER_MODES],['deletionPolicy',TRANSFER_DELETIONS],['conflictPolicy',TRANSFER_CONFLICTS],
  ['failurePolicy',TRANSFER_ERROR_MODES],['initialLoad',TRANSFER_INITIAL_LOADS]])
  if(!enumValues.includes(input[key]))fail('TRANSFER_'+key.toUpperCase()+'_INVALID');
 if(input.timeZone!=='Europe/Amsterdam'&&input.timeZone!=='UTC')fail('TRANSFER_TIMEZONE_INVALID');
 const interval=input.intervalMinutes;
 if(input.trigger==='INTERVAL'){
  if(!TRANSFER_INTERVALS.includes(interval))fail('TRANSFER_INTERVAL_INVALID');
 }else if(interval!==null)fail('TRANSFER_INTERVAL_FOR_TRIGGER_INVALID');
 for(const key of ['primaryKey','cursorField'])
  if(input[key]!==null&&(typeof input[key]!=='string'||!NAME.test(input[key])))fail('TRANSFER_FIELD_INVALID');
 const available=new Set((documentSchema?.fields||[]).map(f=>typeof f==='string'?f:f?.key).filter(Boolean));
 for(const key of ['primaryKey','cursorField'])
  if(input[key]&&!available.has(input[key]))fail('TRANSFER_FIELD_NOT_IN_SCHEMA');
 if(input.mode==='INCREMENTAL_UPSERT'&&(!input.primaryKey||!input.cursorField))
  fail('TRANSFER_INCREMENTAL_KEYS_REQUIRED');
 if(input.direction==='BIDIRECTIONAL'){
  if(!input.primaryKey)fail('TRANSFER_TWO_WAY_KEY_REQUIRED');
  if(input.conflictPolicy!=='MANUAL_REVIEW')fail('TRANSFER_TWO_WAY_REVIEW_REQUIRED');
  if(input.deletionPolicy!=='KEEP')fail('TRANSFER_TWO_WAY_DELETE_REVIEW_REQUIRED');
 }
 if(input.deletionPolicy!=='KEEP'&&input.trigger==='CDC')fail('TRANSFER_CDC_DELETE_APPROVAL_REQUIRED');
 const purpose=cleanText(input.purpose,500),owner=cleanText(input.owner,100);
 return Object.freeze({...input,purpose,owner});
}
// Runtime gate: a user-configurable intent cannot fabricate provider capabilities.
// Only the proven existing AFAS *read-only → internal Datahub, manual*
// adapter is executable by this release. Legacy connectors with no policy
// retain their preexisting gates.
export function connectorTransferActivationGuard(connector){
 const policy=connector?.transferPolicy;
 if(policy==null)return Object.freeze({allowed:true,reason:'LEGACY_CONNECTOR_GATES'});
 let normalized;
 try{normalized=normalizeTransferPolicy(policy,connector?.documentSchema);}
 catch(error){return Object.freeze({allowed:false,reason:error.code||'TRANSFER_POLICY_INVALID'});}
 if(normalized.direction!=='SOURCE_TO_TARGET')return Object.freeze({allowed:false,reason:'REVERSE_OR_TWO_WAY_ADAPTER_NOT_VERIFIED'});
 if(normalized.trigger!=='MANUAL')return Object.freeze({allowed:false,reason:'AUTOMATIC_CONNECTOR_EXECUTOR_NOT_VERIFIED'});
 if(normalized.mode!=='SNAPSHOT')return Object.freeze({allowed:false,reason:'DELTA_OR_APPEND_ADAPTER_NOT_VERIFIED'});
 if(normalized.deletionPolicy!=='KEEP')return Object.freeze({allowed:false,reason:'CONNECTOR_DELETE_POLICY_REQUIRES_APPROVAL'});
 if(normalized.initialLoad!=='NONE')return Object.freeze({allowed:false,reason:'BACKFILL_NOT_VERIFIED'});
 if(connector?.source?.type!=='afas'||connector?.target?.type!=='datahub')
  return Object.freeze({allowed:false,reason:'PROVIDER_ADAPTER_NOT_VERIFIED'});
 return Object.freeze({allowed:true,reason:'EXISTING_AFAS_READ_ONLY_GATES_REQUIRED'});
}
export function connectorTransferSyncGuard(connector){
 const result=connectorTransferActivationGuard(connector);
 if(!result.allowed)return result;
 if(connector?.transferPolicy?.mode==='INCREMENTAL_UPSERT')
  return Object.freeze({allowed:false,reason:'DELTA_OR_APPEND_ADAPTER_NOT_VERIFIED'});
 return result;
}
export function transferSummary(value){
 const p=normalizeTransferPolicy(value);
 const labels={SOURCE_TO_TARGET:'Bron → doel',TARGET_TO_SOURCE:'Doel → bron',BIDIRECTIONAL:'Twee richtingen',
  MANUAL:'Handmatig',INTERVAL:'Iedere '+p.intervalMinutes+' minuten',WEBHOOK:'Bij gebeurtenis',CDC:'Bij bronwijziging'};
 const cadence=p.trigger==='INTERVAL'&&p.intervalMinutes===1440?'Dagelijks'
  :p.trigger==='INTERVAL'&&p.intervalMinutes===10080?'Wekelijks'
  :labels[p.trigger];
 return Object.freeze({direction:labels[p.direction],cadence,mode:p.mode,
  executionClaim:'CONFIGURATION_ONLY_UNTIL_PROVIDER_AND_SCHEDULER_PROOF'});
}
