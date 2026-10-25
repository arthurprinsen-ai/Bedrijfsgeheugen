import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');
test('daily blog keeps its one original GitHub scheduler active',()=>{
 assert.match(src,/cron: '11 \* \* \* \*'/);
 assert.match(src,/group: powerhouse-daily-blog/);
 assert.match(src,/cancel-in-progress: false/);
 assert.match(src,/workflow_dispatch:/);
});
test('same-date reviewed candidate is checked out before content rendering',()=>{
 const i=src.indexOf('- name: Reuse the existing writer for this obligation');
 const j=src.indexOf('- name: Render canonical Powerhouse artifact');
 const section=src.slice(i,j);
 assert.match(section,/git fetch origin "\$branch"/);
 assert.match(section,/git checkout -B "\$branch" "origin\/\$branch"/);
 assert.match(section,/SAME_OBLIGATION_CANDIDATE_PRESERVED/);
 assert.ok(j>i);
});
test('create step fails closed rather than overwriting existing published candidate',()=>{
 const i=src.indexOf('- name: Create exactly one protected candidate');
 const j=src.indexOf('- name: Persist English cache before protected CI');
 const section=src.slice(i,j);
 assert.match(section,/EXISTING_PR: \$\{\{ steps\.writer\.outputs\.existing_pr \|\| '' \}\}/);
 assert.match(section,/EXISTING_DAILY_BLOG_REQUIRES_IN_PLACE_REFRESH/);
 assert.ok(section.indexOf('EXISTING_DAILY_BLOG_REQUIRES_IN_PLACE_REFRESH')<section.indexOf('git checkout -B "$branch"'));
 assert.match(section,/git push --force-with-lease/);
});
test('existing candidate cache is read-only validated and never silently retranslated',()=>{
 const i=src.indexOf('- name: Persist English cache before protected CI');
 const j=src.indexOf('- name: Self-heal required checks for the canonical daily candidate');
 const section=src.slice(i,j);
 assert.match(section,/CANONICAL_EXISTING_CANDIDATE_CACHE_PRESERVED/);
 assert.match(section,/STATIC_I18N_NETWORK=0 STATIC_I18N_REQUIRE_CACHE=1/);
 assert.match(section,/build-localized-routes\.mjs --validate-cache/);
 assert.ok(section.indexOf('CANONICAL_EXISTING_CANDIDATE_CACHE_PRESERVED')<section.indexOf('STATIC_I18N_NETWORK=1 node tools\/ci\/netlify-build-entry.mjs'));
});
test('protected gates and single-date identity remain authoritative',()=>{
 assert.match(src,/gh pr merge "\$pr" --auto --squash/);
 assert.match(src,/gh workflow run required-test\.yml/);
 assert.match(src,/Obligation-ID: content-publication:\$DATE:blog/);
});
