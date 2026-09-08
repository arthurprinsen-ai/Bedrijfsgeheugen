import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

export function toKnowledgeEvent(input={},options={}){
  const agentId=String(input.agent_id||'').trim();
  if(!agentId) throw new TypeError('agent adapter requires agent_id');
  const executionId=String(input.execution_id||input.run_id||agentId).trim();
  return normalizeKnowledgeEvent({
    ...input,
    source_type:'agent',
    source_refs:[sourceRef({system:'powerhouse-agent',kind:'agent_execution',id:executionId,execution_id:executionId,relationship:'origin'}),...(input.source_refs||[])],
    actor:input.actor||{type:'agent',id:agentId,name:input.agent_name||agentId},
    component:input.component||'brain:agent-fabric',
    intent:input.intent||input.task||'capture material agent outcome',
    outcome:input.outcome||input.status||'open'
  },options);
}
