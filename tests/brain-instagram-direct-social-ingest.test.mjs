import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts', import.meta.url), 'utf8');

test('direct Composio Instagram publish writes canonical social learning row', () => {
  assert.match(source, /async function ingestDirectInstagramSocialPost/);
  assert.match(source, /\.from\('social_posts'\)\.upsert\(post/);
  assert.match(source, /onConflict:'tenant_id,platform,external_post_id'/);
  assert.match(source, /winner_recommendation_id:winner\?\.recommendation_id/);
  assert.match(source, /winner_score_version:clean\(winner\?\.score_version\)/);
  assert.match(source, /format:clean\(winner\?\.selected_format\)\|\|'reel'/);
  assert.match(source, /await db\.rpc\('bg_content_lessen'\)/);
  assert.match(source, /const socialIngest=await ingestDirectInstagramSocialPost\(db,runDate,art,direct,textHash\)/);
});

test('direct social ingest is downstream of provider truth', () => {
  assert.match(source, /DIRECT_INSTAGRAM_SOCIAL_INGEST_REQUIRES_PROVIDER_TRUTH/);
  const publish = source.indexOf("await recordObligation(db,runDate,row.channel,'PUBLISHED',direct.provider_post_id");
  const ingest = source.indexOf('const socialIngest=await ingestDirectInstagramSocialPost');
  assert.ok(publish >= 0 && ingest > publish);
});

test('publisher surface contract covers canonical RPC choke points', () => {
  assert.match(source, /db\.rpc\('bg_geheim'/);
  assert.match(source, /db\.rpc\('bg_content_lessen'\)/);
  assert.match(source, /db\.rpc\('powerhouse_issue_social_publish_capability_v1'/);
  assert.match(source, /db\.rpc\('powerhouse_consume_social_publish_capability_v1'/);
  assert.match(source, /db\.rpc\('record_content_publication_state'/);
});
