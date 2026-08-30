import {normalizeBrainRecord,deriveLoopState} from './model.mjs';
import {prioritizeIntelligence} from './intelligence.mjs';
import {projectVerifiedValue} from './verified-value.mjs';
import {projectLivingMemory} from './living-memory.mjs';
const enc=v=>encodeURIComponent(String(v));
const prefixFor=tenantId=>`${enc(tenantId)}/records/`;
const keyFor=(tenantId,id)=>`${prefixFor(tenantId)}${enc(id)}`;
export function createOperatingLoopStore(adapter,{now=()=>new Date().toISOString()}={}){
  if(!adapter?.get||!adapter?.put||!adapter?.list) throw new TypeError('Operating loop store requires get/put/list adapter');
  return Object.freeze({
    async append(input){
      if(!input?.idempotencyKey) throw new TypeError('Brain record requires idempotencyKey');
      const record=normalizeBrainRecord(input);const key=keyFor(record.tenantId,record.id);const existing=await adapter.get(key);
      if(existing){if(existing.idempotencyKey!==input.idempotencyKey){const error=new Error('Brain record id conflict');error.code='BRAIN_RECORD_CONFLICT';throw error;}return {duplicate:true,record:existing.record};}
      const envelope={idempotencyKey:String(input.idempotencyKey),storedAt:now(),record};await adapter.put(key,envelope);return {duplicate:false,record};
    },
    async getProjection(tenantId){
      const entries=await adapter.list(prefixFor(tenantId));const records=entries.map(entry=>entry.value?.record).filter(Boolean).sort((a,b)=>String(a.observedAt).localeCompare(String(b.observedAt)));const state=deriveLoopState(records);const prioritizedAdvice=prioritizeIntelligence(records);const verifiedValue=projectVerifiedValue(records);const livingMemory=projectLivingMemory(records,{now:now()});
      return {schemaVersion:'brain-operating-projection.v1',tenantId:String(tenantId),records,state,advice:state.advice,prioritizedAdvice,verifiedValue,livingMemory};
    }
  });
}
