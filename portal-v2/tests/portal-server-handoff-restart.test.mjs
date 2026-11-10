import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalDomainState} from '../domain-state.js';
import {buildPortalBusinessInput} from '../portal-state.js';

const clone=value=>structuredClone(value);
const journal=state=>state?.portal?.__brainHandoffJournalV1;
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function until(check){
 for(let tries=0;tries<30;tries++){
  if(check())return;
  await tick();
 }
 assert.fail('original init-bound Brain replay did not reach expected terminal state');
}
function serverHarness(initial={portal:{profile:{employees:10}}}){
 let stored=clone(initial),principal='user-A';
 const writes=[];
 const client={
  load:async()=>({mode:'authenticated',state:clone(stored)}),
  write:async state=>{stored=clone(state);writes.push(clone(state));return {mode:'authenticated',state:clone(state)}},
  authHeaders:async()=>({authorization:`Bearer ${principal}`}),
  currentUser:()=>({id:principal}),isDemo:()=>false
 };
 return {client,writes,current:()=>clone(stored),become:user=>{principal=user;},principal:()=>principal};
}

test('failed Brain BusinessInput is server-durable and automatically retried after a fresh browser instance',async()=>{
 const h=serverHarness();
 const original=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async()=>{throw Error('BRAIN_TEMPORARY_503')}});
 await original.init();
 original.set('portal.profile.employees',22);
 await assert.rejects(original.flush(),/BRAIN_TEMPORARY_503/);
 assert.equal(h.current().portal.profile.employees,22,'source data must survive');
 assert.equal(journal(h.current())?.byPrincipal?.['user-A']?.bindings?.length,1,'pending manifest persisted BEFORE failure');
 assert.equal(journal(h.current()).byPrincipal['user-A'].impacts.length,1);
 assert.equal(original.pendingHandoffs().pending,true);
 const receipts=[];
 const reopened=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async input=>{
  receipts.push(clone(input));return {stored:true,sourceRevision:'backend-revision',brainRecordId:'r1'};
 }});
 await reopened.init();
 await until(()=>receipts.length===1&&!(journal(h.current()).byPrincipal['user-A']));
 assert.equal(receipts[0].modelId,'company-profile');
 assert.equal(receipts[0].answers.employees,22);
 assert.equal(receipts[0].metadata.causalImpacts.length,1);
 assert.equal(receipts[0].metadata.causalImpacts[0].path,'portal.profile.employees');
 assert.equal(reopened.pendingHandoffs().pending,false);
 assert.deepEqual(journal(h.current()).byPrincipal,{});
});

test('partial Brain ACK persists ONLY unconfirmed sections; restart replays none of the already confirmed sections',async()=>{
 const h=serverHarness({portal:{profile:{employees:10},aiAct:{riskClass:'limited'}}});
 const first=[];
 const original=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async input=>{
  first.push(input.modelId);
  if(input.modelId==='eu-ai-act')throw Error('BRAIN_503_SECOND_SECTION');
  return {stored:true,sourceRevision:'ack-profile'};
 }});
 await original.init();
 original.set('portal.profile.employees',12);
 original.set('portal.aiAct.riskClass','high');
 await assert.rejects(original.flush(),/BRAIN_503_SECOND_SECTION/);
 assert.deepEqual(first,['company-profile','eu-ai-act']);
 const left=journal(h.current()).byPrincipal['user-A'];
 assert.deepEqual(left.bindings.map(binding=>binding.modelId),['eu-ai-act']);
 assert.equal(left.impacts.length,1);
 const replayed=[];
 const reopened=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async input=>{
  replayed.push(input.modelId);return {stored:true,sourceRevision:'ack-ai-act'};
 }});
 await reopened.init();
 await until(()=>replayed.length===1&&!(journal(h.current()).byPrincipal['user-A']));
 assert.deepEqual(replayed,['eu-ai-act']);
 assert.equal(reopened.pendingHandoffs().pending,false);
});

test('a different authenticated customer cannot consume, delete or reattribute an earlier principal handoff',async()=>{
 const h=serverHarness();
 const original=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async()=>{throw Error('DOWNSTREAM_FAILED')}});
 await original.init();original.set('portal.profile.employees',17);
 await assert.rejects(original.flush(),/DOWNSTREAM_FAILED/);
 h.become('user-B');
 let bSent=0;
 const bDomain=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async()=>{bSent++;return {stored:true}}});
 await bDomain.init();
 await tick();await tick();
 assert.equal(bSent,0);
 assert.equal(bDomain.pendingHandoffs().pending,false);
 assert.equal(journal(h.current()).byPrincipal['user-A'].bindings.length,1);
 bDomain.set('portal.profile.employees',19);
 await bDomain.flush();
 assert.equal(bSent,1,'B may submit ONLY a new B-owned change');
 assert.equal(journal(h.current()).byPrincipal['user-A'].bindings.length,1,'B update must not erase A pending lineage');
 h.become('user-A');
 let aSent=0;
 const restored=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async()=>{aSent++;return {stored:true}}});
 await restored.init();
 await until(()=>aSent===1&&!(journal(h.current()).byPrincipal['user-A']));
 assert.equal(aSent,1);
});

test('more than fifty causal changes and original source answers are recovered without a bounded truncation',async()=>{
 const h=serverHarness({portal:{profile:{answers:{}}}});
 const original=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async()=>{throw Error('BRAIN_DOWN')}});
 await original.init();
 for(let n=0;n<65;n++)original.set(`portal.profile.answers.question${n}`,`answer${n}`);
 await assert.rejects(original.flush(),/BRAIN_DOWN/);
 assert.equal(journal(h.current()).byPrincipal['user-A'].impacts.length,65);
 let replayed=null;
 const reopened=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async input=>{replayed=clone(input);return {stored:true}}});
 await reopened.init();
 await until(()=>replayed!==null&&!(journal(h.current()).byPrincipal['user-A']));
 assert.equal(replayed.metadata.causalImpacts.length,65);
 assert.equal(replayed.answers.answers.question64,'answer64');
});

test('private retry journal stays in original server state but never becomes AI-eligible canonical source answers',()=>{
 const source={portal:{profile:{employees:22},__brainHandoffJournalV1:{version:1,byPrincipal:{'user-A':{bindings:[{key:'section:profile'}],impacts:[]}}}}};
 const input=buildPortalBusinessInput(source);
 assert.equal(input.answers.portal.profile.employees,22);
 assert.equal(input.answers.portal.__brainHandoffJournalV1,undefined);
 assert.ok(source.portal.__brainHandoffJournalV1,'source state not mutated');
});

test('malformed journal cannot cause a forged cross-model or cross-tenant replay',async()=>{
 const h=serverHarness({portal:{profile:{employees:10},__brainHandoffJournalV1:{version:1,byPrincipal:{'user-A':{bindings:[{key:'section:profile',inputType:'CompanyProfile',modelId:'company-profile',statePath:'portal.otherTenant.secret',generation:1}],impacts:[]}}}}});
 let posted=0;
 const domain=createPortalDomainState(h.client,{legacyStorage:null,businessInputSaver:async()=>{posted++;return {stored:true}}});
 await assert.rejects(domain.init(),/PORTAL_BRAIN_JOURNAL_INVALID_BINDING/);
 assert.equal(posted,0);
});
