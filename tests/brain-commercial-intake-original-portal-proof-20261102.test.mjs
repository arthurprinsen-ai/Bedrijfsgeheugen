import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 COMMERCIAL_INTAKE_PROOF_CONTRACT,COMMERCIAL_INTAKE_FINGERPRINT,COMMERCIAL_MIGRATION_FINGERPRINT,
 summarizeCommercialIntakeProof,loadCommercialIntakeProof
} from '../brain/observability/commercial-intake-proof-readback.mjs';

const original=()=>[
 {fingerprint:COMMERCIAL_INTAKE_FINGERPRINT,maturity:'VALIDATED',
  evidence:{production_readback:{
   source_migrations_applied:true,scan_insert_or_tenant_claim_update:true,
   offer_verified_proposal_zero_revenue:true,signature_is_paid_order:false,
   anon_execute:false,authenticated_execute:false,
   source_migration_version:'20261102074013',acl_finalizer_version:'20261102075243',
   actual_authorized_claim_observed:false,verified_paid_customer_proven:false
  }}},
 {fingerprint:COMMERCIAL_MIGRATION_FINGERPRINT,maturity:'VALIDATED',
  evidence:{provider_history_mirror_applied:true,native_migrations_verified:[
   '20261031133000','20261031135451','20261102074013','20261102075243'
  ]}}
];

test('original provider-traced source migration and ACL readback make SOURCE live, never revenue green',()=>{
 const r=summarizeCommercialIntakeProof(original(),'2026-11-02T08:30:00Z');
 assert.equal(r.contract,COMMERCIAL_INTAKE_PROOF_CONTRACT);
 assert.equal(r.status,'SOURCE_LIVE_CUSTOMER_OUTCOME_PENDING');
 assert.equal(r.sourceLive,true);
 assert.equal(r.paymentProven,false);
 assert.equal(r.authorizedClaimProven,false);
 assert.equal(r.recurrenceFreeProven,false);
 assert.equal(r.issueUrl,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198');
});

test('fake paid order evidence flag, signed quote, source label or status alone never green payment',()=>{
 const rows=original();
 rows[0].evidence.production_readback.verified_paid_customer_proven=true;
 rows[0].evidence.production_readback.actual_authorized_claim_observed=true;
 const r=summarizeCommercialIntakeProof(rows);
 assert.equal(r.sourceLive,true);
 assert.equal(r.authorizedClaimProven,true);
 assert.equal(r.paymentProven,false,'independent paid provider evidence is unavailable in this incident readback');
});

test('missing ACL, identity-claim trigger, proposal-only guard, migration ledger or duplicate row fails closed',()=>{
 const cases=[
 [original()[0]],original().map(r=>({...r,maturity:'OBSERVED'})),
 original().map(r=>({...r,evidence:{}})),
 ];
 for(const rows of cases)assert.equal(summarizeCommercialIntakeProof(rows).status,'UNVERIFIED');
 for(const [index,key,value] of [
  [0,'anon_execute',true],[0,'authenticated_execute',true],
  [0,'scan_insert_or_tenant_claim_update',false],
  [0,'signature_is_paid_order',true],[0,'source_migrations_applied',false],
  [0,'offer_verified_proposal_zero_revenue',false],
  [0,'acl_finalizer_version','20261102075244']
 ]){
  const rows=original();rows[index].evidence.production_readback[key]=value;
  assert.equal(summarizeCommercialIntakeProof(rows).sourceLive,false,key);
 }
 const missing=original();
 missing[1].evidence.native_migrations_verified=['20261031135451'];
 assert.equal(summarizeCommercialIntakeProof(missing).sourceLive,false);
 assert.equal(summarizeCommercialIntakeProof([...original(),...original()]).sourceLive,false);
});

test('read-only admin loader queries original exact fingerprints only, no client identifiers',async()=>{
 const calls=[];
 const fetchImpl=async(url,opts)=>{
  calls.push({url,method:opts.method,auth:opts.headers.authorization});
  const rows=original();
  const match=rows.find(row=>url.includes(encodeURIComponent(row.fingerprint)));
  return {ok:true,json:async()=>[match]};
 };
 const r=await loadCommercialIntakeProof({baseUrl:'https://example.supabase.co/',key:'service-only-key',fetchImpl});
 assert.equal(r.sourceLive,true);
 assert.equal(calls.length,2);
 assert.ok(calls.every(x=>x.method==='GET'&&x.auth==='Bearer service-only-key'));
 assert.ok(calls.every(x=>x.url.includes('/rest/v1/brain_failure_registry?select=fingerprint,maturity,evidence&fingerprint=eq.')));
 assert.ok(calls.every(x=>!x.url.includes('service-only-key')));
});

test('provider failure/disabled service token are UNKNOWN, never zero or paid',async()=>{
 assert.equal((await loadCommercialIntakeProof({baseUrl:'',key:''})).status,'UNVERIFIED');
 const r=await loadCommercialIntakeProof({baseUrl:'https://example.supabase.co',key:'secret',fetchImpl:async()=>({ok:false,status:403})});
 assert.equal(r.status,'UNVERIFIED');assert.equal(r.paymentProven,false);
});

test('commercial source proof stays admin-only and is reused by existing portal; no second executable pipeline',async()=>{
 const api=await readFile(new URL('../netlify/functions/powerhouse-observability.mjs',import.meta.url),'utf8');
 const portal=await readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8');
 const model=await readFile(new URL('../brain/observability/commercial-intake-proof-readback.mjs',import.meta.url),'utf8');
 const guardIndex=api.indexOf('if(!isPowerhouseAdmin(user,');
 const loadIndex=api.indexOf('const [supabaseInventory,releaseEvidence,experimentChanges,');
 assert.ok(guardIndex>0&&loadIndex>guardIndex);
 assert.match(api,/loadCommercialIntakeProof/);
 assert.match(api,/commercialIntakeProof,publicationEvidence/);
 assert.match(portal,/data-commercial-intake-proof/);
 assert.match(portal,/SOURCE_LIVE_CUSTOMER_OUTCOME_PENDING/);
 assert.match(portal,/Oorspronkelijk commercieel incident #4198/);
 assert.match(portal,/getekende offerte|ondertekend/i);
 assert.doesNotMatch(model,/localStorage|setInterval|cron\.|create table|insert into/i);
 assert.ok(!api.includes('SUPABASE_SERVICE_ROLE_KEY'+'\n    return reply('));
});
