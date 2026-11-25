import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('tenant change reads exactly its canonical Brain obligation instead of listing all reviews',async()=>{
 const edge=await read('supabase/functions/portal-state-eu/index.ts');
 const section=edge.slice(edge.indexOf("if(action==='data_sovereignty_get')"),edge.indexOf("if(action==='data_sovereignty_policy_set')"));
 assert.ok(section.length>500,'readback section exists');
 assert.match(section,/refresh_data_sovereignty_snapshot_v1/);
 assert.match(section,/last_change_impact/);
 assert.match(section,/\.from\('brain_obligations'\)/);
 assert.match(section,/\.eq\('change_id',expectedChangeId\)/);
 assert.match(section,/\.eq\('business_entity','tenant:'\+tenantId\+':policy-v'\+version\)/);
 assert.match(section,/\.eq\('obligation_type','CROSS_DOMAIN_REVIEW'\)/);
 assert.match(section,/\.eq\('capability_id','powerhouse-cross-domain-impact-v1'\)/);
 assert.doesNotMatch(section,/\.like\(|\.ilike\(/,'no wildcard tenant lookups');
});

test('Brain review is exposed only as a safe status, never a claim of CSRD compliance or AI activation',async()=>{
 const edge=await read('supabase/functions/portal-state-eu/index.ts');
 const section=edge.slice(edge.indexOf("if(action==='data_sovereignty_get')"),edge.indexOf("if(action==='data_sovereignty_policy_set')"));
 assert.match(section,/\.select\('state,updated_at'\)/);
 assert.match(section,/evidenceRequired:true,verifiedOutcome:false/);
 assert.match(section,/aiRuntimeApproved:false,csrdApplicability:'UNDETERMINED'/);
 assert.match(section,/status:'UNVERIFIED'/);
 assert.match(section,/status:state,updatedAt/);
 assert.doesNotMatch(section,/\.select\('\*'\)/);
 assert.doesNotMatch(section,/JSON\.stringify\(obligation\)/);
});
test('last material obligation remains addressable after unchanged policy version increments',async()=>{
 const edge=await read('supabase/functions/portal-state-eu/index.ts');
 const section=edge.slice(edge.indexOf("if(action==='data_sovereignty_get')"),edge.indexOf("if(action==='data_sovereignty_policy_set')"));
 assert.match(section,/version>currentVersion/);
 assert.match(section,/impact\.changeId\.startsWith\(prefix\)/);
 assert.match(section,/\^\[1-9\]\[0-9\]\*\$/);
 assert.doesNotMatch(section,/version!==currentVersion/);
});
