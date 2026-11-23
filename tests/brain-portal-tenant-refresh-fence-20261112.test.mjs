import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPortalDomainState} from '../portal-v2/domain-state.js';

test('original ONE BRAIN replay: member may not receive another tenant source while old tenant is hydrated',async()=>{
 let tenantId='tenant-a',loads=0;
 const stateClient={
  load:async()=>({mode:'authenticated',state:{portal:{profile:{employees:++loads*10}}}}),
  write:async state=>({mode:'authenticated',state}),
  currentUser:()=>({id:'member-1',app_metadata:{tenantId}}),
  isDemo:()=>false,
  authHeaders:async()=>({authorization:'Bearer scoped'})
 };
 const domain=createPortalDomainState(stateClient,{legacyStorage:null,businessInputSaver:async()=>({stored:true})});
 await domain.init();
 assert.equal(domain.get('portal.profile.employees'),10);
 tenantId='tenant-b';
 const result=await domain.refresh();
 assert.deepEqual(result,{applied:false,reason:'UNVERIFIED_OR_UNSAVED_TENANT'});
 assert.equal(loads,1,'no cross-tenant GET until authenticated tenant rehydration');
 assert.equal(domain.get('portal.profile.employees'),10);
 await domain.init();
 assert.equal(domain.get('portal.profile.employees'),20);
});

test('original agent and portal skill register same-owner tenant-fence and orphan-route prevention',async()=>{
 const [agent,skill,learning]=await Promise.all([
  readFile(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8'),
  readFile(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8'),
  readFile(new URL('../brain/learning/2026-11-12-portal-tenant-refresh-fence-v1.json',import.meta.url),'utf8')
 ]);
 assert.match(agent,/fence-portal-revalidation-by-hydrated-member-and-server-issued-tenant/);
 assert.match(agent,/reject-unmapped-portal-root-runtime-journal-edits-before-broken-brain-handoff/);
 assert.match(agent,/prove-same-member-cross-tenant-refresh-refused-until-authorized-rehydration/);
 assert.match(skill,/portal\|domain-state\|same-member-tenant-switch-refreshes-old-hydration\|20261112-v1/);
 assert.match(skill,/PORTAL_DIRECT_WRITE_PATH_HAS_NO_CANONICAL_HANDOFF/);
 const record=JSON.parse(learning);
 assert.equal(record.status,'SOURCE_CANDIDATE');
 assert.equal(record.production_proven,false);
 assert.equal(record.consumer_processed_ack,'NOT_YET_PROVEN');
 assert.equal(record.owner_issue,4215);
 assert.equal(record.no_new_executor,true);
});
