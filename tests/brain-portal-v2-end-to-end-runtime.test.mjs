import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainState } from '../portal-v2/domain-state.js';
import { loadRuntimeEvidence } from '../portal-v2/runtime-evidence.js';
import { portalCorrelationFromStored, buildPortalEvidence } from '../portal-v2/powerhouse-runtime-bridge.js';

const projection={
  tenantId:'tenant-a',
  records:[{id:'e1',type:'Evidence',observedAt:'2026-10-04T12:00:00Z'}],
  wholeBrainLoops:[],loopSummary:{complete:0,incomplete:0,total:0},
  integrationHealth:{components:[{name:'Supabase',healthy:true}]},
  verifiedValue:{verifiedValues:[]},livingMemory:{memories:[]},
  businessGraph:{nodes:[],edges:[]},executiveCockpit:{recommendedActions:[],openKnowledgeObligations:[],activityTimeline:[],openLoops:[]}
};

test('derived Brain projection never enters the portal source-write path',async()=>{
  let saves=0;
  const domain=createDomainState({load:async()=>({portal:{profile:{headcount:12}}}),save:async state=>{saves+=1;return state;}});
  await domain.init();
  domain.project('portal.runtime',{health:'ok'});
  assert.equal(domain.get('portal.runtime').health,'ok');
  assert.equal(domain.get('portal.profile.headcount'),12);
  assert.equal(domain.status(),'idle');
  await domain.flush();
  assert.equal(saves,0,'derived runtime projection may not persist as customer input');
});

test('Brain readback is authenticated and projected without creating source truth',async()=>{
  let auth='';
  let derived=null;
  const runtime=await loadRuntimeEvidence({
    fetchImpl:async(_url,options={})=>{auth=options.headers?.authorization||'';return{ok:true,json:async()=>projection};},
    authHeadersProvider:async()=>({authorization:'Bearer tenant-token'}),
    domainState:{setDerived:(path,value)=>{derived={path,value};}}
  });
  assert.equal(auth,'Bearer tenant-token');
  assert.equal(derived.path,'portal.runtime');
  assert.ok(runtime.sources.items.length);
});

test('portal canonical write lineage is reusable by UI evidence and never forks correlation',()=>{
  const correlation=portalCorrelationFromStored({sourceRevision:'rev-e2e'});
  assert.equal(correlation,'PORTAL_INPUT-rev-e2e');
  const evidence=buildPortalEvidence({event:'portal_projection_synced',correlationId:correlation,predecessorIds:['brain-record','current-state']});
  assert.equal(evidence.correlationId,correlation);
  assert.deepEqual(evidence.predecessorIds,['brain-record','current-state']);
  assert.equal(evidence.type,'Evidence');
});
