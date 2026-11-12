import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../supabase/migrations/20261112140500_original_blog_provider_identity_handoff_v1.sql',import.meta.url),'utf8');
const match=source.match(/v_pub:=coalesce\([\s\S]*?\),false\);/);
test('original blog publishing accepts exact Netlify live proof without a social post ID',()=>{
 assert.ok(match,'preserve original v_pub assignment');
 const src=match[0];
 assert.match(src,/r\.live_proven_at IS NOT NULL/);
 assert.match(src,/r\.status IN \('LIVE_PROVEN','MEASURED','LEARNED'\)/);
 assert.match(src,/r\.channel='blog'/);
 assert.match(src,/r\.canonical_url LIKE 'https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/%'/);
 assert.match(src,/r\.evidence->>'public_http_status'='200'/);
 assert.match(src,/nullif\(r\.evidence->>'netlify_deploy_id',''\) IS NOT NULL/);
 const blog=src.slice(src.indexOf("(r.channel='blog'"),src.indexOf("OR\n         (r.channel IN"));
 assert.ok(!blog.includes('r.external_id'), 'blog proof must not depend on a social external ID');
});
test('existing social post proof is not relaxed and missing outcomes remain due',()=>{
 const src=match[0];
 assert.match(src,/r\.channel IN \('instagram','linkedin_company','linkedin_personal'\)/);
 assert.match(src,/nullif\(r\.external_id,''\) IS NOT NULL/);
 assert.match(src,/r\.evidence->>'provider_truth_verified'='true'/);
 assert.match(source,/v_metric:=false;v_analysis:=false;v_reuse:=false/);
 assert.match(source,/brain_obligations/);
 assert.match(source,/social_learning_obligations/);
 assert.match(source,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
 assert.match(source,/TO service_role/);
 assert.doesNotMatch(source,/CREATE TABLE|cron\.schedule|net\.http_post/i);
});
