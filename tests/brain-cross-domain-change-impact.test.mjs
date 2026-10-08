import test from 'node:test';
import assert from 'node:assert/strict';
import {planCrossDomainChange,assertCrossDomainChangeReady} from '../platform/regulatory/cross-domain-change-impact.mjs';
const change={tenantId:'tenant-a',changeId:'chg-1',kind:'AI_MODEL',actor:'owner',before:{model:'old'},after:{model:'new'},evidenceIds:['proof-1'],occurredAt:'2026-10-08T12:00:00Z'};
test('model change cascades into organism and CSRD/ESRS scope review but never invents emissions',()=>{
 const result=planCrossDomainChange(change);
 assert.equal(result.status,'REVIEW_REQUIRED');
 assert.ok(result.affectedDomains.includes('sustainability'));
 assert.ok(result.affectedDomains.includes('csrd_esrs_scope'));
 assert.ok(result.propagation);
 assert.ok(result.esrsReview.some(x=>x.standard==='ESRS_E1'&&x.materiality==='UNDETERMINED'&&x.measuredImpact===null));
 assert.equal(result.deploymentApproved,false);
 assert.throws(()=>assertCrossDomainChangeReady(result),{code:'CROSS_DOMAIN_REVIEW_INCOMPLETE'});
});
test('connector change schedules supplier, privacy and ESRS review',()=>{
 const result=planCrossDomainChange({...change,kind:'CONNECTOR'});
 assert.ok(result.esrsReview.some(x=>x.standard==='ESRS_G1'));
 assert.ok(result.affectedDomains.includes('supplier_risk'));
});
test('same value does not trigger a new review',()=>{
 const result=planCrossDomainChange({...change,after:change.before});
 assert.equal(result.changed,false);
 assert.equal(result.esrsReview.length,0);
 assert.equal(assertCrossDomainChangeReady(result),true);
});
test('tenant and unsupported events are rejected',()=>{
 assert.throws(()=>planCrossDomainChange({...change,tenantId:''}));
 assert.throws(()=>planCrossDomainChange({...change,kind:'UNKNOWN'}));
});
