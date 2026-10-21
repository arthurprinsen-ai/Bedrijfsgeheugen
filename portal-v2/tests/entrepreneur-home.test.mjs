import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildEntrepreneurHomeModel,goalContextPatch,saveEntrepreneurGoal,ENTREPRENEUR_GOALS} from '../entrepreneur-home-model.js';

test('first visit starts with owner ambition instead of invented figures or AI maturity',()=>{
 const model=buildEntrepreneurHomeModel({},{authenticated:true});
 assert.equal(model.selectedGoal,null);
 assert.equal(model.next.kind,'choose');
 assert.equal(model.scan.score,null);
 assert.equal(model.scan.verified,false);
 assert.equal(model.target,null);
 assert.equal(model.intelligence.ready,false);
 assert.equal(ENTREPRENEUR_GOALS.length,7);
});

test('unauthenticated visitor cannot see stale tenant ambition, scan score or action',()=>{
 const state={tenant_id:'tenant-sensitive',portal:{business_context:{goals:['profit'],primary_goal:'profit',goal_targets:{profit:{target_value:100000,target_date:'2027-10-21'}}},assessments:{bedrijfslekScan:{verifiedIdentity:true,score:88}}}};
 const model=buildEntrepreneurHomeModel(state,{authenticated:false});
 assert.equal(model.selectedGoal,null);
 assert.equal(model.scan.score,null);
 assert.equal(model.target,null);
 assert.equal(model.intelligence.verifiedSignals,0);
});

test('existing goal list is preserved; picking a goal does not confirm other business facts',()=>{
 const patch=goalContextPatch({goals:['exit','profit'],stage:'grow'},'valuation','2026-10-21T08:00:00Z');
 assert.deepEqual(patch.goals,['exit','profit','valuation']);
 const newer=goalContextPatch({goals:['custom-approved','exit']},'valuation');
 assert.deepEqual(newer.goals,['custom-approved','exit','valuation']);
 assert.equal(patch.primary_goal,'valuation');
 assert.equal(patch.goal_confirmed_at,'2026-10-21T08:00:00Z');
 assert.equal(Object.hasOwn(patch,'confirmed'),false);
 assert.throws(()=>goalContextPatch({},'not-an-id'),/ENTREPRENEUR_GOAL_INVALID/);
});

test('goal progress is displayed only for explicitly entered target and valid ISO date',()=>{
 const data={portal:{business_context:{goals:['profit'],primary_goal:'profit',goal_targets:{profit:{target_value:1000,target_date:'2027-10-21'}}}}};
 assert.equal(buildEntrepreneurHomeModel(data,{authenticated:true}).target.value,1000);
 assert.equal(buildEntrepreneurHomeModel(data,{authenticated:true}).next.kind,'explore');
 data.portal.business_context.goal_targets.profit.target_date='2027-02-29';
 assert.equal(buildEntrepreneurHomeModel(data,{authenticated:true}).target,null);
 assert.equal(buildEntrepreneurHomeModel(data,{authenticated:true}).next.kind,'measure');
 data.portal.business_context.goal_targets.profit.target_date='2027-10-21';
 data.portal.business_context.goal_targets.profit.target_value='  ';
 assert.equal(buildEntrepreneurHomeModel(data,{authenticated:true}).target,null);
});

test('the existing authorized scan history can confirm a generic Frisse Blik without inventing a score',()=>{
 const model=buildEntrepreneurHomeModel({},{authenticated:true,verifiedScanCount:2});
 assert.equal(model.scan.verified,true);
 assert.equal(model.scan.count,2);
 assert.equal(model.scan.score,null);
 assert.match(model.scan.description,/gecontroleerde|geverifieerde/);
 const anonymous=buildEntrepreneurHomeModel({},{authenticated:false,verifiedScanCount:2});
 assert.equal(anonymous.scan.verified,false);
});

test('scan score is never treated as audited financial return',()=>{
 const state={portal:{assessments:{bedrijfslekScan:{verifiedIdentity:true,score:70}}}};
 const model=buildEntrepreneurHomeModel(state,{authenticated:true});
 assert.equal(model.scan.score,70);
 assert.match(model.scan.description,/Zelfgerapporteerde/);
 const invalid=buildEntrepreneurHomeModel({portal:{assessments:{bedrijfslekScan:{score:92}}}},{authenticated:true});
 assert.equal(invalid.scan.score,null);
});

test('writes use one canonical domain flush and require positive readback acknowledgement',async()=>{
 let value={goals:['exit'],primary_goal:'exit'};
 let calls=0,flushes=0;
 const store={
  get(path){return path==='portal.business_context'?value:path==='portal.business_context.primary_goal'?value.primary_goal:null;},
  patch(path,patch){assert.equal(path,'portal.business_context');calls++;value={...value,...patch};},
  async flush(){flushes++;return {status:'saved'};}
 };
 const saved=await saveEntrepreneurGoal(store,'profit',{authenticated:true,at:'2026-10-21T09:00:00Z'});
 assert.equal(saved.saved,true);assert.equal(calls,1);assert.equal(flushes,1);
 assert.deepEqual(value.goals,['exit','profit']);
 await saveEntrepreneurGoal(store,'profit',{authenticated:true});
 assert.equal(flushes,1);
 await assert.rejects(saveEntrepreneurGoal(store,'exit',{authenticated:false}),/AUTH_REQUIRED/);
 store.flush=async()=>({status:'dirty'});
 await assert.rejects(saveEntrepreneurGoal(store,'cash',{authenticated:true}),/CANONICAL_ACK_REQUIRED/);
});

test('guided homepage is mounted once in original V2 with auth boundaries and native page routing',async()=>{
 const [ui,app,html,css]=await Promise.all([
  readFile(new URL('../entrepreneur-home.js',import.meta.url),'utf8'),
  readFile(new URL('../app.js',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../entrepreneur-home.css',import.meta.url),'utf8')
 ]);
 for(const token of ['stateClient.subscribe(onIdentity)','domainState.subscribe(draw)','isDemo','saveEntrepreneurGoal','navigate(button.dataset.entrepreneurPage)','data-entrepreneur-home'])
   assert.ok(ui.includes(token),token);
 assert.match(app,/mountEntrepreneurHome\(\{domainState:portalDomainState,stateClient:portalStateClient\}\)/);
 assert.match(html,/entrepreneur-home\.css/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|Math\.random|fetch\(/);
});
