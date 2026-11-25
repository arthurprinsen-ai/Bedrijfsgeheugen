import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sql=()=>readFile(new URL('../supabase/migrations/20261008162500_sovereignty_brain_review_obligations_v1.sql',import.meta.url),'utf8');
test('sovereignty impact opens one canonical Brain obligation with stable tenant-scoped identity',async()=>{
  const s=await sql();
  assert.match(s,/after insert on public\.tenant_data_sovereignty_change_impact_v1/i);
  assert.match(s,/insert into public\.brain_obligations\s*\(/i);
  assert.match(s,/'CROSS_DOMAIN_REVIEW'/);
  assert.match(s,/'powerhouse-cross-domain-impact-v1'/);
  assert.match(s,/'tenant:'\|\|new\.tenant_id\|\|':policy-v'\|\|new\.policy_version/);
  assert.match(s,/new\.change_id/);
  assert.match(s,/on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)\s*do nothing/i);
});
test('no phantom evidence or CSRD verdict; review remains pending and runtime blocked',async()=>{
  const s=await sql();
  assert.match(s,/'review_outcome','PENDING_EVIDENCE'/);
  assert.match(s,/'applicability','UNDETERMINED'/);
  assert.match(s,/'runtime_activation_authorized',false/);
  assert.match(s,/'TENANT_GOVERNANCE',\s*'OPEN'/);
  assert.doesNotMatch(s,/\b(FULFILLED|PROVEN|COMPLIANT)\b/);
});
test('tenant impact attestation is validated before queue insert and function is not executable by public',async()=>{
  const s=await sql();
  for(const field of ['contract','status','tenantId','changeId','deploymentApproved','affectedDomains','esrsReview'])assert.ok(s.includes(field),field);
  assert.match(s,/raise exception 'INVALID_SOVEREIGNTY_BRAIN_OBLIGATION'/);
  assert.match(s,/security definer/);
  assert.match(s,/revoke all on function public\.powerhouse_sovereignty_impact_obligation_v1\(\) from public, anon, authenticated/i);
  assert.doesNotMatch(s,/grant .* to (anon|authenticated)/i);
});
test('migration replays existing ledger events idempotently without closing reviews or starting a separate agent',async()=>{
 const s=await sql();
 assert.match(s,/from public\.tenant_data_sovereignty_change_impact_v1 i/);
 assert.match(s,/i\.assessment->>'tenantId'=i\.tenant_id/);
 assert.match(s,/on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)\s*do nothing/i);
 assert.doesNotMatch(s,/create table/i);
 assert.doesNotMatch(s,/update public\.brain_obligations/i);
});
