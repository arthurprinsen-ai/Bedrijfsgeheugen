import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cmsReviewStatus} from '../assets/cms-review-contract.mjs';

const at='2026-10-30T19:45:04Z';
const row=(surface,status)=>({surface,status});
test('six existing draft content items are not CMS published nor a software-release approval',()=>{
 const status=cmsReviewStatus([row('portal','draft'),row('shared','draft'),row('shared','draft'),
  row('shared','draft'),row('website','draft'),row('website','draft')],{generatedAt:at});
 assert.equal(status.status,'PORTAL_CONTENT_NOT_PUBLISHED');
 assert.equal(status.total,6);
 assert.equal(status.published,0);
 assert.equal(status.draft,6);
 assert.equal(status.portalDraft,4);
 assert.equal(status.portalPublished,0);
 assert.equal(status.releaseApproved,false);
});
test('publishing a shared or portal content element never autoapproves software release or hides drafts',()=>{
 let state=cmsReviewStatus([row('portal','published'),row('shared','draft'),row('website','published')],{generatedAt:at});
 assert.equal(state.status,'PORTAL_CONTENT_REVIEW_PENDING');
 assert.equal(state.published,2);
 assert.equal(state.portalPublished,1);
 assert.equal(state.portalDraft,1);
 assert.equal(state.releaseApproved,false);
 state=cmsReviewStatus([row('portal','published'),row('shared','archived')],{generatedAt:at});
 assert.equal(state.status,'PORTAL_CONTENT_PUBLISHED');
 assert.equal(state.releaseApproved,false);
});
test('missing/unverified CMS readbacks fail closed rather than pretending zero drafts or green approval',()=>{
 for(const rows of [undefined,null,{},[{surface:'portal',status:'approved'}]])
  assert.equal(cmsReviewStatus(rows,{generatedAt:at}).status,'UNAVAILABLE');
 assert.equal(cmsReviewStatus([row('portal','published')]).status,'UNAVAILABLE');
 assert.equal(cmsReviewStatus([],{generatedAt:at}).status,'PORTAL_CONTENT_NOT_PUBLISHED');
});
test('status is projected through existing CMS admin readback with authenticated server route only',async()=>{
 const [ui,html,admin,edge,pub]=await Promise.all([
  readFile(new URL('../assets/cms-admin.js',import.meta.url),'utf8'),
  readFile(new URL('../cms.html',import.meta.url),'utf8'),
  readFile(new URL('../netlify/functions/cms-admin.mjs',import.meta.url),'utf8'),
  readFile(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8'),
  readFile(new URL('../netlify/functions/cms-public.mjs',import.meta.url),'utf8')
 ]);
 assert.match(ui,/import\('\/assets\/cms-review-contract\.mjs'\)/);
 assert.match(ui,/renderCmsReview/);
 assert.match(html,/id="cmsReview"/);
 assert.match(admin,/hasAdminRole\(user\)/);
 assert.match(edge,/\.eq\('status','published'\)/);
 assert.match(pub,/cmsGateway\(\{action:'cms_public'/);
 assert.doesNotMatch(ui,/['"]action['"]\s*:\s*['"]publish['"]/i);
});
