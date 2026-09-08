import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

export function toKnowledgeEvent(input={},options={}){
  const scenarioId=String(input.scenario_id||'').trim();
  if(!scenarioId) throw new TypeError('make adapter requires scenario_id');
  const executionId=String(input.execution_id||input.run_id||scenarioId).trim();
  return normalizeKnowledgeEvent({
    ...input,
    source_type:'make',
    source_refs:[sourceRef({system:'make',kind:'scenario_execution',id:executionId,execution_id:executionId,version:scenarioId,relationship:'origin'}),...(input.source_refs||[])],
    actor:input.actor||{type:'workflow',id:`make:${scenarioId}`,name:`Make scenario ${scenarioId}`},
    component:input.component||`make:scenario:${scenarioId}`,
    intent:input.intent||'capture Make scenario outcome',
    outcome:input.outcome||input.status||'open'
  },options);
}
