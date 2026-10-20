import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const exportSource=read('supabase/functions/powerhouse-blog-export/index.ts');
const queueSource=read('supabase/functions/powerhouse-blog-queue/index.ts');
const workflow=read('.github/workflows/powerhouse-daily-blog.yml');

test('export always follows newest source-backed blog artifact, never stale obligation slug',()=>{
 assert.match(exportSource,/const slug=clean\(a\.generation_evidence\?\.seo_slug\)\|\|slugify\(clean\(a\.title\)\)/);
 assert.match(exportSource,/BLOG_LINEAGE_MISMATCH_REQUIRES_RECONCILIATION/);
 assert.match(exportSource,/const contentId='blog:'\+slug/);
 assert.match(exportSource,/const canonical='https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/'\+slug\+'\/'/);
});
test('queue only rebinds GENERATED blog state without provider side effects',()=>{
 for(const gate of ["clean(o.status)!=='GENERATED'","clean(o.external_id)","o.published_at","o.live_proven_at","provenance.provider_create_success===true","provenance.republish_forbidden===true","provenance.possible_provider_side_effect===true",".eq('status','GENERATED')",".is('external_id',null)"]) assert.ok(queueSource.includes(gate),gate);
 assert.match(queueSource,/BLOG_LINEAGE_REBIND_FAILED/);
 assert.match(queueSource,/record_content_publication_state/);
});
test('existing GitHub PR branch must be refreshed in place and still require protected checks',()=>{
 assert.match(workflow,/SAME_OBLIGATION_CANDIDATE_REFRESH/);
 assert.match(workflow,/git fetch origin "\$branch"/);
 assert.match(workflow,/gh pr list --head "\$branch" --base main --state open/);
 assert.match(workflow,/gh pr merge "\$pr" --auto --squash/);
 assert.match(workflow,/--validate-cache/);
});
