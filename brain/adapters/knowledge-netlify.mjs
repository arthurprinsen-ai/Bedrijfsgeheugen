import {normalizeKnowledgeEvent} from '../knowledge/knowledge-event.mjs';
import {sourceRef} from '../knowledge/source-ref.mjs';

export function toKnowledgeEvent(input={},options={}){
  const deployId=String(input.deploy_id||'').trim();
  if(!deployId) throw new TypeError('netlify adapter requires deploy_id');
  const refs=[sourceRef({system:'netlify',kind:'production_deploy',id:deployId,deploy_id:deployId,url:input.url,relationship:'result'})];
  if(input.commit_ref) refs.push(sourceRef({system:'github',kind:'commit',id:String(input.commit_ref),sha:String(input.commit_ref),relationship:'evidence'}));
  const status=String(input.state||input.outcome||'').toLowerCase()==='ready'?'success':(input.outcome||'open');
  return normalizeKnowledgeEvent({
    ...input,
    source_type:'netlify',source_refs:[...refs,...(input.source_refs||[])],
    actor:input.actor||{type:'service',id:'netlify',name:'Netlify'},
    component:input.component||'release:netlify',intent:input.intent||'capture Netlify deployment outcome',outcome:status
  },options);
}
