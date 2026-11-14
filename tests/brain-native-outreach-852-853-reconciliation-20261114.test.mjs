import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyProvider852853OutreachReconciliation,OUTREACH_BASE_SHA,RESTORED_852,APPLIED_853,PROPOSED_854} from '../tools/ci/verified-provider-852-853-outreach-reconciliation.mjs';

const read=(relative)=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const headLock=JSON.parse(read('supabase/migration-history.lock.json'));
const baseLock={...headLock,applied:headLock.applied.slice(0,851),captured_at:'2026-11-13T18:20:40.710020Z'};
const changedMigrations=[
 {status:'A',file:RESTORED_852},
 {status:'A',file:PROPOSED_854}
];
const params={
 baseSha:OUTREACH_BASE_SHA,changedMigrations,
 baseLock,headLock,
 originalSQL:read(APPLIED_853),
 restored852SQL:read(RESTORED_852),
 hotfixSQL:read(PROPOSED_854)
};
test('real native 852/853 provider source identities reconcile exact original 851 without inventing send success',()=>{
 const x=verifyProvider852853OutreachReconciliation(params);
 assert.equal(x.ok,true,x.reason);
 assert.equal(x.providerApplied854,false);
 assert.equal(x.permissionToSendMail,false);
 assert.equal(x.appliedBefore,851);
 assert.equal(x.originalProviderAppliedNow,853);
 assert.equal(x.hostedPreviewRequired,true);
});
test('rejects any invented provider identity, reordered historical migration or unauthorized other file',()=>{
 assert.equal(verifyProvider852853OutreachReconciliation({...params,baseSha:'0'.repeat(40)}).ok,false);
 assert.equal(verifyProvider852853OutreachReconciliation({...params,changedMigrations:[...changedMigrations,{status:'A',file:'supabase/migrations/20261114092000_fake.sql'}]}).ok,false);
 const changed={...headLock,applied:headLock.applied.map((r,i)=>i===852?{...r,name:'unauthorized'}:r)};
 assert.equal(verifyProvider852853OutreachReconciliation({...params,headLock:changed}).ok,false);
});
test('rejects SQL tampering, missing non-send safeguards and source text drift',()=>{
 assert.equal(verifyProvider852853OutreachReconciliation({...params,restored852SQL:params.restored852SQL+'\n'}).ok,false);
 assert.equal(verifyProvider852853OutreachReconciliation({...params,hotfixSQL:params.hotfixSQL.replace("'external_side_effect_allowed',false","'external_side_effect_allowed',true")}).ok,false);
 assert.equal(verifyProvider852853OutreachReconciliation({...params,hotfixSQL:params.hotfixSQL+'\nnet.http_post();'}).ok,false);
});
test('original protected migration stays immutable, new 854 retains original sender and quality gates',()=>{
 assert.equal(params.originalSQL,params.restored852SQL);
 assert.match(params.hotfixSQL,/relationship-research:approved-source:%/);
 assert.match(params.hotfixSQL,/relationship-research:outreach-source:%/);
 assert.match(params.hotfixSQL,/public_research_execution,researched_at/);
 assert.doesNotMatch(params.hotfixSQL,/\bcron\.schedule\b|\bnet\.http_post\b/i);
});
