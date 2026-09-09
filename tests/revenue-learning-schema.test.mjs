import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const path=new URL('../supabase/migrations/20260909112000_revenue_learning_layer.sql',import.meta.url);

test('schema creates all unified revenue learning tables with RLS',async()=>{
  const sql=await readFile(path,'utf8');
  for(const table of ['revenue_learning_evidence','revenue_learnings','revenue_learning_applications','revenue_learning_decisions','revenue_learning_projections','revenue_learning_obligations']){
    assert.match(sql,new RegExp(`create table if not exists public\\.${table}`,'i'));
    assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
  }
});
