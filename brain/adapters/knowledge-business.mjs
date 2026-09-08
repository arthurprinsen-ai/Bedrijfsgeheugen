import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

const ALLOWED=new Set(['portal','crm','human']);
export function toKnowledgeEvent(input={},options={}){
  const sourceType=String(input.source_type||'').trim();
  if(!ALLOWED.has(sourceType)) throw new TypeError('business adapter source_type must be portal, crm or human');
  const recordId=String(input.record_id||input.id||'').trim();
  if(!recordId) throw new TypeError('business adapter requires record_id');
  return normalizeKnowledgeEvent({
    ...input,
    source_type:sourceType,
    source_refs:[sourceRef({system:sourceType,kind:sourceType==='human'?'intervention':'record',id:recordId,url:input.url,relationship:'origin'}),...(input.source_refs||[])],
    actor:input.actor||{type:sourceType==='human'?'human':'service',id:input.actor_id||sourceType,name:input.actor_name||sourceType},
    component:input.component||`${sourceType}:workflow`,
    intent:input.intent||`capture material ${sourceType} outcome`,
    outcome:input.outcome||'open'
  },options);
}
