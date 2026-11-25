import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planCrossDomainChange} from '../platform/regulatory/cross-domain-change-impact.mjs';
import {buildCrossDomainReviewPortfolio} from '../platform/regulatory/cross-domain-review-portfolio.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const impact=planCrossDomainChange({
  tenantId:'tenant-a',changeId:'private-001',kind:'AI_DEPLOYMENT',actor:'private-reviewer',
  before:{provider:'ANTHROPIC',model:'original'},after:{provider:'MISTRAL_API',model:'new'},
  evidenceIds:['secret-external-evidence'],occurredAt:'2026-10-08T14:00:00.000Z'
});
test('canonical change creates a bounded review portfolio across all affected domains',()=>{
 const p=buildCrossDomainReviewPortfolio(impact,{tenantId:'tenant-a'});
 assert.equal(p.contract,'powerhouse-review-portfolio-v1');
 assert.equal(p.status,'REVIEW_REQUIRED');
 assert.equal(p.tasks.length,impact.affectedDomains.length);
 assert.ok(p.tasks.some(x=>x.domain==='privacy'));
 assert.ok(p.tasks.some(x=>x.domain==='finance'));
 const esrs=p.tasks.find(x=>x.domain==='csrd_esrs_scope');
 assert.equal(esrs.applicability,'UNDETERMINED');
 assert.equal(esrs.materiality,'UNDETERMINED');
 assert.equal(esrs.measuredEmissions,null);
 assert.ok(esrs.candidateEsrs.includes('ESRS_E1'));
 assert.ok(p.tasks.every(t=>t.status==='NEEDS_EVIDENCE'&&t.evidenceVerified===false));
 const serialized=JSON.stringify(p);
 assert.doesNotMatch(serialized,/private-001|private-reviewer|secret-external-evidence|original/);
});
test('tenant isolation denies a foreign customer impact',()=>{
 assert.throws(()=>buildCrossDomainReviewPortfolio(impact,{tenantId:'tenant-b'}),{code:'CROSS_DOMAIN_TENANT_MISMATCH'});
});
test('unverified ESRS content is filtered and never converted to a legal conclusion',()=>{
 const tampered={...impact,esrsReview:[{standard:'<script>bad</script>',reviewRequired:true,materiality:'UNDETERMINED',applicability:'UNDETERMINED'},...impact.esrsReview]};
 const p=buildCrossDomainReviewPortfolio(tampered,{tenantId:'tenant-a'});
 assert.ok(!JSON.stringify(p).includes('<script>'));
 assert.equal(p.tasks.find(x=>x.domain==='csrd_esrs_scope').measuredEmissions,null);
});
test('absent impact does not manufacture recommendations',()=>{
 assert.deepEqual(buildCrossDomainReviewPortfolio(null,{tenantId:'tenant-a'}).tasks,[]);
});
test('customer API exposes only the tenant-scoped projection on both policy read and write',async()=>{
 const api=await read('netlify/functions/data-sovereignty.mjs');
 assert.match(api,/buildCrossDomainReviewPortfolio/);
 assert.match(api,/withImpactTasks\(await client\.get\(tenantId\),tenantId\)/);
 assert.match(api,/withImpactTasks\(await client\.setPolicy\(ownTenant,/);
 assert.match(api,/resolveIdentityTenant\(user\)/);
});
