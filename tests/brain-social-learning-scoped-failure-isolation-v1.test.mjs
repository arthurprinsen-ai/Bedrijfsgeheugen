import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runScheduledTenants} from '../netlify/functions/social-learning-evaluate.mjs';

const clock=new Date('2026-10-24T20:00:00Z');
test('both independently authorized tenant scopes begin before either scope completes',async()=>{
  const started=[];
  const releases=new Map();
  const factory=({tenantId})=>({
    listDuePosts:()=>{started.push(tenantId);return new Promise(resolve=>releases.set(tenantId,resolve));}
  });
  const running=runScheduledTenants({storeFactory:factory,now:clock,maxDuePosts:2});
  await Promise.resolve();
  assert.deepEqual(started,['canonical','bedrijfsgeheugen']);
  releases.get('canonical')([]);
  releases.get('bedrijfsgeheugen')([]);
  const result=await running;
  assert.equal(result.healthy,true);
  assert.equal(result.totals.failedTenantScopes,0);
  assert.equal(result.totals.dueBacklog,0);
});
test('failed canonical tenant does not prevent brand learning, and is never returned as green',async()=>{
  const attempted=[];
  const result=await runScheduledTenants({now:clock,maxDuePosts:2,storeFactory:({tenantId})=>({
    listDuePosts:async()=>{attempted.push(tenantId);if(tenantId==='canonical')throw new Error('synthetic provider unavailability');return [];}
  })});
  assert.deepEqual(attempted,['canonical','bedrijfsgeheugen']);
  assert.equal(result.healthy,false);
  assert.equal(result.status,'PARTIAL_FAILURE_RETRY_EXISTING_HOURLY_OWNER');
  assert.equal(result.totals.failedTenantScopes,1);
  assert.equal(result.totals.dueBacklog,null);
  assert.equal(result.tenants.find(x=>x.tenantId==='bedrijfsgeheugen').ok,true);
  assert.equal(result.tenants.find(x=>x.tenantId==='canonical').error_class,'TENANT_EVALUATION_FAILED');
  assert.equal(JSON.stringify(result).includes('synthetic provider unavailability'),false);
});
test('untrusted tenant scope rejects before any source starts',async()=>{
  let started=0;
  await assert.rejects(runScheduledTenants({tenants:['canonical','unknown'],storeFactory:()=>{started++;return{};}}),/UNAUTHORIZED_SOCIAL_TENANT_SCOPE/);
  assert.equal(started,0);
});
test('canonical scheduled function keeps existing cadence and fail-closed partial result',()=>{
  const source=fs.readFileSync(new URL('../netlify/functions/social-learning-evaluate.mjs',import.meta.url),'utf8');
  assert.equal(source.split("schedule:'@hourly'").length-1,1);
  assert.ok(source.includes('Promise.allSettled'));
  assert.ok(source.includes('status:result.healthy?204:503'));
  assert.ok(source.includes('maxDuePosts=2'));
});