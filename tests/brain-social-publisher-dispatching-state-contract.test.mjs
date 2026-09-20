import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20260920102000_social_publisher_dispatching_state_contract.sql','utf8');

test('social publisher atomic claim state is allowed by database contract',()=>{
  assert.match(publisher,/state: 'dispatching'/);
  assert.match(migration,/'dispatching'::text/);
  assert.match(migration,/powerhouse_channel_decisions_state_chk/);
});

test('dispatching claim remains before external provider side effects',()=>{
  const claimIndex=publisher.indexOf("state: 'dispatching'");
  const instagramPublishIndex=publisher.indexOf('publishInstagramViaComposio');
  const bufferCreateIndex=publisher.indexOf('createPost(bufferToken');
  assert.ok(claimIndex>=0);
  assert.ok(instagramPublishIndex>claimIndex);
  assert.ok(bufferCreateIndex>claimIndex);
});
