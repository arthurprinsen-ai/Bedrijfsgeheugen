import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalBlogSlug} from '../supabase/functions/_shared/canonical-blog-slug.mjs';
test('2026-10-23 title truncation removes trailing separator',()=>{
 assert.equal(canonicalBlogSlug(null,'Cyberdreigingen voor ondernemers: een praktisch beslis- en oefenplan om risico’s bestuurlijk te beheersen','2026-10-23'),'cyberdreigingen-voor-ondernemers-een-praktisch-beslis-en-oefenplan-om');
 assert.match(canonicalBlogSlug(null,'Cyberdreigingen voor ondernemers: een praktisch beslis- en oefenplan om risico’s bestuurlijk te beheersen','2026-10-23'),/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});
test('bounded title, unicode and empty fallback',()=>{
 assert.equal(canonicalBlogSlug(null,'A'.repeat(69)+'-more','2026-10-23'),'a'.repeat(69));
 assert.equal(canonicalBlogSlug(null,' Énergie & Kosten! ','2026-10-23'),'energie-kosten');
 assert.equal(canonicalBlogSlug(null,'!!!','2026-10-23'),'powerhouse-2026-10-23');
});
test('explicit editorial slug is preserved or rejected',()=>{
 assert.equal(canonicalBlogSlug('approved-slug','Different title','2026-10-23'),'approved-slug');
 assert.equal(canonicalBlogSlug('bad-','Title','2026-10-23'),null);
 assert.equal(canonicalBlogSlug('INVALID SLUG','Title','2026-10-23'),null);
});
test('queue and export share one fail-closed rule',()=>{
 for(const name of ['powerhouse-blog-queue','powerhouse-blog-export']){
  const source=readFileSync('supabase/functions/'+name+'/index.ts','utf8');
  assert.match(source,/from '\.\.\/_shared\/canonical-blog-slug\.mjs'/);
  assert.match(source,/canonicalBlogSlug\(/);
  assert.match(source,/INVALID_APPROVED_BLOG_SLUG/);
  assert.doesNotMatch(source,/const slugify=/);
 }
});
test('original GENERATED-only lineage CAS remains intact',()=>{
 const source=readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
 assert.match(source,/canRebindUnsentBlog\(o,provenance\)/);
 assert.match(source,/originalBlogSlugGuard\(recoveryQuery,o\.slug\)/);
 assert.match(source,/\.eq\('status','GENERATED'\)/);
 assert.match(source,/\.is\('external_id',null\)\.is\('published_at',null\)\.is\('live_proven_at',null\)/);
 assert.doesNotMatch(source,/p_status:'LIVE_PROVEN'/);
});
