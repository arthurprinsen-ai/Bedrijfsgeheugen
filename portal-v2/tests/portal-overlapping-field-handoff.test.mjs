import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalDomainState } from '../domain-state.js';

function harness({failDnaOnce=false}={}){
 let snapshot={portal:{strategy:{horizon:'2027',dna:{ambitie:'begin'}}}};
 const sent=[];let dnaAttempts=0;
 const client={
  load:async()=>({mode:'authenticated',state:structuredClone(snapshot)}),
  write:async value=>({mode:'authenticated',state:snapshot=structuredClone(value)}),
  isDemo:()=>false,
  currentUser:()=>({id:'tenant-A'}),
  authHeaders:async()=>({authorization:'Bearer test-tenant-A'})
 };
 const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async input=>{
  sent.push(structuredClone(input));
  if(input.modelId==='strategy-dna'&&failDnaOnce&&++dnaAttempts===1)throw Error('CHILD_BRAIN_ACK_FAILED');
  return {stored:true,sourceRevision:'test',brainRecordId:'test'};
 }});
 return {domain,sent,server:()=>structuredClone(snapshot)};
}

test('overlapping strategy and strategy DNA updates share a coherent pre-submit tenant snapshot',async()=>{
 const {domain,sent,server}=harness();
 await domain.init();
 domain.set('portal.strategy.horizon','2028');
 domain.set('portal.strategy.dna.ambitie','groeien');
 await domain.flush();
 assert.deepEqual(sent.map(x=>x.modelId),['strategy-operating-model','strategy-dna']);
 assert.equal(sent[0].answers.horizon,'2028');
 assert.equal(sent[0].answers.dna.ambitie,'groeien');
 assert.equal(sent[1].answers.ambitie,'groeien');
 assert.equal(server().portal.strategy.dna.ambitie,'groeien');
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('subsequent reverse-order edits keep both nested Brain model snapshots consistent',async()=>{
 const {domain,sent}=harness();
 await domain.init();
 domain.set('portal.strategy.dna.ambitie','nieuw');
 domain.set('portal.strategy.horizon','2030');
 await domain.flush();
 const byModel=Object.fromEntries(sent.map(x=>[x.modelId,x]));
 assert.equal(byModel['strategy-operating-model'].answers.dna.ambitie,'nieuw');
 assert.equal(byModel['strategy-dna'].answers.ambitie,'nieuw');
 assert.equal(domain.pendingHandoffs().pending,false);
});

test('original source replay conflict after an external newer authenticated write still fails closed',async()=>{
 let remote={portal:{strategy:{horizon:'2027'}}};
 const client={
  load:async()=>({mode:'authenticated',state:structuredClone(remote)}),
  write:async value=>({mode:'authenticated',state:remote=structuredClone(value)}),
  isDemo:()=>false,currentUser:()=>({id:'tenant-A'}),
  authHeaders:async()=>({authorization:'Bearer tenant-A'})
 };
 const original=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{throw Error('BRAIN_DOWN')}});
 await original.init();
 original.set('portal.strategy.horizon','2028');
 await assert.rejects(original.flush(),/BRAIN_DOWN/);
 remote.portal.strategy.horizon='2031';
 let replayed=0;
 const reopened=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{replayed++;return {stored:true}}});
 await reopened.init();
 await assert.rejects(reopened.flush(),/PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT/);
 assert.equal(replayed,0);
});
