import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const fromRepo=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const customerSource=fromRepo('portal-v2/modules/customer-agent-activity.js');
const customer=await import('data:text/javascript;base64,'+Buffer.from(customerSource).toString('base64'));

test('customer read model renders only safely projected tenant fields',()=>{
 const result=customer.projectCustomerActivity({
   records:[
     {id:'one',type:'SourceObservation',status:'PENDING',verified:false,executed:false,createdAt:'2026-10-08T08:00:00Z',actor:'Agenta',secretKey:'never render',payload:{personal:'private'}},
     {id:'two',type:'CommercialDelivery',status:'VERIFIED',verified:true,executed:true,observedAt:'2026-10-08T09:00:00Z'},
     {id:'three',type:'Delivery',status:'DELIVERED',verified:false,executed:true,observedAt:'2026-10-08T10:00:00Z'}
   ],
   integrationHealth:{components:[{name:'ERP',healthy:true,lastSeenAt:'2026-10-08T09:00:00Z'}]},
   wholeBrainLoops:[{complete:true},{complete:false}],
   privateBilling:{key:'do not show'}
 });
 assert.equal(result.events.length,3);
 assert.equal(result.verified,1);
 assert.equal(result.loops.complete,1);
 assert.equal(result.components[0].state,'connected');
 assert.ok(!JSON.stringify(result).includes('never render'));
 assert.ok(!JSON.stringify(result).includes('privateBilling'));
 assert.ok(result.events.every(e=>!('payload' in e)));
});

test('unknown and blocked states are never counted as verified delivery',()=>{
 const result=customer.projectCustomerActivity({records:[
   {id:'a',status:'VERIFIED',executed:false,verified:true},
   {id:'b',status:'DELIVERED',executed:true,verified:false},
   {id:'c',status:'BLOCKED',executed:false,verified:false},
   {id:'d',status:'RUNNING'}
 ]});
 assert.equal(result.verified,0);
 assert.equal(result.blocked,1);
});

test('customer never requests owner observability and enforces authentication',()=>{
 assert.match(customerSource,/stateClient\.authHeaders/);
 assert.match(customerSource,/snapshot\?\.mode!=='authenticated'/);
 assert.match(customerSource,/stateClient\?\.isDemo\?\.\(\)/);
 assert.match(customerSource,/\/api\/brain-operating-loop/);
 assert.doesNotMatch(customerSource,/\/api\/powerhouse-observability/);
});

test('internal owner Control Center stays unlisted for customer navigation',()=>{
 const registry=fromRepo('portal-v2/page-registry.js');
 const admin=fromRepo('netlify/functions/powerhouse-observability.mjs');
 assert.match(registry,/powerhouse-control-center/);
 assert.match(fromRepo('portal-v2/navigation-model.js'),/group.pages.map\(/);
 assert.match(fromRepo('portal-v2/page-shell.js'),/page.id!=='powerhouse-control-center'/);
 assert.match(admin,/isPowerhouseAdmin\(user/);
 assert.match(admin,/POWERHOUSE_ADMIN_REQUIRED/);
 const view=fromRepo('portal-v2/modules/powerhouse-observability.js');
 assert.match(view,/Live uitvoering/);
 assert.match(view,/Vernieuwen mislukt/);
 assert.match(view,/Laatste observatie/);
});

test('all affected JavaScript remains syntactically valid',()=>{
 for(const file of [
  'portal-v2/modules/customer-agent-activity.js',
  'portal-v2/modules/powerhouse-observability.js',
  'portal-v2/page-shell.js',
  'portal-v2/runtime-evidence.js',
  'portal-v2/page-registry.js',
  'portal-v2/navigation-model.js'
 ]){
   const check=spawnSync(process.execPath,['--check',new URL('../../'+file,import.meta.url).pathname],{encoding:'utf8'});
   assert.equal(check.status,0,file+': '+check.stderr);
 }
});
