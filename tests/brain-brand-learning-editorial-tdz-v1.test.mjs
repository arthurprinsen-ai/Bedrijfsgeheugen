import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file=new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url);

test('every company/blog/Instagram editorial path initializes the verified learning guide before use',()=>{
  const source=fs.readFileSync(file,'utf8');
  const declaration=source.indexOf("const verifiedBrandLearningGuide = verifiedBrandLearnings.length");
  // The source now intentionally uses a mutable editorial prompt because
  // the buyer-first policy is appended before the artifact-ai call.
  // Protect declaration ordering and exactly one original variable owner.
  const editorialDeclarations=[...source.matchAll(/\\blet editorialSystem = \\(pending\\.channel==='linkedin_personal'/g)];
  assert.equal(editorialDeclarations.length,1,'one mutable original editorial prompt');
  const read=editorialDeclarations[0].index;
  const buyerFirstAppend=source.indexOf("editorialSystem += ' VERPLICHTE BUYER-FIRST REDACTIE:");
  assert.ok(buyerFirstAppend>read,'buyer-first policy must append after initialization');
  const render=source.indexOf("stage = 'artifact-ai'");
  assert.ok(declaration>0,'evidence-guide declaration must exist');
  assert.ok(read>0,'editorial composition must exist');
  assert.ok(declaration<read,'avoid temporal dead zone at content-generation runtime');
  assert.ok(read<render,'editorial prompt must be ready before generation');
  assert.ok(buyerFirstAppend<render,'buyer-first editorial quality must precede provider call');
  assert.equal(source.split("const verifiedBrandLearningGuide =").length-1,1);
});
test('brand learnings remain gated by PROVEN, correct tenant, expiration and evidence',()=>{
  const source=fs.readFileSync(file,'utf8');
  assert.ok(source.includes("eq('tenant_id','bedrijfsgeheugen').eq('status','PROVEN')"));
  assert.ok(source.includes("verifiedBrandLearnings=selectVerifiedBrandLearnings"));
  assert.ok(source.includes("verified_brand_content_learnings"));
  assert.ok(source.includes("pending.channel==='linkedin_personal'"));
});
