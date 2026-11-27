import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPortalDomainState } from '../portal-v2/domain-state.js';

test('portal identity boot never treats initial anonymous render as a tenant switch',async()=>{
 const app=await readFile(new URL('../portal-v2/app.js',import.meta.url),'utf8');
 assert.match(app,/let portalVisualAuthSubject='';/);
 assert.match(app,/if\(nextVisualSubject!==portalVisualAuthSubject\)/);
 assert.match(app,/document\.dispatchEvent\(new Event\('bg:portal-identity-boundary'\)\)/);
 assert.match(app,/await portalDomainState\.init\(\)/);
 assert.match(app,/if\(before!==after\)return/);
 assert.match(app,/view\?\.getAttribute\('aria-hidden'\)==='true'/);
 assert.match(app,/gatedOpenPage\(requested\)/,'deep link recovery must respect entitlement and protected trust gates');
 assert.doesNotMatch(app,/setInterval\([^\n]*refreshDomainState/,'no additional hydration scheduler');
});

test('two related customer section writes produce coherent nested Brain payloads without dropping impacts',async()=>{
 let persisted={portal:{strategy:{horizon:'2027',dna:{ambitie:'start'}}}};
 const outputs=[];
 const stateClient={
  load:async()=>({mode:'authenticated',state:structuredClone(persisted)}),
  write:async state=>({mode:'authenticated',state:persisted=structuredClone(state)}),
  isDemo:()=>false,currentUser:()=>({id:'tenant-A'}),
  authHeaders:async()=>({authorization:'Bearer tenant-A'})
 };
 const domain=createPortalDomainState(stateClient,{legacyStorage:null,businessInputSaver:async input=>{
  outputs.push(structuredClone(input));return {stored:true,brainRecordId:'test'};
 }});
 await domain.init();
 domain.set('portal.strategy.horizon','2030');
 domain.set('portal.strategy.dna.ambitie','duurzaam groeien');
 await domain.flush();
 const parent=outputs.find(x=>x.modelId==='strategy-operating-model');
 const child=outputs.find(x=>x.modelId==='strategy-dna');
 assert.ok(parent&&child);
 assert.equal(parent.answers.dna.ambitie,'duurzaam groeien');
 assert.equal(child.answers.ambitie,'duurzaam groeien');
 assert.ok(parent.metadata.causalImpacts.length);
 assert.ok(child.metadata.causalImpacts.length);
 assert.equal(domain.pendingHandoffs().pending,false);
});
