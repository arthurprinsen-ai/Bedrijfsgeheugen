import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const review = fs.readFileSync(new URL('../supabase/functions/bg-pre-publish-review/index.ts', import.meta.url),'utf8');
const publisher = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url),'utf8');
test('founder story evidence is shared by publisher and final reviewer',()=>{
  for(const field of ['ai_native_builder_story_verified','ai_native_builder_policy','build_event_verified','arthur_anchor_verified','business_topic','source_lineage']) {
    assert.ok(review.includes(field));
    assert.ok(publisher.includes(field));
  }
});
test('builder lane keeps personal, hash, privacy and non-sales checks',()=>{
  assert.match(review,/if \(builderMode\)/);
  assert.match(review,/if \(!builderMode\)/);
  assert.match(review,/AI_NATIVE_FIRST_PERSON_REQUIRED/);
  assert.match(review,/AI_NATIVE_SALES_PITCH_BLOCKED/);
  assert.match(review,/FINAL_TEXT_HASH_MISMATCH/);
  assert.match(review,/SENSITIVE_PRIVATE_DETAIL_BLOCK/);
});
test('runtime source parity: guard first-person builder, provenance, technical jargon and no sales',()=>{
  assert.match(review,/AI_NATIVE_BUILDER_POLICY_REQUIRED/);
  assert.match(review,/BUILD_EVENT_UNVERIFIED/);
  assert.match(review,/ARTHUR_ANCHOR_UNVERIFIED/);
  assert.match(review,/AI_NATIVE_TECHNICAL_JARGON_BLOCKED/);
  assert.match(review,/AI_NATIVE_BUSINESS_CONTEXT_REQUIRED/);
  assert.match(review,/FINAL_TEXT_BUSINESS_SIGNAL_BLOCK/);
  assert.match(review,/PREDICTION_LINEAGE_REQUIRED/);
  assert.match(review,/SOURCE_LINEAGE_REQUIRED/);
});
