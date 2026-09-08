import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

export function toKnowledgeEvent(input={},options={}){
  const pageId=String(input.page_id||input.id||'').trim();
  if(!pageId) throw new TypeError('notion adapter requires page_id');
  return normalizeKnowledgeEvent({
    ...input,
    source_type:'notion',
    source_refs:[sourceRef({system:'notion',kind:'page',id:pageId,url:input.url,relationship:input.relationship||'documentation'}),...(input.source_refs||[])],
    actor:input.actor||{type:'service',id:'notion',name:'Notion'},
    component:input.component||'knowledge:notion-projection',
    intent:input.intent||'capture material knowledge projection change',
    outcome:input.outcome||'open'
  },options);
}
