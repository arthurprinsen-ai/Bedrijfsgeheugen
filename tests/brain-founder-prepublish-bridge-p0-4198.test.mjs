import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const review = fs.readFileSync(new URL('../supabase/functions/bg-pre-publish-review/index.ts', import.meta.url),'utf8');
const publisher = fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url),'utf8');
test('founder story evidence is shared by publisher and final reviewer',()=>{
  for(const field of ['ai_native_builder_story_verified','ai_native_builder_policy','build_event_verified','arthur_anchor_verified','source_backed','business_topic','source_lineage']) {
    assert.ok(review.includes(field));
    assert.ok(publisher.includes(field));
  }
});
test('builder lane keeps personal, hash, privacy and non-sales checks',()=>{
  assert.match(review,/if \(builderMode\)/);
  assert.match(review,/if \(!builderMode\)/);
  assert.match(review,/FOUNDER_FIRST_PERSON_REQUIRED/);
  assert.match(review,/FOUNDER_SALES_VOICE_BLOCKED/);
  assert.match(review,/FINAL_TEXT_HASH_MISMATCH/);
  assert.match(review,/SENSITIVE_PRIVATE_DETAIL_BLOCK/);
});
