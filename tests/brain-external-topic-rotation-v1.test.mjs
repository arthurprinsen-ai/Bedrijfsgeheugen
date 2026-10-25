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
