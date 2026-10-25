import test from 'node:test';
import assert from 'node:assert/strict';
import {selectExternalTopics} from '../supabase/functions/bg-externe-signalen/topic-selection.mjs';

const DAY=86400000;
const time=Date.parse('2026-10-25T06:10:00Z');
const topics=Array.from({length:44},(_,i)=>({onderwerp:'topic:'+i,zoekvraag:'query:'+i}));

test('the same daily execution time covers all 44 active topics within 15 days',()=>{
 const visited=new Set();
 for(let d=0;d<15;d++){
  const result=selectExternalTopics(topics,{now:time+d*DAY,batch:3});
  assert.equal(result.selected.length,3);
  assert.equal(result.staticFullCoverageDays,15);
  for(const x of result.selected)visited.add(x.onderwerp);
 }
 assert.equal(visited.size,44);
});

test('historical 20-minute absolute clock formula skipped some topics forever',()=>{
 const visited=new Set();
 for(let d=0;d<44;d++){
  const start=(Math.floor((time+d*DAY)/1200000)*3)%44;
  for(let j=0;j<3;j++)visited.add(topics[(start+j)%44].onderwerp);
 }
 assert.ok(visited.size<44);
});

test('20-minute windows also advance, while retry in one window is deterministic',()=>{
 const visited=new Set();
 for(let step=0;step<15;step++){
  const tick=time+step*1200000;
  const first=selectExternalTopics(topics,{now:tick,batch:3});
  const again=selectExternalTopics(topics,{now:tick+30000,batch:3});
  assert.deepEqual(first,again);
  assert.equal(new Set(first.selected.map(x=>x.onderwerp)).size,3);
  for(const x of first.selected)visited.add(x.onderwerp);
 }
 assert.equal(visited.size,44);
});

test('bound work, preserve original search strings, and reject invalid schedule state',()=>{
 const snapshot=JSON.stringify(topics);
 const result=selectExternalTopics(topics,{now:time,batch:500});
 assert.equal(result.selected.length,12);
 assert.equal(result.contract,'EXTERNAL_TOPIC_DAILY_FAIR_ROTATION-v1');
 assert.equal(JSON.stringify(topics),snapshot);
 assert.deepEqual(selectExternalTopics([],{now:time}).selected,[]);
 assert.equal(selectExternalTopics([],{now:time}).staticFullCoverageDays,0);
 assert.equal(selectExternalTopics([topics[0]],{now:time}).selected.length,1);
 assert.throws(()=>selectExternalTopics('invalid',{now:time}),/EXTERNAL_TOPICS_ARRAY_REQUIRED/);
 assert.throws(()=>selectExternalTopics(topics,{now:-1}),/EXTERNAL_TOPICS_CLOCK_INVALID/);
 assert.throws(()=>selectExternalTopics(topics,{now:time,batch:0}),/EXTERNAL_TOPIC_BATCH_INVALID/);
});
