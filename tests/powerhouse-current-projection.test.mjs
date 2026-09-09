import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPowerhouseProjection } from '../netlify/functions/powerhouse-current-projection.mjs';

test('all cockpit lanes are filtered views over the same bounded core action queue',()=>{
  const actions=[
    {action_id:'a1',action_type:'reply_dm',channel:'LinkedIn DM',priority:99,reason:'real dm',message_draft:'antwoord',status:'suggested'},
    {action_id:'a2',action_type:'reply_post',channel:'LinkedIn commentaar',priority:80,reason:'real post',message_draft:'reactie',status:'suggested'},
    {action_id:'a3',action_type:'activate_connection',channel:'E-mail',priority:70,reason:'notion relatie',message_draft:'mail',status:'suggested'},
  ];
  const projection=buildPowerhouseProjection({actions,learning:[{topic_key:'ai'}],health:{ok:true}});
  assert.deepEqual(projection.today.map(x=>x.id),['a1','a2','a3']);
  assert.deepEqual(projection.dm.map(x=>x.id),['a1']);
  assert.deepEqual(projection.feed.map(x=>x.id),['a2']);
  assert.deepEqual(projection.connections.map(x=>x.id),['a3']);
  assert.equal(projection.today.length,projection.summary.today);
});

test('projection never exceeds 15 current actions',()=>{
  const actions=Array.from({length:30},(_,i)=>({action_id:`a${i}`,action_type:'activate_connection',channel:'LinkedIn DM',priority:i,status:'suggested'}));
  assert.equal(buildPowerhouseProjection({actions}).today.length,15);
});
