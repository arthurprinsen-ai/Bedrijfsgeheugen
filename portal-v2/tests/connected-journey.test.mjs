import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {allPageIds} from '../page-registry.js';
import {buildConnectedJourneyModel,contextualSourceStatus,allConnectedPagesHaveContext,SOURCE_DIRECTORY} from '../connected-journey-model.js';

test('every registered page has contextual business guidance without a second portal',()=>{
 const pages=allPageIds();
 assert.ok(pages.length>60,'all registered pages must be covered');
 assert.equal(allConnectedPagesHaveContext(),true);
 for(const pageId of pages){
   const m=buildConnectedJourneyModel({pageId});
   assert.equal(m.pageId,pageId);
   assert.ok(m.message);
   assert.ok(m.sources.length>0);
   assert.ok(m.action.page);
 }
 assert.equal(buildConnectedJourneyModel({pageId:'does-not-exist'}),null);
});

test('tenants, demo and guests cannot expose a previous company goal, impact or provider evidence',()=>{
 const state={tenant_id:'private-tenant-a',portal:{business_context:{goals:['profit'],primary_goal:'profit'},runtime:{sources:{items:[{name:'Supabase',healthy:true,evidenceRef:'tenant-a-proof',updatedAt:'2026-10-21T09:00:00Z'}]}}}};
 const impact={affectedPages:['waarde-financiering','due-diligence'],effectRules:[{reason:'Financial sensitivity requires separate review.'}]};
 const anon=buildConnectedJourneyModel({pageId:'overzicht',state,authenticated:false,impact,phase:'confirmed',now:Date.parse('2026-10-21T09:10:00Z')});
 assert.equal(anon.goalLabel,null);
 assert.equal(anon.impact.phase,'unknown');
 assert.match(anon.impact.status,/Geen recente wijziging/);
 assert.equal(anon.related.length,0);
 assert.ok(anon.sources.every(source=>source.verified===false));
 const signed=buildConnectedJourneyModel({pageId:'overzicht',state,authenticated:true,impact,phase:'pending',now:Date.parse('2026-10-21T09:10:00Z')});
 assert.equal(signed.goalLabel,'Meer winst / minder kosten');
 assert.equal(signed.related.length,2);
 assert.match(signed.impact.status,/nog afwachten/);
 const saved=buildConnectedJourneyModel({pageId:'overzicht',state,authenticated:true,impact,phase:'confirmed',now:Date.parse('2026-10-21T09:10:00Z')});
 assert.match(saved.impact.status,/Opgeslagen/);
 assert.doesNotMatch(saved.impact.status,/besparing|rendement|omzet/);
});

test('connector platform name alone never masquerades as tenant provider readback',()=>{
 const now=Date.parse('2026-10-21T09:10:00Z');
 const plain={tenant_id:'a',portal:{runtime:{sources:{items:[{name:'Supabase',healthy:true,updatedAt:'2026-10-21T09:00:00Z'}]}}}};
 assert.equal(contextualSourceStatus(plain,'supabase',now).verified,false);
 const stale={tenant_id:'a',portal:{runtime:{sources:{items:[{name:'Supabase',healthy:true,evidenceRef:'source-123',updatedAt:'2026-10-19T09:00:00Z'}]}}}};
 assert.equal(contextualSourceStatus(stale,'supabase',now).verified,false);
 const future={tenant_id:'a',portal:{runtime:{sources:{items:[{name:'Supabase',healthy:true,evidenceRef:'source-123',updatedAt:'2026-10-22T09:00:00Z'}]}}}};
 assert.equal(contextualSourceStatus(future,'supabase',now).verified,false);
 const evidence={tenant_id:'a',portal:{runtime:{sources:{items:[{name:'Supabase',healthy:true,evidenceRef:'source-123',updatedAt:'2026-10-21T09:00:00Z'}]}}}};
 assert.equal(contextualSourceStatus(evidence,'supabase',now).verified,true);
 assert.equal(contextualSourceStatus({portal:evidence.portal},'supabase',now).verified,false);
 assert.equal(contextualSourceStatus(evidence,'other',now),null);
});

test('provider relevance uses existing secured destination pages, never fake connections',()=>{
 for(const [id,source] of Object.entries(SOURCE_DIRECTORY)){
   const model=buildConnectedJourneyModel({pageId:'powerhouse-control-center',authenticated:true});
   assert.ok(model.sources.some(row=>row.id===id));
   assert.equal(model.sources.find(row=>row.id===id).verified,false);
   assert.ok(source.page);
 }
 const data=buildConnectedJourneyModel({pageId:'koppelingen',authenticated:true});
 assert.ok(data.sources.some(x=>x.id==='composio'));
 const docs=buildConnectedJourneyModel({pageId:'documenten',authenticated:true});
 assert.ok(docs.sources.some(x=>x.id==='notion'));
});

test('real page wiring uses one canonical context, existing navigator and only acknowledged mutation events',async()=>{
 const [app,html,guide,nav,css]=await Promise.all([
   readFile(new URL('../app.js',import.meta.url),'utf8'),
   readFile(new URL('../index.html',import.meta.url),'utf8'),
   readFile(new URL('../entrepreneur-home.js',import.meta.url),'utf8'),
   readFile(new URL('../winstnavigator.js',import.meta.url),'utf8'),
   readFile(new URL('../winstnavigator.css',import.meta.url),'utf8')
 ]);
 assert.match(app,/mountWinstnavigator\(\{domainState:portalDomainState,stateClient:portalStateClient\}\)/);
 assert.match(html,/winstnavigator\.css/);
 assert.match(guide,/buildConnectedJourneyModel/);
 assert.match(guide,/bg:portal-brain-synced/);
 assert.match(guide,/bg:portal-server-refreshed/);
 assert.match(guide,/data-entrepreneur-guide/);
 assert.match(guide,/bg:portal-impact/);
 assert.match(guide,/onBrainSynced/);
 assert.match(guide,/recentImpact=null;impactPhase='unknown'/);
 assert.match(guide,/data-entrepreneur-guide/);
 assert.match(guide,/entrepreneurWinstnavigator/);
 assert.match(nav,/buildForesightStudioModel/);
 assert.match(css,/scroll-snap-type/);
 assert.doesNotMatch(guide,/fetch\(|localStorage|sessionStorage|Math\.random/);
});
