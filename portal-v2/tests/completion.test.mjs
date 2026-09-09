import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompletion } from '../completion.js';

test('completion reports complete, total, percentage and missing required fields',()=>{
  const schema=[
    {id:'name',path:'profile.name',required:true},
    {id:'employees',path:'profile.employees',required:true},
    {id:'note',path:'profile.note',required:false}
  ];
  assert.deepEqual(calculateCompletion(schema,{profile:{name:'Acme'}}),{
    complete:1,total:2,percentage:50,missing:['employees']
  });
});

test('zero required fields returns 100 percent completion',()=>{
  assert.deepEqual(calculateCompletion([{id:'note',path:'note'}],{}),{
    complete:0,total:0,percentage:100,missing:[]
  });
});
