import test from 'node:test';
import assert from 'node:assert/strict';
import {readLegacyPortalBusinessInputs,migrateLegacyPortalBusinessInputs} from '../portal-v2/business-input-store.js';
import {createPortalDomainState} from '../portal-v2/domain-state.js';

function cache(records){
 const items=new Map(Object.entries(records).map(([key,value])=>[key,typeof value==='string'?value:JSON.stringify(value)]));
 return {get length(){return items.size},key:i=>[...items.keys()][i]??null,getItem:key=>items.get(key)??null};
}
const both=()=>cache({
 'bg_portaal_alice@example.test':{beleid:{aibeleid:2},niveaus:{finance:3}},
 'bg_portaal_bob@example.test':{beleid:{aibeleid:0},niveaus:{finance:1}},
 'bg_portaal_open':'1',
 'bg_portaal_lead':{mail:'sales@example.test'}
});

test('legacy BusinessInput list fails closed without signed-in user even when only one cached tenant exists',()=>{
 const only=cache({'bg_portaal_bob@example.test':{beleid:{aibeleid:3}}});
 assert.deepEqual(readLegacyPortalBusinessInputs(only),[]);
 assert.deepEqual(readLegacyPortalBusinessInputs(only,{}),[]);
 assert.deepEqual(readLegacyPortalBusinessInputs(only,{email:'alice@example.test'}),[]);
});

test('BusinessInput legacy import uses exact normalized email, never substring or other customer cache',()=>{
 const storage=both();
 const alice=readLegacyPortalBusinessInputs(storage,{email:' ALICE@EXAMPLE.TEST '});
 const bob=readLegacyPortalBusinessInputs(storage,{email:'bob@example.test'});
 assert.equal(alice.length,1);
 assert.equal(alice[0].modelId,'bg_portaal_alice@example.test');
 assert.equal(alice[0].answers.niveaus.finance,3);
 assert.equal(bob.length,1);
 assert.equal(bob[0].modelId,'bg_portaal_bob@example.test');
 assert.equal(bob[0].answers.niveaus.finance,1);
 assert.deepEqual(readLegacyPortalBusinessInputs(storage,{email:'ali@example.test'}),[]);
});

test('authenticated portal boot migrates only current user legacy BusinessInput and never unrelated cached customer',async()=>{
 const submitted=[];
 const stateClient={
  load:async()=>({mode:'authenticated',state:{portal:{profile:{employees:8}}}}),
  write:async state=>({mode:'authenticated',state}),
  currentUser:()=>({email:'alice@example.test'}),
  authHeaders:async()=>({authorization:'Bearer scoped-session'}),
  isDemo:()=>false
 };
 const domain=createPortalDomainState(stateClient,{
  legacyStorage:both(),
  businessInputSaver:async(input)=>{submitted.push(input);return{stored:true};}
 });
 await domain.init();
 assert.deepEqual(submitted.map(input=>input.modelId),['bg_portaal_alice@example.test']);
 assert.equal(submitted[0].answers.niveaus.finance,3);
 assert.equal(domain.get('portal.profile.maturity.finance'),3);
});

test('portal boot with no matching legacy key cannot migrate another customer via current auth token',async()=>{
 const submitted=[];
 const stateClient={
  load:async()=>({mode:'authenticated',state:{portal:{profile:{employees:8}}}}),
  write:async state=>({mode:'authenticated',state}),
  currentUser:()=>({email:'charlie@example.test'}),
  authHeaders:async()=>({authorization:'Bearer scoped-session'}),
  isDemo:()=>false
 };
 const domain=createPortalDomainState(stateClient,{legacyStorage:both(),businessInputSaver:async input=>{submitted.push(input);return{stored:true};}});
 await domain.init();
 assert.deepEqual(submitted,[]);
 assert.equal(domain.get('portal.profile.maturity.finance'),undefined);
});

test('standalone legacy migration refuses bearerless writes and sends only signed-in user even if the cache has other tenants',async()=>{
 const received=[];
 const fetchFn=async(_url,options)=>{
  received.push(JSON.parse(options.body));
  return {ok:true,json:async()=>({stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'revision',brainRecordId:'brain',currentStateRecordId:'state',organismImpactRecordId:'impact'})};
 };
 await assert.rejects(
  ()=>migrateLegacyPortalBusinessInputs({storage:both(),fetchFn,user:{email:'alice@example.test'},authorization:''}),
  /PORTAL_LEGACY_MIGRATION_AUTH_REQUIRED/
 );
 assert.equal(received.length,0);
 const done=await migrateLegacyPortalBusinessInputs({storage:both(),fetchFn,user:{email:'bob@example.test'},authorization:'Bearer scoped'});
 assert.equal(done.length,1);
 assert.equal(done[0].ok,true);
 assert.deepEqual(received.map(input=>input.modelId),['bg_portaal_bob@example.test']);
});
