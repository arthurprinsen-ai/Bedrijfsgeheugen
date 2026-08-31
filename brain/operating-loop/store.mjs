import {normalizeBrainRecord,deriveLoopState} from './model.mjs';
import {prioritizeIntelligence} from './intelligence.mjs';
import {projectVerifiedValue} from './verified-value.mjs';
import {projectLivingMemory} from './living-memory.mjs';
import {projectIntegrationHealth} from './integration-health.mjs';
import {createBusinessGraphProjection,explainGraphObject} from './business-graph-service.mjs';
import {buildExecutiveCockpit} from './executive-cockpit.mjs';
import {filterAuthorizedRecords,assertCanWriteRecord} from './object-access-policy.mjs';
import {closedLoopStatus} from './loop-integrity.mjs';
import {certifyWholeBrainRuntime} from './runtime-evidence-certifier.mjs';
const enc=v=>encodeURIComponent(String(v));
const prefixFor=tenantId=>`${enc(tenantId)}/records/`;
const keyFor=(tenantId,id)=>`${prefixFor(tenantId)}${enc(id)}`;
const isRecordAdapter=adapter=>Boolean(adapter?.appendRecord&&adapter?.listRecords);
const isKeyValueAdapter=adapter=>Boolean(adapter?.get&&adapter?.put&&adapter?.list);
export function createOperatingLoopStore(adapter,{now=()=>new Date().toISOString(),adapterContract=null}={}){
  if(!isRecordAdapter(adapter)&&!isKeyValueAdapter(adapter)) throw new TypeError('Operating loop store requires record adapter or get/put/list adapter');
  async function append(input,{principal=null}={}){
    if(!input?.idempotencyKey) throw new TypeError('Brain record requires idempotencyKey');
    const record=normalizeBrainRecord(input);if(principal) assertCanWriteRecord(record,principal);
    if(isRecordAdapter(adapter)){
      const persisted=await adapter.appendRecord(record,{idempotencyKey:String(input.idempotencyKey),sourceRevision:input.sourceRevision||null});
      return {duplicate:Boolean(persisted.duplicate),record:persisted.record};
    }
    const key=keyFor(record.tenantId,record.id);const existing=await adapter.get(key);
    if(existing){if(existing.idempotencyKey!==input.idempotencyKey){const error=new Error('Brain record id conflict');error.code='BRAIN_RECORD_CONFLICT';throw error;}return {duplicate:true,record:existing.record};}
    const envelope={idempotencyKey:String(input.idempotencyKey),storedAt:now(),record};await adapter.put(key,envelope);return {duplicate:false,record};
  }
  async function recordsFor(tenantId,{principal=null}={}){
    let records;
    if(isRecordAdapter(adapter)) records=await adapter.listRecords(String(tenantId));
    else {const entries=await adapter.list(prefixFor(tenantId));records=entries.map(entry=>entry.value?.record).filter(Boolean);}
    records=records.sort((a,b)=>String(a.observedAt).localeCompare(String(b.observedAt)));
    return principal?filterAuthorizedRecords(records,principal):records;
  }
  async function certifyRuntime({tenantId,correlationId,platform,runtimeEvidence,principal=null}={}){
    if(!tenantId) throw new TypeError('runtime certification requires tenantId');if(!correlationId) throw new TypeError('runtime certification requires correlationId');if(!platform) throw new TypeError('runtime certification requires platform');
    const records=await recordsFor(tenantId,{principal});return certifyWholeBrainRuntime({records,correlationId,platform,adapterContract:adapterContract||{},runtimeEvidence});
  }
  async function explain({tenantId,subjectId,principal=null}={}){const records=await recordsFor(tenantId,{principal});return explainGraphObject(records,{tenantId,subjectId});}
  async function getProjection(tenantId,{principal=null}={}){
    const records=await recordsFor(tenantId,{principal});const state=deriveLoopState(records);const prioritizedAdvice=prioritizeIntelligence(records);const verifiedValue=projectVerifiedValue(records);const livingMemory=projectLivingMemory(records,{now:now()});const integrationHealth=projectIntegrationHealth(records);const businessGraph=createBusinessGraphProjection(records,{tenantId});
    const correlationIds=[...new Set(records.map(record=>record.correlationId).filter(Boolean))];const wholeBrainLoops=correlationIds.map(correlationId=>closedLoopStatus(records,{correlationId}));const loopSummary={complete:wholeBrainLoops.filter(loop=>loop.complete).length,incomplete:wholeBrainLoops.filter(loop=>!loop.complete).length,total:wholeBrainLoops.length};
    const base={schemaVersion:'brain-operating-projection.v5',tenantId:String(tenantId),records,state,businessGraph,advice:state.advice,prioritizedAdvice,verifiedValue,livingMemory,integrationHealth,wholeBrainLoops,loopSummary};const executiveCockpit=buildExecutiveCockpit(base,{now:now()});return {...base,executiveCockpit};
  }
  return Object.freeze({append,getProjection,certifyRuntime,explain});
}
