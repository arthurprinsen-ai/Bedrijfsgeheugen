import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectVerifiedBrandLearnings} from '../supabase/functions/_shared/verified-brand-content-learnings.mjs';
const now=new Date('2026-10-24T09:00:00Z');
const sample={tenant_id:'bedrijfsgeheugen',learning_id:'observed-hook',component_scope:'social_components',status:'PROVEN',
 effect_metric:'comment_rate',sample_size:8,confidence:0.87,effect_size:0.23,
 evidence_refs:['evaluation:branded-post:24'],claim:'A concrete operational example correlated with more substantive discussion',
 last_validated_at:'2026-10-20T09:00:00Z',expires_or_review_at:'2026-11-20T09:00:00Z'};
test('verified same-tenant recent learning can inform one reversible next brand publication',()=>{
 const a=selectVerifiedBrandLearnings([sample],{now});
 assert.equal(a.length,1);
 assert.equal(a[0].metric,'comment_rate');
 assert.equal(a[0].status,'VERIFIED_TENANT_SCOPED_PATTERN_NOT_A_GUARANTEE');
 assert.equal(a[0].comparison_sample_size,8);
});
test('rejects stale, wrong tenant, sparse, expired, negative, unsupported and no-evidence learnings',()=>{
 const variants=[
 {...sample,tenant_id:'canonical'},{...sample,status:'CANDIDATE'},
 {...sample,sample_size:2},{...sample,confidence:.2},
 {...sample,effect_size:-.5},{...sample,effect_metric:'followers_fake'},
 {...sample,last_validated_at:'2026-09-01T09:00:00Z'},
 {...sample,expires_or_review_at:'2026-10-01T09:00:00Z'},
 {...sample,evidence_refs:[]},{...sample,learning_id:''}
 ];
 for(const x of variants)assert.deepEqual(selectVerifiedBrandLearnings([x],{now}),[]);
});
test('deduplicates, sorts and bounds source evidence',()=>{
 const r=selectVerifiedBrandLearnings([{...sample,learning_id:'L1'},{...sample,learning_id:'L1'},{...sample,learning_id:'L2',confidence:.95}],{now,max:1});
 assert.equal(r.length,1);assert.equal(r[0].learning_id,'L2');
});
test('production generator consumes verified brand patterns only for owned company/blog; never personally',()=>{
 const content=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.ok(content.includes("eq('tenant_id','bedrijfsgeheugen')"));
 assert.ok(content.includes("eq('status','PROVEN')"));
 assert.ok(content.includes('verified_brand_content_learnings'));
 assert.ok(content.includes("['linkedin_company','blog']"));
 assert.ok(content.includes('selectVerifiedBrandLearnings'));
});
