import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

export function toKnowledgeEvent(input={},options={}){
  const pr=String(input.pr||input.pr_number||'').trim();
  if(!pr) throw new TypeError('github adapter requires pr');
  const refs=[sourceRef({system:'github',kind:'pull_request',id:pr,url:input.pr_url,relationship:'origin'})];
  if(input.head_sha) refs.push(sourceRef({system:'github',kind:'head_commit',id:String(input.head_sha),sha:String(input.head_sha),relationship:'evidence'}));
  if(input.merge_sha) refs.push(sourceRef({system:'github',kind:'merge_commit',id:String(input.merge_sha),sha:String(input.merge_sha),relationship:'result'}));
  return normalizeKnowledgeEvent({
    ...input,
    source_type:'github',source_refs:[...refs,...(input.source_refs||[])],
    actor:input.actor||{type:'workflow',id:input.actor_id||'github',name:'GitHub'},
    component:input.component||'release:github',intent:input.intent||'capture GitHub material outcome',outcome:input.outcome||'open'
  },options);
}
