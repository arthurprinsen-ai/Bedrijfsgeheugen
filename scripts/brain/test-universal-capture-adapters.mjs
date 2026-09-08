import test from 'node:test';
import assert from 'node:assert/strict';
import {toKnowledgeEvent as chatEvent} from '../../brain/adapters/knowledge-chat.mjs';
import {toKnowledgeEvent as agentEvent} from '../../brain/adapters/knowledge-agent.mjs';
import {toKnowledgeEvent as githubEvent} from '../../brain/adapters/knowledge-github.mjs';
import {toKnowledgeEvent as netlifyEvent} from '../../brain/adapters/knowledge-netlify.mjs';
import {toKnowledgeEvent as makeEvent} from '../../brain/adapters/knowledge-make.mjs';
import {toKnowledgeEvent as notionEvent} from '../../brain/adapters/knowledge-notion.mjs';
import {toKnowledgeEvent as businessEvent} from '../../brain/adapters/knowledge-business.mjs';

const options={now:()=> '2026-09-08T10:37:11.053Z',idFactory:()=> 'adapter-event'};

test('github and netlify adapters preserve authoritative ids without copying raw payloads',()=>{
  const g=githubEvent({pr:1159,head_sha:'f74cfdfa1225ba1ad8427e5719ec7b4f1f18c84a',merge_sha:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5',component:'website:homepage-hero-video',intent:'repair video',outcome:'success'},options);
  const n=netlifyEvent({deploy_id:'6a9fe513a7af0e0008661320',commit_ref:'7695e386ed7b234391dfa4d8ef0de7479dd48aa5',state:'ready',component:'website:homepage-hero-video'},options);
  assert.ok(g.source_refs.some(x=>x.kind==='pull_request'&&x.id==='1159'));
  assert.ok(n.source_refs.some(x=>x.deploy_id==='6a9fe513a7af0e0008661320'));
  assert.equal(JSON.stringify(g).includes('raw_response'),false);
});

test('all source adapters emit the same knowledge-event schema',()=>{
  const events=[
    chatEvent({session_id:'chat-1',component:'brain:knowledge',intent:'capture chat',outcome:'success'},options),
    agentEvent({agent_id:'agent-1',execution_id:'exec-1',component:'brain:knowledge',intent:'capture agent',outcome:'success'},options),
    makeEvent({scenario_id:'7136176',execution_id:'run-1',component:'brain:bg168',intent:'route learning',outcome:'success'},options),
    notionEvent({page_id:'page-1',component:'brain:knowledge',intent:'project docs',outcome:'success'},options),
    businessEvent({source_type:'portal',record_id:'record-1',component:'portal:workflow',intent:'capture outcome',outcome:'success'},options)
  ];
  assert.ok(events.every(x=>x.schema_version==='powerhouse.knowledge-event.v1'));
  assert.ok(events.every(x=>x.source_refs.length>=1));
});
