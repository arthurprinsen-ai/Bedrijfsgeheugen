import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

export function toKnowledgeEvent(input={},options={}){
  const sessionId=String(input.session_id||input.chat_id||'').trim();
  if(!sessionId) throw new TypeError('chat adapter requires session_id');
  return normalizeKnowledgeEvent({
    ...input,
    source_type:'chat',
    source_refs:[sourceRef({system:'chatgpt',kind:'chat_session',id:sessionId,url:input.url,relationship:'origin'}),...(input.source_refs||[])],
    actor:input.actor||{type:'chat',id:input.assistant_id||'chatgpt',name:'ChatGPT'},
    component:input.component||'brain:knowledge',
    intent:input.intent||'capture material chat outcome',
    outcome:input.outcome||'open'
  },options);
}
