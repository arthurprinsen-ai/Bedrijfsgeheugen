import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('SEO revenue learning is canonical, production-proven and skill projected', async()=>{
  const learning=JSON.parse(await read('brain/learning/2026-09-19-seo-revenue-intent-owner-first-v1.json'));
  assert.equal(learning.fingerprint,'seo|revenue-growth|intent-owner-first|v1');
  assert.equal(learning.status,'ACTIVE_PREVENTION');
  assert.equal(learning.compiler.failure_class,'METADATA_DRIFT');
  assert.equal(learning.compiler.scope,'GITHUB');
  assert.equal(learning.evidence.production_state,'ready');
  assert.equal(learning.evidence.production_commit_ref,'1a8169c82dbbe2238e62a4f91de8600db193903e');
  assert.deepEqual(learning.evidence.merged_prs,[2389,2396,2399]);
});

test('SEO revenue skill preserves intent-owner-first and terminal proof rules', async()=>{
  const skill=await read('.agents/skills/seo-revenue-growth/SKILL.md');
  assert.match(skill,/Search intent has one canonical owner/i);
  assert.match(skill,/new content/i);
  assert.match(skill,/DataForSEO/i);
  assert.match(skill,/Do not claim LIVE & BEWEZEN/i);
  assert.match(skill,/canonical PR delivery lanes/i);
});

test('delivery metadata prevention names only canonical delivery lanes', async()=>{
  const [learningRaw,policyRaw]=await Promise.all([
    read('brain/learning/2026-09-19-seo-revenue-intent-owner-first-v1.json'),
    read('config/powerhouse-delivery-hygiene-v1.json')
  ]);
  const learning=JSON.parse(learningRaw);
  const policy=JSON.parse(policyRaw);
  assert.ok(policy.allowedLanes.includes('backend'));
  assert.ok(policy.allowedLanes.includes('website'));
  assert.ok(policy.allowedLanes.includes('docs'));
  assert.ok(!policy.allowedLanes.includes('seo-growth'));
  assert.ok(!policy.allowedLanes.includes('seo-content'));
  assert.ok(learning.prevention.some(rule=>rule.includes('DELIVERY_METADATA_USES_CANONICAL_LANES')));
});
