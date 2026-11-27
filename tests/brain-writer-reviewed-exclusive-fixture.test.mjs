import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewExclusiveFixtureTranscript as review} from '../tools/delivery/reviewed-exclusive-fixture.mjs';
const names=['ordinary_pr_merge','admin_pr_merge','other_app_pr_merge','ordinary_direct_push','dedicated_app_direct_push','preexisting_auto_merge','dedicated_app_failed_ci','dedicated_app_stale_head','dedicated_app_stale_base','dedicated_app_green_pr','restore_baseline'];
const h='a'.repeat(40),m='b'.repeat(40),p='c'.repeat(64),b='d'.repeat(64);
const valid=()=>({fixtureRepositoryId:123,fixtureRepository:'test-owner/disposable',appId:5916428,ruleId:456,proposalDigest:p,baselineDigest:b,observations:names.map((scenario,i)=>({scenario,repositoryId:123,ruleId:456,proposalDigest:p,outcome:i===9?'merged':i===10?'restored':'denied',before:h,after:i===9?m:h,receiptDigest:(i+1).toString(16).padStart(64,'0'),attemptId:'attempt-'+i,...(i===9?{actorAppId:5916428,ciConclusion:'success',expectedMerge:m}:i===10?{restoredBaselineDigest:b}:{})}))});
const check=(r)=>{assert.equal(r.providerEnforced,false);assert.equal(r.mutationAuthority,false);assert.equal(r.activationAuthorized,false)};
test('complete synthetic shape never attests provenance or authority',()=>{const r=review(JSON.stringify(valid()));check(r);assert.equal(r.state,'FIXTURE_TRANSCRIPT_SHAPE_COMPLETE_PROVENANCE_REQUIRED')});
const cases={
 'production repository ID':t=>t.fixtureRepositoryId=1303700955,
 'production repository name':t=>t.fixtureRepository='ArthurPrinsen-AI/Bedrijfsgeheugen',
 'wrong app':t=>t.appId=15368,
 'bad rule ID':t=>t.ruleId=0,
 'bad proposal hash':t=>t.proposalDigest='x',
 'missing scenario':t=>t.observations.pop(),
 'duplicate scenario':t=>t.observations[1].scenario=t.observations[0].scenario,
 'duplicate receipt':t=>t.observations[1].receiptDigest=t.observations[0].receiptDigest,
 'duplicate attempt':t=>t.observations[1].attemptId=t.observations[0].attemptId,
 'wrong fixture ID':t=>t.observations[0].repositoryId=999,
 'wrong rule ID':t=>t.observations[0].ruleId=999,
 'wrong proposal':t=>t.observations[0].proposalDigest=b,
 'unexpected outcome':t=>t.observations[0].outcome='merged',
 'denied ref moved':t=>t.observations[0].after=m,
 'positive ref unchanged':t=>t.observations[9].after=h,
 'wrong positive actor':t=>t.observations[9].actorAppId=15368,
 'positive CI failed':t=>t.observations[9].ciConclusion='failure',
 'wrong expected merge':t=>t.observations[9].expectedMerge=h,
 'bad restored baseline':t=>t.observations[10].restoredBaselineDigest=p,
 'rollback ref moved':t=>t.observations[10].after=m,
 'bad SHA':t=>t.observations[0].before='x',
 'bad receipt':t=>t.observations[0].receiptDigest='x'
};for(const [name,mutate] of Object.entries(cases))test(name,()=>{const t=valid();mutate(t);const r=review(JSON.stringify(t));check(r);assert.notEqual(r.state,'FIXTURE_TRANSCRIPT_SHAPE_COMPLETE_PROVENANCE_REQUIRED')});
for(const v of [null,{},'null','{','[]','x'.repeat(65537)])test('invalid '+String(v).slice(0,12),()=>{const r=review(v);check(r);assert.notEqual(r.state,'FIXTURE_TRANSCRIPT_SHAPE_COMPLETE_PROVENANCE_REQUIRED')});
