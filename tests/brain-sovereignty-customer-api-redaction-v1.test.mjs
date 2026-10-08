import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {customerSovereigntyReadback} from '../platform/read-models/sovereignty-public-readback.mjs';
test('customer sees only audit-safe review fields; tenant actor and before/after remain server-side',()=>{
 const input={snapshot:{tenantId:'tenant-a',generatedAt:'2026-10-08T12:00:00Z',policy:{
  tenant_id:'tenant-a',mode:'EU_ONLY',updated_by:'private-account@example.test',
  last_change_impact:{
   contract:'powerhouse-cross-domain-change-v1',status:'REVIEW_REQUIRED',kind:'AI_MODEL',
   tenantId:'tenant-a',changeId:'private-obligation',actor:'private-identity',
   before:{modelId:'old-confidential'},after:{modelId:'new-confidential'},
   evidenceIds:['internal-evidence-123'],propagation:{private:'server'},
   esrsReview:[{standard:'ESRS_E1',reviewRequired:true,materiality:'UNDETERMINED',applicability:'UNDETERMINED',measuredImpact:null,evidenceIds:['internal-evidence-123']}]
  }
 }}};
 const output=customerSovereigntyReadback(input);
 assert.equal(output.snapshot.tenantId,'tenant-a');
 assert.equal(output.snapshot.policy.mode,'EU_ONLY');
 assert.equal(output.snapshot.policy.last_change_impact.status,'REVIEW_REQUIRED');
 assert.equal(output.snapshot.policy.last_change_impact.esrsReview[0].standard,'ESRS_E1');
 for(const leak of ['private-account','private-identity','private-obligation','old-confidential','new-confidential','internal-evidence','server']){
  assert.equal(JSON.stringify(output).includes(leak),false,leak);
 }
 assert.equal(input.snapshot.policy.last_change_impact.actor,'private-identity','audit record remains untouched');
});
test('unsupported or nonreview status never becomes a false compliance approval',()=>{
 const input={snapshot:{policy:{last_change_impact:{
  contract:'powerhouse-cross-domain-change-v1',kind:'AI_MODEL',status:'APPROVED',
  esrsReview:[{standard:'UNKNOWN<SCRIPT>',applicability:'COMPLIANT',measuredImpact:42}]
 }}}};
 const output=customerSovereigntyReadback(input).snapshot.policy.last_change_impact;
 assert.equal(output.status,'UNKNOWN');
 assert.deepEqual(output.esrsReview,[]);
 assert.equal(JSON.stringify(output).includes('COMPLIANT'),false);
});
test('Netlify customer GET and POST project sovereign response but admin-only readback stays internal',async()=>{
 const source=await readFile(new URL('../netlify/functions/data-sovereignty.mjs',import.meta.url),'utf8');
 assert.match(source,/customerSovereigntyReadback/);
 assert.match(source,/wantsCanonical\?result:customerSovereigntyReadback\(result\)/);
 assert.match(source,/return json\(customerSovereigntyReadback\(result\)\)/);
});
