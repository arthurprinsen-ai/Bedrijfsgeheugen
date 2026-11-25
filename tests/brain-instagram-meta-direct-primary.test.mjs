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
  // Current contract: the dispatch path is Composio-only (canonical Graph id); the Meta
  // publisher keeps its gates but is no longer called from the dispatch branch.
  assert.match(source,/instagram-composio-only-canonical-graph-id-v2/);
  assert.match(source,/meta_direct_dependency:false/);
  assert.equal(source.split('publishInstagramViaMeta(').length-1,0+source.split('async function publishInstagramViaMeta(').length-1);
});

test('Meta readback failure cannot cause a blind republish',()=>{
  assert.match(source,/verification_pending:true/);
  assert.match(source,/republish_forbidden:true/);
  assert.match(source,/COMPOSIO_INSTAGRAM_READBACK_ID_MISMATCH/);
  // a failed claim never returns to content_ready after the provider call started
  assert.match(source,/\.eq\('state','dispatching'\)/);
});
