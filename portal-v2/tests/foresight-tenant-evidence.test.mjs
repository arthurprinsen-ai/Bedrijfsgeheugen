import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTenantForesightEvidence,renderTenantForesightEvidence} from '../foresight-tenant-evidence.js';

const now=Date.parse('2026-10-15T19:00:00Z');
const packet={
  scope:{authenticatedTenant:'tenant-a'},
  intelligence:{
    tenantId:'tenant-a',
    sourceCatalog:[{availability_state:'CATALOGUED'},{availability_state:'OBSERVED'},{availability_state:'CONNECTED'}],
    signals:[
      {signal_key:'sales',status:'CURRENT',source_key:'crm-index',domain_key:'SALES',title:'Klantvraag stijgt',observed_at:'2026-10-13T08:00:00Z',evidence:{ref:'SRC-1'}},
      {signal_key:'cyber',status:'CURRENT',source_key:'security-index',domain_key:'SECURITY',title:'Ransomwaremaatregelen',observed_at:'2026-10-13T08:00:00Z',evidence:{ref:'SRC-2'}},
      {signal_key:'external',status:'CURRENT',domain_key:'FINANCE',title:'Macrotrend zonder bedrijfsimpact',observed_at:'2026-10-13T08:00:00Z'}
    ],
    companyImpacts:[
      {tenant_id:'tenant-a',impact_key:'imp-1',signal_key:'sales',status:'SCORED',impact_score:70,target_label:'Commercie',impact_dimensions:['sales'],rationale:'Klantgebonden analyse',observed_at:'2026-10-14T08:00:00Z',evidence:{ref:'IMP-1'}},
      {tenant_id:'tenant-a',impact_key:'imp-2',signal_key:'cyber',status:'SCORED',impact_score:90,target_label:'Security',impact_dimensions:['compliance'],rationale:'Beveiligingsanalyse',observed_at:'2026-10-14T08:00:00Z',evidence:{ref:'IMP-2'}},
      {tenant_id:'canonical',impact_key:'leak',signal_key:'sales',status:'SCORED',impact_score:100,target_label:'Andere klant',observed_at:'2026-10-14T08:00:00Z',evidence:{ref:'IMP-x'}},
      {tenant_id:'tenant-a',impact_key:'stale',signal_key:'cyber',status:'SCORED',impact_score:100,observed_at:'2025-01-01T08:00:00Z'}
    ],
    actionCandidates:[
      {tenant_id:'tenant-a',tenant_specific:true,signal_key:'sales',status:'READY',title:'Verbeter leadopvolging',evidence:{ref:'A1'}},
      {tenant_id:'canonical',tenant_specific:false,signal_key:'sales',status:'READY',title:'Niet-klantgebonden actie'},
      {tenant_id:'tenant-b',tenant_specific:true,signal_key:'cyber',status:'MATERIALIZED',title:'Andere klant actie'}
    ]
  }
};
test('fails closed without authenticated tenant matching the gateway intelligence packet',()=>{
 for(const value of [null,{}, {scope:{authenticatedTenant:'tenant-b'},intelligence:packet.intelligence}]){
   const row=buildTenantForesightEvidence(value,{now});
   assert.equal(row.state,'TENANT_PROOF_MISSING');
   assert.deepEqual(row.impacts,[]);
 }
});
test('scoped, recent, scored customer impacts only and cannot promote other-tenant data',()=>{
 const r=buildTenantForesightEvidence(packet,{metric:'revenue_growth',now});
 assert.equal(r.state,'TENANT_AUTHENTICATED');
 assert.deepEqual(r.impacts.map(x=>x.id),['imp-1','imp-2']);
 assert.equal(r.impacts[0].score,70);
 assert.equal(r.impacts[0].matched,true);
 assert.equal(r.impacts[0].evidenceLinked,true);
 assert.deepEqual(r.actions.map(x=>x.title),['Verbeter leadopvolging']);
 assert.equal(r.sourceStats.known,3);
 assert.equal(r.sourceStats.observed,2);
 assert.equal(r.heartbeat,'NOT_EVIDENCED');
});
test('source evidence does not become validated causal financial effect or forecast',()=>{
 const r=buildTenantForesightEvidence(packet,{metric:'profit',now});
 assert.equal(r.impacts.length,2);
 assert.ok(r.note.includes('geen causale invoer'));
 assert.ok(!r.impacts.some(x=>Object.hasOwn(x,'estimated_value_eur')));
 assert.equal(r.external[0].title,'Macrotrend zonder bedrijfsimpact');
});
test('missing supporting source evidence is not silently represented as verified',()=>{
 const x=structuredClone(packet);
 x.intelligence.signals[0].evidence=null;
 const r=buildTenantForesightEvidence(x,{metric:'revenue_growth',now});
 assert.equal(r.impacts[0].evidenceLinked,false);
});
test('rendering escapes malicious text from provider strings',()=>{
 const x=structuredClone(packet);
 x.intelligence.companyImpacts[0].rationale='<script>alert(1)</script>';
 const ctx=buildTenantForesightEvidence(x,{metric:'revenue_growth',now});
 const output=renderTenantForesightEvidence(ctx,{status:'ready'});
 assert.ok(output.includes('&lt;script&gt;'));
 assert.ok(!output.includes('<script>'));
});
test('failed/unauthenticated data gives explicit empty state, not fabricated signals',()=>{
 assert.match(renderTenantForesightEvidence(null,{status:'unavailable'}),/niet beschikbaar/);
 assert.match(renderTenantForesightEvidence(null,{status:'loading'}),/gecontroleerd/);
});
