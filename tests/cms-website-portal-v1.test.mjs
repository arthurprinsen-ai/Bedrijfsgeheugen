import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('CMS database authority is private-by-default and versioned',()=>{
  const sql=read('supabase/migrations/20261002180500_canonical_cms_website_portal_v1.sql');
  assert.match(sql,/create table if not exists public\.cms_content_items/i);
  assert.match(sql,/create table if not exists public\.cms_content_revisions/i);
  assert.match(sql,/alter table public\.cms_content_items enable row level security/i);
  assert.match(sql,/alter table public\.cms_content_revisions enable row level security/i);
  assert.match(sql,/revoke all on table public\.cms_content_items from anon, authenticated/i);
  assert.match(sql,/revoke all on table public\.cms_content_revisions from anon, authenticated/i);
  assert.match(sql,/status text not null default 'draft'/i);
});

test('CMS public API is read-only and admin API requires admin identity',()=>{
  const pub=read('netlify/functions/cms-public.mjs');
  const admin=read('netlify/functions/cms-admin.mjs');
  assert.match(pub,/request\.method!=='GET'/);
  assert.match(pub,/action:'cms_public'/);
  assert.match(admin,/getUser/);
  assert.match(admin,/hasAdminRole/);
  assert.match(admin,/FORBIDDEN/);
  assert.match(admin,/cms_admin_publish/);
});

test('CMS authority exposes only published content publicly',()=>{
  const edge=read('supabase/functions/portal-state-eu/index.ts');
  assert.match(edge,/action==='cms_public'/);
  assert.match(edge,/\.eq\('status','published'\)/);
  assert.match(edge,/cms_admin_save/);
  assert.match(edge,/cms_admin_publish/);
  assert.match(edge,/cms_content_revisions/);
});

test('CMS source files contain real line breaks, not escaped line-break artifacts',()=>{
  assert.doesNotMatch(read('cms.html'),/noindex,nofollow\">\\\\n<meta/);
  assert.doesNotMatch(read('supabase/functions/portal-state-eu/index.ts'),/;\\\\n\s+if\(action/);
});

test('CMS runtime and admin surface are wired into the build',()=>{
  const runtime=read('assets/cms-runtime.js');
  const admin=read('assets/cms-admin.js');
  const toml=read('netlify.toml');
  assert.match(runtime,/\/api\/cms-public/);
  assert.match(runtime,/sanitizeHtml/);
  assert.match(admin,/\/api\/cms-admin/);
  assert.match(admin,/startPick/);
  assert.match(toml,/apply-cms-runtime\.mjs/);
});

test('CMS admin route is excluded from public shell projection',()=>{
  const contracts=read('tools/site-shell/contracts.mjs');
  const normalizer=read('tools/normaliseer-site-ui.mjs');
  assert.match(contracts,/PUBLIC_PAGE_EXCLUDES[\s\S]*'cms\.html'/);
  assert.match(normalizer,/MAG_NIET[\s\S]*'cms\.html'/);
});


test('CMS admin selector helpers remain distinct',()=>{
  const admin=read('assets/cms-admin.js');
  assert.match(admin,/var \$=function\(s,r\)\{return \(r\|\|document\)\.querySelector\(s\)\}/);
  assert.match(admin,/var \$\$=function\(s,r\)\{return \[\.\.\.\(r\|\|document\)\.querySelectorAll\(s\)\]\}/);
  assert.doesNotMatch(admin,/var \$=function\(s,r\)\{return \[\.\.\.\(r\|\|document\)\.querySelectorAll/);
});
