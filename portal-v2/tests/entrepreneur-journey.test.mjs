import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildEntrepreneurHomeModel} from '../entrepreneur-home-model.js';
import {buildEntrepreneurJourneyModel,journeyGuidance,isBrainAckForImpact} from '../entrepreneur-journey-model.js';
import {allPageIds} from '../page-registry.js';

test('guest and demo never inherit tenant data or connector claims',()=>{
  const state={tenant_id:'private-company',powerhouse:{executive:{}},portal:{business_context:{
    goals:['profit'],primary_goal:'profit',goal_confirmed_at:'2026-10-21T09:00:00Z'},
    assessments:{bedrijfslekScan:{verifiedIdentity:true,score:93}}}};
  const home=buildEntrepreneurHomeModel(state,{authenticated:false,verifiedScanCount:1});
  const result=buildEntrepreneurJourneyModel(state,{authenticated:false,home});
  assert.equal(result.authenticated,false);
  assert.equal(result.steps.length,0);
  assert.equal(result.cockpit,null);
  assert.equal(result.scenario,null);
  assert.equal(result.brainReceipt,null);
});

test('no external integration, fictitious forecast or financial outcome is inferred from an empty tenant',()=>{
  const home=buildEntrepreneurHomeModel({},{authenticated:true});
  const result=buildEntrepreneurJourneyModel({},{authenticated:true,home,now:Date.parse('2026-10-21T10:00:00Z')});
  assert.equal(result.cockpit.ready,false);
  assert.equal(result.cockpit.outcomes,0);
  assert.equal(result.scenario.available,false);
  assert.equal(result.scenario.history,0);
  assert.equal(result.heartbeat,'UNKNOWN');
  assert.equal(result.steps.some(item=>item.confirmed),false);
});

test('verified Frisse Blik and saved goal remain distinct from audited business result',()=>{
 const state={tenant_id:'company-a',powerhouse:{executive:{}},portal:{business_context:{
   goals:['profit'],primary_goal:'profit',goal_confirmed_at:'2026-10-21T09:00:00Z'},
   assessments:{bedrijfslekScan:{verifiedIdentity:true,score:78}}}};
 const home=buildEntrepreneurHomeModel(state,{authenticated:true});
 const result=buildEntrepreneurJourneyModel(state,{authenticated:true,home,now:Date.parse('2026-10-21T10:00:00Z')});
 assert.equal(result.steps[0].confirmed,true);
 assert.equal(result.steps[1].confirmed,true);
 assert.equal(result.steps.at(-1).confirmed,false);
 assert.equal(result.cockpit.outcomes,0);
});

test('existing real historical observations enable exploratory scenario, never realized return',()=>{
 const history=[0,1,2,3,4].map(i=>({date:'2026-09-'+String(1+i*6).padStart(2,'0'),value:16+i*.5,evidenceRef:'record-'+i,source:'ERP'}));
 const state={portal:{business_context:{goals:['profit'],primary_goal:'profit',goal_targets:{profit:{history}}}}};
 const home=buildEntrepreneurHomeModel(state,{authenticated:true});
 const r=buildEntrepreneurJourneyModel(state,{authenticated:true,home,now:Date.parse('2026-10-21T10:00:00Z')});
 assert.equal(r.scenario.history,5);
 assert.equal(r.scenario.sourceRefs,5);
 assert.equal(r.scenario.available,true);
 assert.match(r.scenario.note,/verkennende trend/);
 assert.equal(r.cockpit.outcomes,0);
});

test('cross-page mutation reports dependencies but never claims a completed recalculation',()=>{
 const state={portal:{business_context:{goals:['profit'],primary_goal:'profit'}}};
 const home=buildEntrepreneurHomeModel(state,{authenticated:true});
 const impact={affectedPages:['waarde-financiering','businesscase','not-a-real-page','businesscase']};
 const a=buildEntrepreneurJourneyModel(state,{authenticated:true,home,impact});
 assert.deepEqual(a.dependencies.map(i=>i.id),['waarde-financiering','businesscase']);
 assert.equal(a.brainReceipt.acknowledged,false);
 const b=buildEntrepreneurJourneyModel(state,{authenticated:true,home,impact,brainReceipt:{acknowledged:true}});
 assert.equal(b.brainReceipt.acknowledged,true);
 assert.match(b.brainReceipt.label,/afzonderlijk toetsen/);
});

test('contextual guidance resolves every registered page and never invents an outcome',()=>{
 const state={portal:{business_context:{goals:['exit'],primary_goal:'exit'}}};
 const home=buildEntrepreneurHomeModel(state,{authenticated:true});
 const journey=buildEntrepreneurJourneyModel(state,{authenticated:true,home});
 for(const id of allPageIds()){
   const info=journeyGuidance(id,home,journey);
   assert.ok(info?.why&&info?.check&&info?.next,id);
   assert.doesNotMatch(info.check,/gegarandeerde winst|automatisch gerealiseerd/);
 }
 assert.equal(journeyGuidance('unknown-route',home,journey),null);
});

test('one original V2 mounts Winstnavigator, scope-safe model and cleans up event listeners',async()=>{
 const [app,html,ui,navigator,css]=await Promise.all([
   readFile(new URL('../app.js',import.meta.url),'utf8'),
   readFile(new URL('../index.html',import.meta.url),'utf8'),
   readFile(new URL('../entrepreneur-home.js',import.meta.url),'utf8'),
   readFile(new URL('../winstnavigator.js',import.meta.url),'utf8'),
   readFile(new URL('../entrepreneur-home.css',import.meta.url),'utf8')
 ]);
 assert.match(app,/mountWinstnavigator\(\{domainState:portalDomainState,stateClient:portalStateClient\}\)/);
 assert.match(app,/mountEntrepreneurHome\(\{domainState:portalDomainState,stateClient:portalStateClient,getTenantRuntime:currentOwnerRuntime\}\)/);
 assert.match(html,/winstnavigator\.css/);
 assert.match(navigator,/stateClient\.getSnapshot\(\)\?\.state\|\|\{\}/);
 assert.match(ui,/renderEntrepreneurJourney\(host,journey\)/);
 assert.match(ui,/journeyGuidance\(target,model,journey\)/);
 assert.match(ui,/bg:portal-brain-synced/);
 assert.match(ui,/removeEventListener\?\.\('bg:portal-impact'/);
 assert.match(css,/\.eh-journey-stages/);
 assert.match(css,/:focus-visible/);
});

test('canonical Brain acknowledgement belongs to the exact path and causal mutation generation',()=>{
 const impact={path:'portal.business_context',generation:17,affectedPages:['overzicht']};
 const stored=[{stored:true,sourceRevision:'r-17'}];
 assert.equal(isBrainAckForImpact(impact,{stored,impacts:[{path:'portal.profile',generation:17}]}),false);
 assert.equal(isBrainAckForImpact(impact,{stored,impacts:[{path:'portal.business_context',generation:16}]}),false);
 assert.equal(isBrainAckForImpact(impact,{stored:[],impacts:[{path:'portal.business_context',generation:17}]}),false);
 assert.equal(isBrainAckForImpact(impact,{stored,impacts:[{path:'portal.business_context',generation:17}]}),true);
 assert.equal(isBrainAckForImpact({path:'portal.business_context'}, {stored,impacts:[{path:'portal.business_context',generation:17}]}),false);
});

test('verified scan without an explicit score stays unknown across the existing overview and new home',async()=>{
 const [overview,home]=await Promise.all([
  readFile(new URL('../modules/overview.js',import.meta.url),'utf8'),
  readFile(new URL('../entrepreneur-home-model.js',import.meta.url),'utf8')
 ]);
 assert.match(overview,/rawScore!==null&&rawScore!==undefined/);
 assert.match(overview,/rawScore\.trim\(\)\.length>0/);
 assert.match(overview,/hasExplicitScore\?Number\(rawScore\):NaN/);
 assert.match(home,/hasValue\(scan\.score\)/);
 for(const score of [undefined,null,'','  ']){
   const state={portal:{assessments:{bedrijfslekScan:{verifiedIdentity:true,score}}}};
   assert.equal(buildEntrepreneurHomeModel(state,{authenticated:true}).scan.score,null);
 }
 const knownZero={portal:{assessments:{bedrijfslekScan:{verifiedIdentity:true,score:0}}}};
 assert.equal(buildEntrepreneurHomeModel(knownZero,{authenticated:true}).scan.score,0);
});

test('fresh authenticated Brain runtime is visible on owner journey, without upgrading unknown connector results',()=>{
 const at=Date.parse('2026-10-21T19:00:00Z');
 const home=buildEntrepreneurHomeModel({},{authenticated:true});
 const live={observability:{source:'brain-operating-loop',updatedAt:'2026-10-21T18:50:00Z'},sources:{items:[]}};
 const fresh=buildEntrepreneurJourneyModel({},{authenticated:true,home,now:at,tenantRuntime:live});
 assert.equal(fresh.heartbeat,'TENANT_RUNTIME_OBSERVED');
 assert.equal(fresh.steps.find(item=>item.id==='evidence').confirmed,false);
 assert.equal(fresh.scenario.available,false);
 const stale=buildEntrepreneurJourneyModel({},{authenticated:true,home,now:at+2*86400000,tenantRuntime:live});
 assert.equal(stale.heartbeat,'UNKNOWN');
 const anonymous=buildEntrepreneurJourneyModel({},{authenticated:false,home,now:at,tenantRuntime:live});
 assert.equal(anonymous.heartbeat,'UNKNOWN');
 assert.equal(anonymous.authenticated,false);
 const noProviderProof=buildEntrepreneurJourneyModel({},{authenticated:true,home,now:at,tenantRuntime:{observability:{source:'github',updatedAt:'2026-10-21T18:50:00Z'}}});
 assert.equal(noProviderProof.heartbeat,'UNKNOWN');
});
test('live runtime integration is principal-bound and clears when the account changes',async()=>{
 const [app,ui]=await Promise.all([
  readFile(new URL('../app.js',import.meta.url),'utf8'),
  readFile(new URL('../entrepreneur-home.js',import.meta.url),'utf8')
 ]);
 assert.match(app,/identity===latestOwnerRuntime\?\.subject/);
 assert.match(app,/latestOwnerRuntime=null;/);
 assert.match(app,/snap\?\.mode==='authenticated'/);
 assert.match(app,/new Event\('bg:portal-owner-runtime-updated'\)/);
 assert.match(ui,/tenantRuntime:loggedIn&&customerState\?getTenantRuntime\(\):null/);
 assert.match(ui,/removeEventListener\?\.\('bg:portal-owner-runtime-updated'/);
 assert.doesNotMatch(app,/new CustomEvent\('bg:portal-owner-runtime-updated',\{detail:/);
});
