import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTenantForesightEvidence,classifyTenantForesightSignal,renderTenantForesightEvidence} from '../foresight-tenant-evidence.js';
const at='2026-10-15T14:00:00Z',now=Date.parse('2026-10-15T18:00:00Z');
const signal=(id,signal_type)=>({signal_key:id,signal_type,title:'Signal '+id,observed_at:at,status:'ACTIVE',domain_key:'market',evidence:{observation:'source:'+id},source_key:'provider'});
const impact=(id,tenant_id='tenant-a')=>({tenant_id,signal_key:id,status:'SCORED',impact_score:72,observed_at:at,impact_key:'impact:'+id,evidence:{receipt:'receipt:'+id},target_label:'Team'});
const action=(id,tenant_id='tenant-a')=>({tenant_id,signal_key:id,tenant_specific:true,title:'Review '+id,status:'READY',evidence:{source:id}});
const packet=()=>({scope:{authenticatedTenant:'tenant-a'},intelligence:{
  tenantId:'tenant-a',
  signals:[signal('risk','CYBER_RISK'),signal('opp','OPPORTUNITY'),signal('news','LEGAL_CHANGE')],
  companyImpacts:[impact('risk'),impact('opp'),impact('news'),impact('cross','tenant-b')],
  actionCandidates:[action('risk'),action('opp'),action('news'),action('cross','tenant-b')],
  sourceCatalog:[{availability_state:'OBSERVED'}]
}});
test('classifications are labels, not numerical prediction',()=>{
 assert.equal(classifyTenantForesightSignal(signal('r','CYBER_RISK')),'risk');
 assert.equal(classifyTenantForesightSignal(signal('o','OPPORTUNITY')),'opportunity');
 assert.equal(classifyTenantForesightSignal(signal('d','LEGAL_CHANGE')),'development');
});
test('filter only tenant-scored signals and their own action proposals',()=>{
 for(const [kind,key] of [['risk','risk'],['opportunity','opp'],['development','news']]){
  const r=buildTenantForesightEvidence(packet(),{kind,now});
  assert.equal(r.state,'TENANT_AUTHENTICATED');
  assert.deepEqual(r.impacts.map(x=>x.id),['impact:'+key]);
  assert.deepEqual(r.actions.map(x=>x.title),['Review '+key]);
  assert.ok(r.impacts.every(x=>x.score===72));
  assert.ok(r.impacts.every(x=>!('probability' in x)&&!('revenue' in x)));
 }
});
test('all selection preserves per-tenant impacts without cross-customer content',()=>{
 const r=buildTenantForesightEvidence(packet(),{now});
 assert.deepEqual(r.impacts.map(x=>x.id).sort(),['impact:news','impact:opp','impact:risk']);
 assert.equal(r.actions.length,3);
 assert.ok(!JSON.stringify(r).includes('tenant-b'));
});
test('tenant identity mismatch fails closed, even with matching signal arrays',()=>{
 for(const patch of [
  {scope:{authenticatedTenant:'tenant-b'}},
  {intelligence:{...packet().intelligence,tenantId:'tenant-b'}}
 ]){
  const r=buildTenantForesightEvidence({...packet(),...patch},{kind:'risk',now});
  assert.equal(r.state,'TENANT_PROOF_MISSING');
  assert.equal(r.impacts.length,0);
 }
});
test('old, future or incomplete evidence cannot enter interactive source panel',()=>{
 const p=packet();
 p.intelligence.companyImpacts=[
  impact('risk'),
  {...impact('opp'),observed_at:'2025-10-01T00:00:00Z'},
  {...impact('news'),observed_at:'2027-01-01T00:00:00Z'}
 ];
 const r=buildTenantForesightEvidence(p,{now});
 assert.deepEqual(r.impacts.map(x=>x.id),['impact:risk']);
});
test('filter and refresh affordances appear without claiming a forecast or working provider',()=>{
 const r=buildTenantForesightEvidence(packet(),{kind:'risk',now});
 const html=renderTenantForesightEvidence(r,{kind:'risk',status:'ready'});
 assert.ok(html.includes('data-pfs-evidence-filter'));
 assert.ok(html.includes('data-pfs-evidence-refresh'));
 assert.ok(html.includes('value="risk" selected'));
 assert.ok(!html.includes('gevalideerde prognose'));
 const missing=renderTenantForesightEvidence(null,{status:'unavailable'});
 assert.ok(missing.includes('data-pfs-evidence-refresh'));
 assert.ok(missing.includes('niet beschikbaar'));
});
