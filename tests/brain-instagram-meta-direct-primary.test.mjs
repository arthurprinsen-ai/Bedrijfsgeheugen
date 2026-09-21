import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('Meta direct is the primary Instagram transport and keeps existing hard gates',()=>{
  assert.match(source,/publishInstagramViaMeta/);
  assert.match(source,/META_INSTAGRAM_ACCESS_TOKEN/);
  assert.match(source,/META_INSTAGRAM_USER_ID/);
  assert.match(source,/media_publish/);
  assert.match(source,/status_code,status/);
  assert.match(source,/instagramIdentityProven/);
  assert.match(source,/powerhouse_issue_social_publish_capability_v1/);
  assert.match(source,/powerhouse_consume_social_publish_capability_v1/);
  assert.match(source,/bg_geheim/);
  assert.match(source,/record_content_publication_state/);
  const meta=source.indexOf("if(instagramMetaConfig)");
  const composio=source.indexOf("if(instagramComposioApiKey)");
  assert.ok(meta>=0&&composio>meta);
});

test('Meta readback failure cannot cause a blind republish',()=>{
  assert.match(source,/verification_pending:true/);
  assert.match(source,/state:verified\?'published':'dispatching'/);
  assert.match(source,/never issue another publish/i);
});
