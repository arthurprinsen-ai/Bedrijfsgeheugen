import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCustomerSecurityTrustResponse} from '../netlify/functions/_security-trust-customer-projection.mjs';
const original={snapshot:{
 generatedAt:'2026-11-02T15:00:00Z',
 summary:{postureStatus:'EVIDENCE_PARTIAL',evidenceCoverage:92,highRiskFindingCount:1,privateInvestigation:'do-not-expose'},
 findings:[{severity:'HIGH',title:'exploit path',detail:'secret-route',tenant_secret:'redacted'}],
 managementObservations:[{provider_key:'SUPABASE',control_key:'RLS',status:'PARTIAL',evidence_available:true,
 observed_at:'2026-11-02T14:00:00Z',expires_at:'2026-11-03T14:00:00Z',source:'private-log',evidence:{secret:'do-not-expose'},provider_record_id:'private-provider-id'}],
 providerAssurance:[{providerKey:'Provider A',assuranceScope:'scoped',evidenceStatus:'PARTIAL',notes:'general public guidance',evidenceUrls:['https://example.com/provider']}],
 frameworks:[{frameworkKey:'NIS2',label:'NIS2',applicability:'UNVERIFIED',notes:'scope pending'}],
 database:{privilegedFunctionNames:['private internal function'],highRiskCount:1},
 internalDiagnostic:{secret:'do-not-expose'}
}};
test('server redacts every unapproved trust field before returning customer data',()=>{
 const res=projectCustomerSecurityTrustResponse(original);
 assert.equal(res.snapshot.summary.evidenceCoverage,92);
 assert.equal(res.snapshot.findings.length,1);
 assert.deepEqual(res.snapshot.findings[0],{severity:'HIGH'});
 assert.equal(res.snapshot.managementObservations[0].status,'PARTIAL');
 assert.equal(res.snapshot.managementObservations[0].expires_at,'2026-11-03T14:00:00Z');
 assert.equal(res.snapshot.database,undefined);
 const text=JSON.stringify(res);
 for(const value of ['secret-route','do-not-expose','private-provider-id','private-log','private internal function','privateInvestigation'])assert.equal(text.includes(value),false,value);
});
test('invalid or absent customer source never falls back to full unredacted response',()=>{
 for(const value of [{},{snapshot:[]},{snapshot:'x'},{snapshot:null}])assert.throws(()=>projectCustomerSecurityTrustResponse(value),/INVALID_SECURITY_SNAPSHOT/);
});
test('original Netlify auth and tenant check precede server-safe response; no extra public endpoint',()=>{
 const source=readFileSync('netlify/functions/security-trust.mjs','utf8');
 assert.match(source,/getUser\(request\)/);
 assert.match(source,/resolveIdentityTenant\(user\)/);
 assert.match(source,/if\(wantsCanonical&&!admin\)/);
 assert.match(source,/return json\(admin\?response:projectCustomerSecurityTrustResponse\(response\)\)/);
 assert.match(source,/config=\{path:'\/api\/security-trust'\}/);
});
