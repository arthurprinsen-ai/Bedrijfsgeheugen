import test from 'node:test';
import assert from 'node:assert/strict';
import {selectTenantForesightSignals} from '../foresight-signal-drivers.js';
import {buildForesightStudioModel} from '../foresight-scenario-studio.js';

const observedAt='2026-10-14T09:00:00Z',now=Date.parse('2026-10-15T12:00:00Z');
const base=(signals,patch={})=>({
 scope:{authenticatedTenant:'user:sample',tenantExposureApplied:true},
 intelligence:{tenantId:'user:sample',projectionScope:'canonical external baseline + authenticated tenant impact overlay',signals},
 ...patch
});
const scored=(overrides={})=>({
 signal_key:'signal:1',title:'Cyberontwikkelingen bij leveranciers',domain_key:'cyber-threats',signal_type:'CYBER_RISK',
 observed_at:observedAt,impact_score:86,impact_status:'SCORED',tenant_specific_impact:true,
 company_impacts:[{status:'SCORED',impact_score:86,target_node_type:'capability'}],source_key:'public-official-source',
 ...overrides
});
test('rejects absent, canonical-only or mismatched tenant identity',()=>{
 assert.equal(selectTenantForesightSignals({}, {now}).status,'SCOPE_UNVERIFIED');
 assert.equal(selectTenantForesightSignals(base([scored()],{scope:{authenticatedTenant:'canonical',tenantExposureApplied:true}}),{now}).items.length,0);
 assert.equal(selectTenantForesightSignals(base([scored()],{intelligence:{tenantId:'other',signals:[scored()]}}),{now}).items.length,0);
 assert.equal(selectTenantForesightSignals(base([scored()],{scope:{authenticatedTenant:'user:sample',tenantExposureApplied:false}}),{now}).items.length,0);
});
test('rejects global-only, partially scored, outdated and unbounded impact signals',()=>{
 const examples=[
  scored({signal_key:'global',tenant_specific_impact:false}),
  scored({signal_key:'part',impact_status:'PARTIAL'}),
  scored({signal_key:'no-actual-overlay',company_impacts:[]}),
  scored({signal_key:'stale',observed_at:'2026-01-01T00:00:00Z'}),
  scored({signal_key:'future',observed_at:'2026-12-31T00:00:00Z'}),
  scored({signal_key:'invalid',impact_score:101})
 ];
 assert.equal(selectTenantForesightSignals(base(examples),{now}).items.length,0);
});
test('returns ranked evidenced tenant-specific impact, never money prediction',()=>{
 const packet=base([
  scored({signal_key:'generic',domain_key:'labor-market',impact_score:94}),
  scored({signal_key:'risk',impact_score:86}),
  scored({signal_key:'opportunity',domain_key:'customer-market-behavior',signal_type:'OPPORTUNITY',impact_score:71})
 ]);
 const resilience=selectTenantForesightSignals(packet,{metric:'resilience',now});
 assert.equal(resilience.status,'TENANT_SCOPED');
 assert.equal(resilience.total,3);
 assert.equal(resilience.items[0].key,'risk');
 assert.equal(resilience.items[0].contextualHint,true);
 assert.equal(resilience.items[0].impact,86);
 assert.equal(Object.hasOwn(resilience.items[0],'predictedValue'),false);
 assert.equal(resilience.items.find(x=>x.key==='opportunity').kind,'opportunity');
 const opportunity=selectTenantForesightSignals(packet,{metric:'revenue_growth',mode:'opportunity',now});
 assert.deepEqual(opportunity.items.map(x=>x.key),['opportunity']);
 assert.equal(opportunity.items[0].contextualHint,true);
});
test('exposes only at most eight bounded descriptors with no tenant id',()=>{
 const packet=base(Array.from({length:20},(_,i)=>scored({signal_key:'s'+i,impact_score:80-i,title:'Title '+i})));
 const result=selectTenantForesightSignals(packet,{now});
 assert.equal(result.total,20);
 assert.equal(result.items.length,8);
 assert.equal(Object.hasOwn(result.items[0],'tenantId'),false);
});

test('positive improvement reduces lower-is-better risk and manual hours (not a reversed scenario)',()=>{
  const history=[
    {date:'2026-07-01',value:100},{date:'2026-08-01',value:95},
    {date:'2026-09-01',value:90},{date:'2026-10-01',value:85}
  ];
  const state={portal:{business_context:{goal_targets:{
    automate:{history},resilience:{history}
  }}}};
  for(const metric of ['automate','resilience']){
    const best=buildForesightStudioModel(state,{metric,sensitivity:10,asOf:'2026-10-15T00:00:00Z'});
    const base=buildForesightStudioModel(state,{metric,sensitivity:0,asOf:'2026-10-15T00:00:00Z'});
    const worse=buildForesightStudioModel(state,{metric,sensitivity:-10,asOf:'2026-10-15T00:00:00Z'});
    assert.ok(best.scenario.simulated<base.scenario.baseline);
    assert.ok(worse.scenario.simulated>base.scenario.baseline);
    assert.equal(base.scenario.baseline,best.scenario.baseline);
  }
});
